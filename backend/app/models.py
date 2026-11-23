"""Database models.

Table and column names follow the SRS (FR-17):
  customers    – Customer ID, Customer Name, Email Address, Phone Number, Newsletter Signup
  reservations – Reservation ID, Customer ID, Time Slot, Table Number (+ guest count)
"""

from sqlalchemy import CheckConstraint, UniqueConstraint, func

from .db import db

TOTAL_TABLES = 30
MAX_GUESTS = 8


class Customer(db.Model):
    __tablename__ = "customers"

    customer_id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(120))  # nullable: newsletter-only sign-ups
    email = db.Column(db.String(254), nullable=False, unique=True)  # stored lower-case
    phone_number = db.Column(db.String(30))
    newsletter_signup = db.Column(db.Boolean, nullable=False, default=False, server_default="false")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=func.now())

    reservations = db.relationship(
        "Reservation", back_populates="customer", cascade="all, delete-orphan", passive_deletes=True
    )


class Reservation(db.Model):
    __tablename__ = "reservations"
    __table_args__ = (
        # A physical table can only be assigned once per time slot (prevents double booking).
        # Its index (time_slot first) also serves "all bookings for a slot" lookups.
        UniqueConstraint("time_slot", "table_number", name="uq_reservation_slot_table"),
        # A customer can only hold one reservation per time slot.
        UniqueConstraint("customer_id", "time_slot", name="uq_reservation_customer_slot"),
        CheckConstraint(f"table_number BETWEEN 1 AND {TOTAL_TABLES}", name="ck_table_number_range"),
        CheckConstraint(f"guest_count BETWEEN 1 AND {MAX_GUESTS}", name="ck_guest_count_range"),
    )

    reservation_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(
        db.Integer, db.ForeignKey("customers.customer_id", ondelete="CASCADE"), nullable=False
    )
    # Restaurant-local wall-clock time (Washington, DC). Slots are discrete 30-minute seatings.
    time_slot = db.Column(db.DateTime(timezone=False), nullable=False)
    table_number = db.Column(db.SmallInteger, nullable=False)
    guest_count = db.Column(db.SmallInteger, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=func.now())

    customer = db.relationship("Customer", back_populates="reservations")
