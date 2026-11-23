"""Opening hours and reservation time-slot rules.

Hours (SRS FR-2): Monday–Saturday 5:00 PM – 11:00 PM, Sunday 5:00 PM – 9:00 PM.
Seatings start every 30 minutes; the last seating is one hour before closing.
All times are restaurant-local (America/New_York).
"""

from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

RESTAURANT_TZ = ZoneInfo("America/New_York")
SLOT_MINUTES = 30
LAST_SEATING_BEFORE_CLOSE = timedelta(hours=1)
BOOKING_HORIZON_DAYS = 60

# weekday() -> (open, close); Monday == 0 ... Sunday == 6
OPENING_HOURS = {
    **{d: (time(17, 0), time(23, 0)) for d in range(6)},
    6: (time(17, 0), time(21, 0)),
}


def now_local() -> datetime:
    """Current restaurant-local time as a naive datetime (matches the DB column)."""
    return datetime.now(RESTAURANT_TZ).replace(tzinfo=None)


def slots_for_date(day: date) -> list[datetime]:
    """All seating times offered on ``day`` (regardless of whether they're in the past)."""
    open_t, close_t = OPENING_HOURS[day.weekday()]
    current = datetime.combine(day, open_t)
    last = datetime.combine(day, close_t) - LAST_SEATING_BEFORE_CLOSE
    slots = []
    while current <= last:
        slots.append(current)
        current += timedelta(minutes=SLOT_MINUTES)
    return slots


def slot_error(slot: datetime, now: datetime | None = None) -> str | None:
    """Return a human-readable reason ``slot`` can't be booked, or None if it is valid."""
    now = now or now_local()
    if slot not in slots_for_date(slot.date()):
        return "Please choose one of our seating times (every 30 minutes during opening hours)."
    if slot <= now:
        return "That time has already passed. Please choose a future time."
    if slot.date() > now.date() + timedelta(days=BOOKING_HORIZON_DAYS):
        return f"Reservations open {BOOKING_HORIZON_DAYS} days in advance. Please choose an earlier date."
    return None
