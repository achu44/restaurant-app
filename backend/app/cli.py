"""Flask CLI commands: `flask init-db`, `flask seed-demo`."""

import random
from datetime import datetime

import click
from sqlalchemy import select

from .db import db
from .models import TOTAL_TABLES, Customer, Reservation
from .services.reservations import taken_tables


def register_cli(app):
    @app.cli.command("init-db")
    @click.option("--drop", is_flag=True, help="Drop existing tables first (destroys data).")
    def init_db(drop):
        """Create the customers and reservations tables."""
        if drop:
            db.drop_all()
            click.echo("Dropped existing tables.")
        db.create_all()
        click.echo("Database tables are ready: customers, reservations.")

    @app.cli.command("seed-demo")
    @click.argument("slot")
    @click.option("--leave", default=1, show_default=True, help="Tables to leave free.")
    def seed_demo(slot, leave):
        """Fill a time slot with demo bookings to show "fully booked".

        SLOT is a seating time such as 2026-12-05T19:00. By default one table is left free;
        use --leave 0 to fill the slot completely.
        """
        time_slot = datetime.fromisoformat(slot)
        free = sorted(set(range(1, TOTAL_TABLES + 1)) - taken_tables(time_slot))
        to_fill = max(0, len(free) - leave)
        for i, table in enumerate(random.sample(free, to_fill), start=1):
            email = f"demo.guest{i:02d}.{time_slot:%Y%m%d%H%M}@example.com"
            customer = db.session.scalars(select(Customer).where(Customer.email == email)).first()
            if not customer:
                customer = Customer(customer_name=f"Demo Guest {i:02d}", email=email)
                db.session.add(customer)
                db.session.flush()
            db.session.add(
                Reservation(
                    customer_id=customer.customer_id,
                    time_slot=time_slot,
                    table_number=table,
                    guest_count=2,
                )
            )
        db.session.commit()
        click.echo(
            f"Booked {to_fill} demo tables for {time_slot:%Y-%m-%d %H:%M}; "
            f"{len(free) - to_fill} table(s) left."
        )
