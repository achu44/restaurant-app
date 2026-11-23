"""Input validation shared by the API routes.

Each validator returns ``(clean_value, error_message_or_None)``.
"""

import re
from datetime import date, datetime

from .models import MAX_GUESTS

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$")
PHONE_ALLOWED_RE = re.compile(r"^[0-9+()\-.\s]+$")


class ValidationError(Exception):
    """Raised with a dict of ``{field: message}``."""

    def __init__(self, fields: dict[str, str]):
        super().__init__("Validation failed")
        self.fields = fields


def clean_email(value):
    email = (value or "").strip().lower() if isinstance(value, str) else ""
    if not email:
        return None, "Email address is required."
    if len(email) > 254 or not EMAIL_RE.match(email):
        return None, "Please enter a valid email address."
    return email, None


def clean_name(value, required=True):
    name = " ".join(value.split()) if isinstance(value, str) else ""
    if not name:
        return None, ("Name is required." if required else None)
    if len(name) > 120:
        return None, "Name must be 120 characters or fewer."
    return name, None


def clean_phone(value):
    phone = value.strip() if isinstance(value, str) else ""
    if not phone:
        return None, None  # optional
    digits = re.sub(r"\D", "", phone)
    if not PHONE_ALLOWED_RE.match(phone) or not 7 <= len(digits) <= 15 or len(phone) > 30:
        return None, "Please enter a valid phone number."
    return phone, None


def clean_guests(value):
    try:
        guests = int(value)
    except (TypeError, ValueError):
        return None, "Number of guests is required."
    if isinstance(value, bool) or not 1 <= guests <= MAX_GUESTS:
        return None, f"Parties of 1–{MAX_GUESTS} guests can book online. Please call us for larger groups."
    return guests, None


def clean_time_slot(value):
    if not isinstance(value, str) or not value.strip():
        return None, "Please choose a date and time."
    try:
        slot = datetime.fromisoformat(value.strip())
    except ValueError:
        return None, "Invalid date/time format."
    # Drop any timezone: slots are restaurant-local wall-clock times.
    return slot.replace(tzinfo=None), None


def clean_date(value):
    try:
        return date.fromisoformat(value), None
    except (TypeError, ValueError):
        return None, "Please provide a date in YYYY-MM-DD format."
