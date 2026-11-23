"""REST API endpoints, mounted under /api."""

from datetime import timedelta

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from .db import db
from .schedule import BOOKING_HORIZON_DAYS, OPENING_HOURS, now_local
from .services.newsletter import subscribe
from .services.reservations import BookingError, availability_for_date, book_reservation
from .validation import (
    ValidationError,
    clean_date,
    clean_email,
    clean_guests,
    clean_name,
    clean_phone,
    clean_time_slot,
)

api = Blueprint("api", __name__, url_prefix="/api")


def _json_body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValidationError({"_": "Request body must be a JSON object."})
    return data


def _collect(**results):
    """Turn {field: (value, error)} into clean values, raising ValidationError on any error."""
    errors = {k: err for k, (_, err) in results.items() if err}
    if errors:
        raise ValidationError(errors)
    return {k: v for k, (v, _) in results.items()}


@api.get("/health")
def health():
    db.session.execute(text("SELECT 1"))
    return {"status": "ok"}


@api.get("/availability")
def availability():
    day, err = clean_date(request.args.get("date"))
    if err:
        raise ValidationError({"date": err})
    today = now_local().date()
    return {
        "date": day.isoformat(),
        "bookable_from": today.isoformat(),
        "bookable_until": (today + timedelta(days=BOOKING_HORIZON_DAYS)).isoformat(),
        "hours": {
            "open": OPENING_HOURS[day.weekday()][0].strftime("%H:%M"),
            "close": OPENING_HOURS[day.weekday()][1].strftime("%H:%M"),
        },
        "slots": availability_for_date(day),
    }


@api.post("/reservations")
def create_reservation():
    data = _json_body()
    v = _collect(
        name=clean_name(data.get("name")),
        email=clean_email(data.get("email")),
        phone=clean_phone(data.get("phone")),
        guests=clean_guests(data.get("guests")),
        time_slot=clean_time_slot(data.get("time_slot")),
    )
    result = book_reservation(**v, newsletter=bool(data.get("newsletter")))
    r = result.reservation
    return (
        jsonify(
            {
                "message": "Your table is reserved. We look forward to welcoming you!",
                "reservation": {
                    "reservation_id": r.reservation_id,
                    "customer_id": r.customer_id,
                    "name": v["name"],
                    "email": v["email"],
                    "time_slot": r.time_slot.isoformat(timespec="minutes"),
                    "guests": r.guest_count,
                    "table_number": r.table_number,
                },
            }
        ),
        201,
    )


@api.post("/newsletter")
def newsletter_signup():
    data = _json_body()
    v = _collect(
        email=clean_email(data.get("email")),
        name=clean_name(data.get("name"), required=False),
    )
    _customer, status = subscribe(v["email"], v["name"])
    if status == "already_subscribed":
        return {"status": status, "message": "You're already on our list — thank you!"}, 200
    return {"status": status, "message": "Thank you for subscribing to our newsletter!"}, 201


# --- error handling (NFR-6: fail in a user-friendly way) -------------------------------


@api.errorhandler(ValidationError)
def handle_validation(err):
    return {
        "error": "validation_error",
        "message": "Please correct the highlighted fields.",
        "fields": err.fields,
    }, 400


@api.errorhandler(BookingError)
def handle_booking(err):
    return {"error": err.code, "message": err.message}, err.status
