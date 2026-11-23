from datetime import datetime, timedelta

import pytest

from app import create_app
from app.config import TestConfig
from app.db import db
from app.schedule import now_local


@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.drop_all()
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def future_slot():
    """A valid seating ~2 weeks out (a Tuesday at 7:00 PM)."""
    day = now_local().date() + timedelta(days=14)
    while day.weekday() != 1:
        day += timedelta(days=1)
    return datetime.combine(day, datetime.min.time()).replace(hour=19)


def booking(slot, i=0, **overrides):
    body = {
        "name": f"Guest {i}",
        "email": f"guest{i}@example.com",
        "phone": "",
        "guests": 2,
        "time_slot": slot.isoformat(timespec="minutes"),
    }
    body.update(overrides)
    return body
