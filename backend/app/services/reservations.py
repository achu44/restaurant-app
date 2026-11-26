"""Reservation booking logic (SRS FR-7, FR-8, FR-9, FR-18, NFR-5).

Algorithm (single transaction):
  1. Validate the slot against opening hours / seating times / booking window.
  2. Take a PostgreSQL transaction-level advisory lock keyed on the slot, so concurrent
     bookings for the *same* slot are serialised (different slots don't block each other).
  3. Upsert the customer by e-mail.
  4. Reject if this customer already holds a table in that slot.
  5. Compute free tables = {1..30} − taken; if none, report the slot as fully booked.
  6. Assign a random free table and insert the reservation.
The UNIQUE (time_slot, table_number) constraint is a final database-level guarantee.
"""

import random
from dataclasses import dataclass
from datetime import date, datetime

from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError

from ..db import db
from ..models import TOTAL_TABLES, Reservation
from ..schedule import now_local, slot_error, slots_for_date
from .customers import upsert_customer

ALL_TABLES = frozenset(range(1, TOTAL_TABLES + 1))


class BookingError(Exception):
    """A business-rule failure that should be shown to the guest."""

    def __init__(self, code: str, message: str, status: int = 409):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status


@dataclass
class BookingResult:
    reservation: Reservation
    customer_created: bool


def _lock_slot(slot: datetime) -> None:
    key = int(slot.timestamp() // 60)  # minutes since epoch: unique per slot, fits in bigint
    db.session.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": key})


def taken_tables(slot: datetime) -> set[int]:
    rows = db.session.scalars(
        select(Reservation.table_number).where(Reservation.time_slot == slot)
    )
    return set(rows)


def book_reservation(*, name, email, phone, guests, time_slot, newsletter=False, rng=random):
    reason = slot_error(time_slot)
    if reason:
        raise BookingError("invalid_slot", reason, status=400)

    try:
        _lock_slot(time_slot)
        customer, created, _ = upsert_customer(
            email, name=name, phone=phone, newsletter=newsletter
        )

        existing = db.session.scalar(
            select(Reservation).where(
                Reservation.customer_id == customer.customer_id,
                Reservation.time_slot == time_slot,
            )
        )
        if existing:
            raise BookingError(
                "duplicate_booking",
                "You already have a reservation at this time "
                f"(table {existing.table_number}). Please choose a different time.",
            )

        free = sorted(ALL_TABLES - taken_tables(time_slot))
        if not free:
            raise BookingError(
                "slot_full",
                "All 30 tables are booked for this time. Please choose another time.",
            )

        reservation = Reservation(
            customer_id=customer.customer_id,
            time_slot=time_slot,
            table_number=rng.choice(free),
            guest_count=guests,
        )
        db.session.add(reservation)
        db.session.commit()
        return BookingResult(reservation, created)
    except BookingError:
        db.session.rollback()
        raise
    except IntegrityError:
        # Should be unreachable thanks to the advisory lock, but never double-book.
        db.session.rollback()
        raise BookingError(
            "conflict",
            "That table was just taken. Please submit your reservation again.",
        )


def availability_for_date(day: date) -> list[dict]:
    """Seatings for ``day`` with the number of tables still free."""
    slots = slots_for_date(day)
    if not slots:
        return []
    counts = dict(
        db.session.execute(
            select(Reservation.time_slot, func.count())
            .where(Reservation.time_slot.in_(slots))
            .group_by(Reservation.time_slot)
        ).all()
    )
    now = now_local()
    result = []
    for slot in slots:
        remaining = TOTAL_TABLES - counts.get(slot, 0)
        reason = slot_error(slot, now)
        result.append(
            {
                "time_slot": slot.isoformat(timespec="minutes"),
                "label": slot.strftime("%I:%M %p").lstrip("0"),
                "tables_remaining": remaining,
                "available": reason is None and remaining > 0,
                "status": _status(slot, now, remaining, reason),
            }
        )
    return result


def _status(slot, now, remaining, reason):
    if slot <= now:
        return "past"
    if reason:
        return "unavailable"
    return "full" if remaining == 0 else "open"
