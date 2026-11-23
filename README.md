# Café Fausse — Restaurant Web Application

A full-stack website for **Café Fausse**, a fine-dining Italian restaurant in Washington, DC.
Built for the Quantic MSAIE *Web Application & Interface Design* project, it implements every
requirement in the Software Requirements Specification (`docs/Cafe Fausse SRS.pdf`).

| Layer    | Technology |
|----------|------------|
| Frontend | React 19 + JSX, React Router, Vite, plain CSS (Grid + Flexbox, custom-property design tokens) |
| Backend  | Python 3.13, Flask 3, Flask-SQLAlchemy (SQLAlchemy 2), psycopg 3 |
| Database | PostgreSQL 16 |
| Tests    | pytest (backend), oxlint (frontend) |

---

## Features

| Page | Route | SRS |
|------|-------|-----|
| **Home**: name, live “open now” status, contact details, hours, featured dishes, awards, review | `/` | FR-1 – FR-4 |
| **Menu**: four categories, descriptions and prices, sticky section links | `/menu` | FR-5 |
| **Reservations**: date → live availability → time, guests, name, email, optional phone, newsletter opt-in | `/reservations` | FR-6 – FR-9 |
| **About us**: history, mission, founder biographies, commitments | `/about` | FR-10, FR-11 |
| **Gallery**: filterable photo grid, accessible lightbox, awards and reviews | `/gallery` | FR-12 – FR-14 |
| **Newsletter sign-up** in the footer of every page | all | FR-15, FR-16 |
| Friendly 404 page | `*` | NFR-6 |

---

## Architecture

```
Browser (React SPA, :5173)
   │   fetch('/api/...')            Vite dev server proxies /api → :5001
   ▼
Flask API (:5001)  ── app/routes.py ── validation.py ── services/ (reservations, newsletter, customers)
   │   SQLAlchemy / psycopg
   ▼
PostgreSQL  (customers, reservations)
```

```
backend/
  app/__init__.py        app factory, CORS, JSON error handlers
  app/config.py          settings from .env
  app/models.py          Customer, Reservation (+ DB constraints)
  app/schedule.py        opening hours, 30-minute seatings, booking window (America/New_York)
  app/validation.py      input cleaning/validation
  app/services/          business logic (booking algorithm, newsletter, customer upsert)
  app/routes.py          REST endpoints under /api
  app/cli.py             flask init-db, flask seed-demo
  tests/                 pytest suite (runs against cafe_fausse_test)
  schema.sql             the generated schema, for reference
frontend/
  src/pages/             Home, Menu, Reservations, About, Gallery, NotFound
  src/components/        Header, Footer, NewsletterForm, HoursList, Lightbox, Recognition
  src/content/           restaurant copy as data (menu, hours, awards, reviews, founders, gallery)
  src/lib/               hours/open-status, validation, page titles
  src/api/client.js      fetch wrapper with timeout + normalised errors
  src/styles/            tokens.css (palette, type scale, spacing) and global.css
  public/images/         optimised WebP versions of the supplied images
docs/                    project instructions, SRS, demo script
```

### Database schema

```
customers                                  reservations
─────────────────────────────              ─────────────────────────────────────────
customer_id        SERIAL PK      ◄──┐     reservation_id  SERIAL PK
customer_name      VARCHAR(120)      └──── customer_id     INT NOT NULL FK (ON DELETE CASCADE)
email              VARCHAR(254) UNIQUE     time_slot       TIMESTAMP NOT NULL   (DC local time)
phone_number       VARCHAR(30)             table_number    SMALLINT CHECK 1–30
newsletter_signup  BOOLEAN DEFAULT false   guest_count     SMALLINT CHECK 1–8
created_at         TIMESTAMPTZ             created_at      TIMESTAMPTZ
                                           UNIQUE (time_slot, table_number)   -- no table double-booked
                                           UNIQUE (customer_id, time_slot)    -- one booking per guest per slot
```

* The SRS requires the `customers` and `reservations` tables with these columns. Newsletter sign-ups use the
  SRS's own **Newsletter Signup** column: the e-mail is upserted into `customers` with
  `newsletter_signup = true`. A reservation guest who ticks the box is subscribed the same way.
* E-mail is the natural key for a customer. Returning guests reuse their record, and their name and phone
  are refreshed.

### REST API

| Method | Endpoint | Body / query | Responses |
|--------|----------|--------------|-----------|
| GET  | `/api/health` | – | `200 {status:"ok"}` |
| GET  | `/api/availability?date=YYYY-MM-DD` | – | `200 {slots:[{time_slot,label,tables_remaining,available,status}]}` |
| POST | `/api/reservations` | `{time_slot:"2026-12-05T19:00", guests, name, email, phone?, newsletter?}` | `201` confirmation with table number · `400` field errors / invalid slot · `409 slot_full` / `duplicate_booking` |
| POST | `/api/newsletter` | `{email, name?}` | `201 subscribed` · `200 already_subscribed` · `400` invalid email |

Every error is JSON `{error, message, fields?}`. The UI shows `message` and highlights `fields`.
Database outages return a friendly `503` (NFR-6).

### Reservation logic (FR-7, FR-8, FR-18, NFR-5)

