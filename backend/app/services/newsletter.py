"""Newsletter sign-up (SRS FR-15, FR-16): stored as customers.newsletter_signup = TRUE."""

from ..db import db
from .customers import upsert_customer


def subscribe(email, name=None):
    """Returns ``(customer, status)`` where status is 'subscribed' or 'already_subscribed'."""
    customer, _created, was_subscribed = upsert_customer(email, name=name, newsletter=True)
    db.session.commit()
    return customer, ("already_subscribed" if was_subscribed else "subscribed")
