from sqlalchemy import select

from app.db import db
from app.models import Customer


def test_signup_stores_email(client):
    res = client.post("/api/newsletter", json={"email": "  Food.Lover@Example.com "})
    assert res.status_code == 201
    customer = db.session.scalars(select(Customer)).one()
    assert customer.email == "food.lover@example.com"
    assert customer.newsletter_signup is True


def test_duplicate_signup_is_friendly(client):
    client.post("/api/newsletter", json={"email": "a@example.com"})
    res = client.post("/api/newsletter", json={"email": "a@example.com"})
    assert res.status_code == 200
    assert res.json["status"] == "already_subscribed"
    assert len(db.session.scalars(select(Customer)).all()) == 1


def test_invalid_email_rejected(client):
    for bad in ["", "not-an-email", "a@b", None]:
        res = client.post("/api/newsletter", json={"email": bad})
        assert res.status_code == 400
        assert "email" in res.json["fields"]


def test_non_json_body_rejected(client):
    res = client.post("/api/newsletter", data="email=x", content_type="text/plain")
    assert res.status_code == 400
