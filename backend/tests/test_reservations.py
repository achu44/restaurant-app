import threading

from sqlalchemy import func, select

from app.db import db
from app.models import Customer, Reservation

from .conftest import booking


def test_successful_booking_assigns_table_and_stores_customer(client, future_slot):
    res = client.post(
        "/api/reservations",
        json=booking(future_slot, phone="(202) 555-0100", guests=4, newsletter=True),
    )
    assert res.status_code == 201, res.json
    data = res.json["reservation"]
    assert 1 <= data["table_number"] <= 30
    assert data["guests"] == 4

    customer = db.session.scalars(select(Customer)).one()
    assert customer.customer_name == "Guest 0"
    assert customer.phone_number == "(202) 555-0100"
    assert customer.newsletter_signup is True
    reservation = db.session.scalars(select(Reservation)).one()
    assert reservation.customer_id == customer.customer_id
    assert reservation.time_slot == future_slot


def test_validation_errors_are_reported_per_field(client):
    res = client.post(
        "/api/reservations",
        json={"name": "", "email": "nope", "guests": 0, "time_slot": "", "phone": "abc"},
    )
    assert res.status_code == 400
    assert set(res.json["fields"]) == {"name", "email", "guests", "time_slot", "phone"}


def test_rejects_slot_outside_opening_hours(client, future_slot):
    res = client.post("/api/reservations", json=booking(future_slot.replace(hour=13)))
    assert res.status_code == 400
    assert res.json["error"] == "invalid_slot"


def test_slot_fills_after_30_tables(client, future_slot):
    tables = set()
    for i in range(30):
        res = client.post("/api/reservations", json=booking(future_slot, i))
        assert res.status_code == 201
        tables.add(res.json["reservation"]["table_number"])
    assert tables == set(range(1, 31))

    res = client.post("/api/reservations", json=booking(future_slot, 99))
    assert res.status_code == 409
    assert res.json["error"] == "slot_full"
    assert "another time" in res.json["message"]

    other = future_slot.replace(hour=20)
    assert client.post("/api/reservations", json=booking(other, 99)).status_code == 201


def test_same_customer_cannot_double_book_a_slot(client, future_slot):
    assert client.post("/api/reservations", json=booking(future_slot)).status_code == 201
    res = client.post(
        "/api/reservations", json=booking(future_slot, email="GUEST0@example.com")
    )
    assert res.status_code == 409
    assert res.json["error"] == "duplicate_booking"


def test_returning_customer_reuses_customer_record(client, future_slot):
    client.post("/api/reservations", json=booking(future_slot))
    client.post(
        "/api/reservations",
        json=booking(future_slot.replace(hour=20), name="Guest Renamed"),
    )
    customers = db.session.scalars(select(Customer)).all()
    assert len(customers) == 1
    assert customers[0].customer_name == "Guest Renamed"


def test_availability_reflects_bookings(client, future_slot):
    client.post("/api/reservations", json=booking(future_slot))
    res = client.get(f"/api/availability?date={future_slot.date().isoformat()}")
    assert res.status_code == 200
    slot = next(
        s for s in res.json["slots"] if s["time_slot"] == future_slot.isoformat(timespec="minutes")
    )
    assert slot["tables_remaining"] == 29
    assert slot["available"] is True


def test_concurrent_bookings_never_overbook(app, future_slot):
    """40 simultaneous requests for one slot: exactly 30 succeed, each on a distinct table."""
    statuses = []
    lock = threading.Lock()
    barrier = threading.Barrier(40)

    def worker(i):
        c = app.test_client()
        barrier.wait()
        res = c.post("/api/reservations", json=booking(future_slot, i))
        with lock:
            statuses.append(res.status_code)

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(40)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert statuses.count(201) == 30
    assert statuses.count(409) == 10
    db.session.remove()
    count, distinct = db.session.execute(
        select(func.count(), func.count(func.distinct(Reservation.table_number))).where(
            Reservation.time_slot == future_slot
        )
    ).one()
    assert count == distinct == 30