* **Time slots:** seatings every 30 minutes during opening hours, with the last seating one hour before close
  (Mon–Sat 5:00–10:00 PM, Sun 5:00–8:00 PM). Each slot has **30 tables**, and a booking holds one table for
  its slot.
* **Validation:** the slot must be a real seating time in the future, at most 60 days ahead. Guests must
  number 1–8, the e-mail format must be valid, and the phone number is optional.
* **Booking runs in one transaction:**
  1. `pg_advisory_xact_lock(slot)` serialises concurrent bookings for the same slot, without blocking other
     slots.
  2. Upsert the customer (`INSERT … ON CONFLICT (email) DO NOTHING`, then `SELECT … FOR UPDATE`).
  3. Reject the booking if this guest already holds a table in that slot.
  4. Compute free tables as `{1..30} − taken`. If none are free, return `409 slot_full`: “All 30 tables are
     booked for this time. Please choose another time.”
  5. Insert the reservation with a **random free table**, then commit.
* **Defence in depth:** the `UNIQUE (time_slot, table_number)` and `CHECK` constraints make overbooking
  impossible even if the application logic were bypassed. A test fires 40 simultaneous requests at one slot:
  exactly 30 succeed, on 30 distinct tables.
* **Availability:** the time dropdown is filled from `/api/availability`. Full or past seatings are disabled,
  and seatings with five or fewer tables left show the count. If a slot fills while a guest is on the form,
  the server's message is shown and the times reload.

### Frontend design decisions

* **Visual identity:** the palette comes from the supplied photographs: claret, porcelain, brass and olive.
  Type pairs *Bodoni Moda* (an Italian Didone) for display with *Figtree* for body and UI. The home hero is
  the single bold moment: a full-bleed dining room with an oversized italic wordmark and a live
  “Open now / Opens at 5 PM” status computed in DC time.
* **Layout:** CSS Grid for page structure, the menu, the gallery mosaic and forms. Flexbox for the
  navigation, button rows and the menu's dotted price leaders. The design is mobile-first, with
  `auto-fit/minmax` grids and a hamburger menu below 960px (NFR-8).
* **Accessibility:**
  * Semantic landmarks and a skip link.
  * Labelled form fields, with errors linked via `aria-describedby` and focus moved to the first error.
  * `aria-live` newsletter status and visible focus rings.
  * `prefers-reduced-motion` respected.
  * The lightbox is a native `<dialog>`, so it traps focus and closes on Esc. Arrow keys move between images.
* **Performance (NFR-1):**
  * Images are re-encoded to WebP at 1600/800 px (about 2.4 MB of originals reduced to about 1.5 MB total).
  * `srcset`, lazy loading and explicit dimensions to avoid layout shift.
  * The hero image is preloaded, and the gallery is code-split.
* **Content as data:** all restaurant copy lives in `frontend/src/content/`, so menu or hours changes don't
  touch components (NFR-9).
* **Gallery images:** the four supplied photos plus four detail crops of them, so every image comes from the
  provided set.

---

## Running locally

> **New to the project?** Follow the step-by-step **[developer guide](docs/developer-guide.md)**. It covers
> installing everything on macOS, Windows or Linux, setting up PostgreSQL, operating the site,
> troubleshooting and how to make changes. The summary below assumes the tools are already installed.

### Prerequisites

* **PostgreSQL 16+** running locally (macOS: `brew install postgresql@16 && brew services start postgresql@16`)
* **Python 3.13** and [**uv**](https://docs.astral.sh/uv/) (`brew install uv`). uv installs Python 3.13 if needed.
* **Node.js 20+** and npm

### 1. Database

As a Postgres superuser (`psql postgres` on macOS/Homebrew, `psql -U postgres` on Windows,
`sudo -u postgres psql` on Linux):

```sql
CREATE ROLE cafe_fausse WITH LOGIN PASSWORD 'cafe_fausse';
CREATE DATABASE cafe_fausse OWNER cafe_fausse;
CREATE DATABASE cafe_fausse_test OWNER cafe_fausse;   -- used (and wiped) by the test suite
```

These match the defaults in `backend/.env.example`. If you use different names, edit `.env` to match.

### 2. Backend (Flask API on http://127.0.0.1:5001)

```bash
cd backend
cp .env.example .env          # edit DATABASE_URL if needed
uv sync                       # creates .venv and installs dependencies
uv run flask init-db
uv run flask run              # port 5001 and auto-reload come from .env
```

> Port 5001 is used because macOS reserves 5000 for AirPlay.

### 3. Frontend (React on http://localhost:5173)

In a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` requests to Flask, so no CORS setup is needed.

To use a production build instead, run `npm run build && npm run preview`. The preview server proxies `/api`
the same way.

### Useful commands

```bash
cd backend
uv run pytest                                        # 17 tests incl. concurrency/overbooking
uv run flask seed-demo 2026-12-05T19:00    # fill a slot, leaving 1 table free
uv run flask seed-demo 2026-12-05T19:00 --leave 0   # fill it completely
uv run flask init-db --drop                # wipe and recreate tables
psql cafe_fausse                                     # inspect the data directly
```

```bash
cd frontend
npm run lint
npm run build
```

See [`docs/demo-script.md`](docs/demo-script.md) for the SQL queries used in the demo recording.

## Other documents

* [`ai-tooling.md`](ai-tooling.md): how AI tools were used to build this project
* [`staging.md`](staging.md): hosting status (local only)
