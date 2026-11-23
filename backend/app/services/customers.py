"""Customer upsert, shared by reservations and newsletter sign-ups."""

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from ..db import db
from ..models import Customer


def upsert_customer(email, name=None, phone=None, newsletter=False):
    """Find the customer by e-mail (the natural key) or create one, race-safely.

    Uses ``INSERT ... ON CONFLICT (email) DO NOTHING`` followed by ``SELECT ... FOR UPDATE``
    so two simultaneous requests for a new e-mail can't create duplicates or crash.
    Name/phone are refreshed when supplied; newsletter_signup is only ever switched on.
    Returns ``(customer, created, was_subscribed)``. Does not commit.
    """
    inserted_id = db.session.scalar(
        insert(Customer)
        .values(email=email, newsletter_signup=False)
        .on_conflict_do_nothing(index_elements=["email"])
        .returning(Customer.customer_id)
    )
    customer = db.session.scalars(
        select(Customer)
        .where(Customer.email == email)
        .with_for_update()
        .execution_options(populate_existing=True)
    ).one()
    was_subscribed = customer.newsletter_signup
    if name:
        customer.customer_name = name
    if phone:
        customer.phone_number = phone
    if newsletter:
        customer.newsletter_signup = True
    db.session.flush()
    return customer, inserted_id is not None, was_subscribed
