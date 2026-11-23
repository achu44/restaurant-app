# Café Fausse: developer guide

This guide takes you from a fresh clone to a running copy of the Café Fausse website on your own computer,
then explains how to operate it, test it, and change it. It covers macOS, Windows and Linux.

If you only want the short version, jump to the [quick reference](#15-quick-reference) at the end.

**Contents**

1. [What you are setting up](#1-what-you-are-setting-up)
2. [Install the prerequisites](#2-install-the-prerequisites)
3. [Get the code](#3-get-the-code)
4. [Set up PostgreSQL](#4-set-up-postgresql)
5. [Set up and start the backend (Flask API)](#5-set-up-and-start-the-backend-flask-api)
6. [Set up and start the frontend (React)](#6-set-up-and-start-the-frontend-react)
7. [Day-to-day: starting and stopping everything](#7-day-to-day-starting-and-stopping-everything)
8. [Operating the website and checking the database](#8-operating-the-website-and-checking-the-database)
9. [Tests and linting](#9-tests-and-linting)
10. [How the code is organised](#10-how-the-code-is-organised)
11. [Making common changes](#11-making-common-changes)
12. [Git workflow](#12-git-workflow)
13. [Troubleshooting](#13-troubleshooting)
14. [Known limitations and ideas for next steps](#14-known-limitations-and-ideas-for-next-steps)
15. [Quick reference](#15-quick-reference)

---

## 1. What you are setting up

The site is three programs that run side by side on your machine:

| Piece | What it does | Runs at |
|-------|--------------|---------|
| **PostgreSQL** | Stores customers, reservations and newsletter sign-ups | `localhost:5432` |
| **Flask API** (`backend/`) | Python web API: checks availability, books tables, saves sign-ups | http://127.0.0.1:5001 |
| **React app** (`frontend/`) | The website itself, served by the Vite dev server | http://localhost:5173 |

You open the **React app** in your browser. When a page needs data, it calls `/api/...`. The Vite dev server
forwards ("proxies") those calls to Flask on port 5001, and Flask reads and writes PostgreSQL.

```
Browser ──► Vite dev server :5173 ──(/api/*)──► Flask :5001 ──► PostgreSQL :5432
```

Setup takes about 20–30 minutes the first time. Afterwards, starting the site takes two commands.

---

## 2. Install the prerequisites

| Tool | Version | Why |
|------|---------|-----|
| Git | any recent | Clone the repository |
| PostgreSQL | **16** recommended (14+ works) | The database |
| uv | 0.5+ | Installs Python 3.13 and the backend's Python packages |
| Node.js | **20.19+ or 22.12+** (an LTS version) | Runs the React/Vite frontend |
| A code editor | for example VS Code | |

You do **not** need to install Python yourself: `uv` downloads the right version (3.13, pinned in
`backend/.python-version`) automatically.

### macOS (with Homebrew)

If you don't have Homebrew, install it from https://brew.sh first.

```bash
brew install git uv node postgresql@16
brew services start postgresql@16      # starts Postgres now and at every login
```

`postgresql@16` is "keg-only", so its commands (`psql`, `createdb`) may not be on your PATH yet. Add them:

```bash
echo 'export PATH="$(brew --prefix postgresql@16)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
psql --version        # should print: psql (PostgreSQL) 16.x
```

### Windows 10/11

1. **Git:** install from https://git-scm.com/download/win (the defaults are fine).
2. **Node.js:** install the **LTS** version from https://nodejs.org.
3. **uv:** in PowerShell, run:
   ```powershell
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```
   Then close and reopen PowerShell.
4. **PostgreSQL 16:** download the installer from https://www.postgresql.org/download/windows/
   (the EDB installer). During setup:
   * **Remember the password you choose for the `postgres` superuser.** You need it in step 4.
   * Keep the default port **5432**.
   * You can skip Stack Builder at the end.
   * The service starts automatically.
5. **Put the Postgres tools on your PATH** so `psql` works in any terminal:
   Start menu → "Edit the system environment variables" → Environment Variables → select `Path` → Edit → New
   → `C:\Program Files\PostgreSQL\16\bin`. Open a **new** PowerShell and check with `psql --version`.

> On Windows, run the commands in this guide in **PowerShell**. Where a command differs from macOS/Linux, the
> PowerShell version is shown separately.

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y git postgresql postgresql-contrib
sudo systemctl enable --now postgresql

curl -LsSf https://astral.sh/uv/install.sh | sh        # then open a new terminal

# Node.js LTS (via NodeSource; or use nvm if you prefer)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### Check everything is installed

```bash
git --version
uv --version
node --version      # v20.19+ or v22.12+
npm --version
psql --version
```

---

## 3. Get the code

The repository is private, so make sure the owner has added your GitHub account as a collaborator.

```bash
git clone https://github.com/achu44/quantic-web-app-project.git
cd quantic-web-app-project
```

Main branches:

* `main`: the stable, submitted version.
* `feature/...`: work in progress. If you're picking up unmerged work, check out that branch, for example
  `git checkout feature/cafe-fausse-app`.

---

## 4. Set up PostgreSQL

You'll create one database **role** (a Postgres user) and two **databases**:

| Name | Purpose |
|------|---------|
| `cafe_fausse` (role) | The login the app uses, with password `cafe_fausse` (fine for local development) |
| `cafe_fausse` (database) | Your development data: what the website reads and writes |
| `cafe_fausse_test` (database) | Used only by the automated tests. **They wipe it on every run.** |

### 4.1 Open a superuser `psql` prompt

| OS | Command |
|----|---------|
| macOS (Homebrew) | `psql postgres` (Homebrew makes your macOS user a superuser, with no password) |
| Windows | `psql -U postgres` (enter the password you chose during installation) |
| Linux | `sudo -u postgres psql` |

You should see a prompt like `postgres=#`.

### 4.2 Create the role and the databases

Paste this at the `postgres=#` prompt:

```sql
CREATE ROLE cafe_fausse WITH LOGIN PASSWORD 'cafe_fausse';
CREATE DATABASE cafe_fausse OWNER cafe_fausse;
CREATE DATABASE cafe_fausse_test OWNER cafe_fausse;
\q
```

### 4.3 Check you can connect as the app

```bash
psql "postgresql://cafe_fausse:cafe_fausse@localhost:5432/cafe_fausse" -c "SELECT current_user, current_database();"
```

Expected output: `cafe_fausse | cafe_fausse`. If you get an error, see [Troubleshooting](#13-troubleshooting).

> **Prefer different names or a different password?** That's fine. Use them consistently in
> `backend/.env` (next step).

You don't create any tables by hand. The app creates them in step 5.

---

## 5. Set up and start the backend (Flask API)

From the repository root:

```bash
cd backend
```

### 5.1 Create your local settings file

Copy the example file. `.env` holds your local settings and is git-ignored, so never commit it.

```bash
cp .env.example .env                 # macOS / Linux
```
```powershell
Copy-Item .env.example .env          # Windows PowerShell
```

If you used the names from step 4, `.env` needs no edits. Here's what it contains:

| Setting | Meaning |
|---------|---------|
| `DATABASE_URL` | Development database: `postgresql+psycopg://USER:PASSWORD@HOST:PORT/DBNAME` |
| `TEST_DATABASE_URL` | Test database, which **pytest wipes**. Never point it at real data. |
| `FLASK_APP=app` | Lets you type `flask ...` without `--app app` |
| `FLASK_RUN_PORT=5001` | The port the React dev server proxies to. macOS reserves 5000 for AirPlay. |
| `FLASK_DEBUG=1` | Auto-reloads the server when you save a Python file |
| `CORS_ORIGINS` | Browser origins allowed to call the API directly. The proxy doesn't need this. |

### 5.2 Install the Python dependencies

```bash
uv sync
```

This downloads Python 3.13 if needed, creates `backend/.venv`, and installs the exact package versions
from `uv.lock`. Run `uv sync` again whenever someone changes `pyproject.toml` or `uv.lock`.

> Prefix backend commands with `uv run` (for example `uv run flask run`). It runs them inside the project's
> virtual environment, so you never need to activate it. If you'd rather activate it, use
> `source .venv/bin/activate` (macOS/Linux) or `.venv\Scripts\Activate.ps1` (Windows).

### 5.3 Create the tables

```bash
uv run flask init-db
```

Expected output: `Database tables are ready: customers, reservations.`

### 5.4 Start the API

```bash
uv run flask run
```

You should see `Running on http://127.0.0.1:5001`. **Leave this terminal open.** The server runs until you
press `Ctrl+C`.

Check it from a second terminal, or open the URL in a browser:

```bash
curl http://127.0.0.1:5001/api/health
# {"status":"ok"}
```

---

## 6. Set up and start the frontend (React)

Open a **second terminal** and go to the repository root:

```bash
cd frontend
npm ci          # installs the exact versions from package-lock.json (first time, or after they change)
npm run dev
```

You should see `Local: http://localhost:5173/`. Open that URL. **The website is now running.**

> `npm ci` gives you exactly what's in `package-lock.json`. Use `npm install <package>` only when you're
> deliberately adding or upgrading a dependency, and commit the updated `package-lock.json`.
>
> npm may warn that some packages' install scripts were skipped ("allow-scripts"). That is expected and
> harmless for this project.

---

## 7. Day-to-day: starting and stopping everything

After the one-time setup, each working session needs:

1. **PostgreSQL running.** It usually starts automatically. Check with `pg_isready`, which should print
   "accepting connections". If it's not running:
   * macOS: `brew services start postgresql@16`
   * Windows: Services app → `postgresql-x64-16` → Start
   * Linux: `sudo systemctl start postgresql`
2. **Terminal 1, the API:**
   ```bash
   cd backend
   uv run flask run
   ```
3. **Terminal 2, the website:**
   ```bash
   cd frontend
   npm run dev
   ```
4. Open http://localhost:5173.

**To stop:** press `Ctrl+C` in each terminal. You don't need to stop PostgreSQL.

**Code changes take effect automatically:**

* Frontend: the browser updates instantly when you save (hot module replacement).
* Backend: Flask restarts itself when you save a `.py` file, because `FLASK_DEBUG=1`.
* After `git pull`, run `uv sync` (backend) and `npm ci` (frontend) if the lock files changed.

**Production-style build (optional):**

```bash
cd frontend
npm run build      # outputs optimised files to frontend/dist/
npm run preview    # serves dist/ on http://localhost:4173, still proxying /api to Flask
```

---

## 8. Operating the website and checking the database

### 8.1 The pages

| Page | URL | What to try |
|------|-----|-------------|
| Home | `/` | The live "Open now / Opens at 5 PM" status (Washington, DC time), contact details and hours |
| Menu | `/menu` | Section links stick to the top while you scroll |
| Reservations | `/reservations` | Book a table (see below) |
| About us | `/about` | History, founders, commitments |
| Gallery | `/gallery` | Filter buttons; click a photo to open the lightbox (← → keys move, Esc closes) |
| Newsletter | footer of every page | Sign up with an email |
| 404 | any other URL, for example `/nope` | A friendly "page not found" page |

### 8.2 How reservations behave

* Seatings run **every 30 minutes**, from 5:00 PM to one hour before closing: Mon–Sat until 10:00 PM, Sunday
  until 8:00 PM. Times are restaurant-local (Washington, DC).
* You can book from now up to **60 days** ahead, for parties of **1–8** guests.
* Each seating has **30 tables**. A booking takes one table, chosen **at random** from those still free.
* After you pick a date, the time dropdown shows live availability. Full or past seatings are disabled, and
  "(3 left)" appears when five or fewer tables remain.
* The same email can't book two tables at the same seating.
* A guest who returns with the same email reuses their customer record.

### 8.3 Look at the data directly

Connect to the development database:

```bash
psql "postgresql://cafe_fausse:cafe_fausse@localhost:5432/cafe_fausse"
```

Useful queries:

```sql
-- Everyone who has booked or subscribed
SELECT customer_id, customer_name, email, phone_number, newsletter_signup, created_at
FROM customers ORDER BY customer_id;

-- Newsletter subscribers only
SELECT email, created_at FROM customers WHERE newsletter_signup ORDER BY created_at;

-- Reservations with the customer's details
SELECT r.reservation_id, c.customer_name, c.email, r.time_slot, r.table_number, r.guest_count
FROM reservations r JOIN customers c USING (customer_id)
ORDER BY r.time_slot, r.table_number;

-- How full each seating is
SELECT time_slot, count(*) AS tables_booked, 30 - count(*) AS tables_free
FROM reservations GROUP BY time_slot ORDER BY time_slot;

-- Table definitions and constraints
\d customers
\d reservations
```

Type `\q` to quit `psql`. Prefer a GUI? Connect **pgAdmin**, **TablePlus**, **DBeaver** or VS Code's
PostgreSQL extension with host `localhost`, port `5432`, user and password `cafe_fausse`, and database
`cafe_fausse`.

### 8.4 Demo data and resetting

Run these from `backend/`:

```bash
# Fill a seating, leaving 1 table free (good for showing "(1 left)")
uv run flask seed-demo 2026-12-05T19:00

# Fill it completely (shows "fully booked")
uv run flask seed-demo 2026-12-05T19:00 --leave 0

# Wipe ALL data and recreate empty tables
uv run flask init-db --drop
```

The slot must be a real seating time, such as `19:00` or `19:30`. Demo guests use addresses like
`demo.guest01.202612051900@example.com`, so they're easy to spot and delete:

```sql
DELETE FROM customers WHERE email LIKE 'demo.guest%@example.com';   -- their reservations are deleted too
```

`docs/demo-script.md` has the full walkthrough used for the project's recorded demo.

### 8.5 Calling the API directly

Every endpoint is under `/api`. You can call Flask directly on `:5001` or go through the Vite proxy on `:5173`.

```bash
curl "http://127.0.0.1:5001/api/availability?date=2026-12-05"

curl -X POST http://127.0.0.1:5001/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"time_slot":"2026-12-05T19:00","guests":2,"name":"Test Guest","email":"test@example.com","phone":"","newsletter":false}'

curl -X POST http://127.0.0.1:5001/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"fan@example.com"}'
```

On Windows PowerShell, `curl` is an alias for something else. Use `curl.exe`, or `Invoke-RestMethod`:

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:5001/api/newsletter `
  -ContentType "application/json" -Body '{"email":"fan@example.com"}'
```

The full API table and error codes are in the [README](../README.md#rest-api). `uv run flask routes` lists
every endpoint.

---

## 9. Tests and linting

Run these before every commit or pull request.

```bash
# Backend: 17 tests, including a 40-thread overbooking test. Uses TEST_DATABASE_URL, never your dev data.
cd backend
uv run pytest
uv run pytest -k newsletter -v      # just the matching tests, verbose

# Frontend
cd frontend
npm run lint        # oxlint
npm run build       # catches import and syntax errors
```

The backend tests are in `backend/tests/`:

| File | Covers |
|------|--------|
| `test_schedule.py` | Opening hours and seating times, past and too-far-ahead dates |
| `test_reservations.py` | Booking, validation, filling all 30 tables, duplicate bookings, returning customers, availability, concurrency |
| `test_newsletter.py` | Sign-up, duplicate sign-up, invalid emails |

Shared fixtures are in `conftest.py`. Each test gets a fresh, empty set of tables. There are no automated
frontend tests yet, so check UI changes in the browser at desktop and phone widths. Chrome DevTools → device
toolbar (`Ctrl/Cmd+Shift+M`) works well.

---

## 10. How the code is organised

```
quantic-web-app-project/
├── README.md               Project overview, architecture, schema, API
├── ai-tooling.md           How AI tools were used (a submission requirement)
├── staging.md              Hosting status (local only)
├── docs/
│   ├── developer-guide.md  This file
│   ├── demo-script.md      Walkthrough for the recorded demo
│   └── *.pdf               Project instructions and the SRS (the requirements)
├── backend/
│   ├── pyproject.toml, uv.lock, .python-version   Python dependencies and version
│   ├── .env.example        Template for your .env
│   ├── schema.sql          Reference copy of the generated schema (not executed)
│   ├── app/
│   │   ├── __init__.py     create_app(): wires config, DB, CORS, routes, CLI, error handlers
│   │   ├── config.py       Reads settings from .env
│   │   ├── db.py           The shared SQLAlchemy object
│   │   ├── models.py       Customer and Reservation tables and their constraints
│   │   ├── schedule.py     Opening hours, seating times, booking window
│   │   ├── validation.py   Cleans and validates request fields
│   │   ├── routes.py       HTTP endpoints (/api/...)
│   │   ├── cli.py          flask init-db / seed-demo
│   │   └── services/       Business logic, kept separate from HTTP
│   │       ├── reservations.py   Booking algorithm and availability
│   │       ├── newsletter.py     Newsletter sign-up
│   │       └── customers.py      Race-safe "find or create customer by email"
│   └── tests/
└── frontend/
    ├── index.html          Page shell, fonts, meta tags
    ├── vite.config.js      Dev server and the /api proxy
    ├── public/images/      Site images (WebP)
    └── src/
        ├── main.jsx, App.jsx   Entry point and routes
        ├── pages/          One component (+ CSS file) per page
        ├── components/     Header, Footer, NewsletterForm, HoursList, Lightbox, Recognition
        ├── content/        All restaurant copy as plain data: menu, hours, awards, reviews, about, gallery
        ├── lib/            Helpers: opening-hours status, form validation, page titles
        ├── api/client.js   The only place that calls fetch()
        └── styles/         tokens.css (colours, fonts, spacing) and global.css (base styles, buttons)
```

**What happens when someone books a table:**

1. `pages/Reservations.jsx` validates the form with `lib/validation.js`, then calls
   `api.reserve()` in `api/client.js`.
2. Vite proxies `POST /api/reservations` to Flask.
3. `routes.py` → `create_reservation()` cleans the input with `validation.py`.
4. `services/reservations.py` → `book_reservation()`:
   1. Checks the slot with `schedule.py`.
   2. Locks that seating.
   3. Upserts the customer.
   4. Picks a random free table, inserts the reservation and commits.
5. Flask returns JSON, either `201` with the table number or `400`/`409` with a message. The page shows it.

**Conventions:**

* Business rules live in `services/`, not in `routes.py`. Routes only translate between HTTP and Python.
* Every API error is JSON shaped like `{ "error": "<code>", "message": "<text for the guest>", "fields": {...} }`.
  The frontend shows `message` and highlights each field in `fields`.
* Frontend styling is plain CSS. Each component imports its own `.css` file, and shared values come from
  CSS variables in `styles/tokens.css`. Use CSS Grid or Flexbox for layout; it's a project requirement.
* Copy lives in `src/content/`, not inside JSX, so text changes don't touch components.

---

## 11. Making common changes

### Change menu items, prices, awards, reviews or About text

Edit the data files in `frontend/src/content/`: `menu.js`, `recognition.js`, `about.js` or `restaurant.js`.
The pages update automatically; no component changes are needed.

### Change opening hours ⚠️ update both sides

Hours are defined in **two** places, and they must match:

1. `backend/app/schedule.py` → `OPENING_HOURS`. This controls which seatings can actually be booked. Days
   are numbered **Monday = 0 … Sunday = 6**.
2. `frontend/src/content/restaurant.js` → `hours`. This controls what the site displays. Days are numbered
   **Sunday = 0 … Saturday = 6**, the JavaScript convention.

Then run `uv run pytest`. `test_schedule.py` checks the seating times and will need updating.

### Other values that are duplicated between backend and frontend

| Value | Backend | Frontend |
|-------|---------|----------|
| Max guests per booking (8) | `MAX_GUESTS` in `backend/app/models.py`, also a DB `CHECK` constraint | `MAX_GUESTS` in `frontend/src/lib/validation.js` |
| Booking window (60 days) | `BOOKING_HORIZON_DAYS` in `backend/app/schedule.py` | `BOOKING_HORIZON_DAYS` in `frontend/src/pages/Reservations.jsx` |
| Number of tables (30) | `TOTAL_TABLES` in `backend/app/models.py`, also a DB `CHECK` constraint; the "All 30 tables…" message in `backend/app/services/reservations.py` | text in `docs/` and `README.md` |
| Email and phone rules | `backend/app/validation.py` | `frontend/src/lib/validation.js` |
| Phone number in error messages | `backend/app/__init__.py` | `frontend/src/api/client.js` |

Changing a value that's also a database `CHECK` constraint changes the schema. See
[changing the database schema](#change-the-database-schema) below.

### Add or replace images

1. Export WebP images, about 1600px wide for full size and 800px for thumbnails, at roughly 75–80% quality.
   Use royalty-free or AI-generated images only.
2. Put them in `frontend/public/images/`.
3. Reference them as `/images/<name>.webp`. For the gallery, add an entry to `frontend/src/content/gallery.js`
   with `src`, `thumb`, `width`, `height`, `category`, a descriptive `alt` text and a `caption`. Add
   `wide: true` or `tall: true` to make a tile span two columns or two rows.

### Add a new page

1. Create `frontend/src/pages/Events.jsx` and, if needed, `Events.css`. Call `usePageTitle('Events')`.
2. Add a route in `frontend/src/App.jsx`:
   `<Route path="events" element={<Events />} />`.
3. Add it to the navigation in `frontend/src/components/navLinks.js`. The header and footer both use this list.

### Add a new API endpoint

1. Put the logic in a function in `backend/app/services/`.
2. Add a route in `backend/app/routes.py`, for example `@api.get("/something")`. It's automatically served
   under `/api`.
3. Validate input with the helpers in `validation.py`. Raise `ValidationError({...})` for bad input and
   `BookingError(...)`, or a similar exception with an error handler, for business-rule failures.
4. Add a function for it in `frontend/src/api/client.js`.
5. Add tests in `backend/tests/`.

### Change the database schema

There is **no migration tool yet**. `flask init-db` creates missing tables but does **not** alter existing
ones. After editing `backend/app/models.py`:

* **If losing local data is fine** (the usual case in development):
  ```bash
  uv run flask init-db --drop
  ```
  Tell your teammates to do the same after they pull your change.
* **If you need to keep data,** write the `ALTER TABLE ...` by hand in `psql`.
* Regenerate the reference copy afterwards:
  ```bash
  pg_dump --schema-only --no-owner --no-privileges "postgresql://cafe_fausse:cafe_fausse@localhost:5432/cafe_fausse" > schema-new.sql
  ```
  Tidy it, then replace `backend/schema.sql`.
* If the schema starts changing often, adopt **Flask-Migrate** (Alembic). See [next steps](#14-known-limitations-and-ideas-for-next-steps).

### Add a dependency

```bash
cd backend && uv add <package>            # or: uv add --dev <package> for test-only tools
cd frontend && npm install <package>      # or: npm install -D <package>
```

Commit the updated lock file (`uv.lock` or `package-lock.json`) together with the code that uses it.

### Change colours, fonts or spacing

Edit the variables in `frontend/src/styles/tokens.css`. Everything else references them. The fonts
(Bodoni Moda and Figtree) load from Google Fonts in `frontend/index.html`.

---

## 12. Git workflow

1. Update your local `main` first:
   ```bash
   git checkout main && git pull
   ```
2. Create a branch for each change:
   ```bash
   git checkout -b feature/short-description
   ```
3. Make the change, then run the checks in [section 9](#9-tests-and-linting).
4. Commit and push:
   ```bash
   git add <files>
   git commit -m "Explain what changed and why"
   git push -u origin feature/short-description
   ```
5. Open a pull request on GitHub, then ask a teammate to review it before merging into `main`.

**Never commit:**

* `backend/.env` (your local settings)
* `backend/.venv/` or `frontend/node_modules/` (installed packages)
* `frontend/dist/` (build output)

`.gitignore` already excludes all of these. Check `git status` before committing anyway.

---

## 13. Troubleshooting

| Symptom | Cause and fix |
|---------|---------------|
| `psql: command not found` / `'psql' is not recognized` | The Postgres tools aren't on your PATH. See the PATH steps for [macOS](#macos-with-homebrew) or [Windows](#windows-1011). Open a new terminal afterwards. |
| `connection refused` / `could not connect to server` | PostgreSQL isn't running. Start it ([section 7](#7-day-to-day-starting-and-stopping-everything)) and check with `pg_isready`. |
| `password authentication failed for user "cafe_fausse"` | The role or password doesn't match `.env`. Re-run step 4.2, or fix `DATABASE_URL`. To reset the password, run `ALTER ROLE cafe_fausse PASSWORD 'cafe_fausse';` as a superuser. |
| `role "cafe_fausse" does not exist` / `database "cafe_fausse" does not exist` | Step 4.2 wasn't completed. Run it as a superuser. |
| `role "<your username>" does not exist` when running `psql` | Connect as the superuser instead: `psql -U postgres` (Windows) or `sudo -u postgres psql` (Linux). |
| `permission denied for schema public` | The database isn't owned by `cafe_fausse`. Run `ALTER DATABASE cafe_fausse OWNER TO cafe_fausse;` (and the same for `cafe_fausse_test`) as a superuser. |
| `Address already in use` / port 5001 busy | Another Flask is still running. Stop it with `Ctrl+C` in its terminal. On macOS/Linux, `lsof -i :5001` shows the process ID; stop it with `kill <PID>`. On Windows, use `netstat -ano \| findstr :5001`, then `taskkill /PID <PID> /F`. |
| `Port 5173 is in use` | Vite picks the next free port (5174, …) and prints it. Use that URL, or stop the other dev server. |
| `flask: command not found` | Run it via uv (`uv run flask ...`) from inside `backend/`. |
| `Error: Could not locate a Flask application` | You're not in `backend/`, or `.env` is missing. Run `cp .env.example .env`. |
| Website loads, but the time dropdown stays empty or shows "We couldn't reach the reservation system" | Flask isn't running or isn't on port 5001. Start it and check `http://127.0.0.1:5001/api/health`. |
| `503` "temporarily unavailable" from the API | Flask is running but can't reach PostgreSQL. Check Postgres is running and `DATABASE_URL` is right. |
| Every booking says the time "has already passed" | Times are Washington, DC time, so pick a later date. Also check your computer's clock. |
| `uv sync` fails to download Python | Check your internet or proxy settings. You can also install Python 3.13 yourself; uv will find it. |
| Vite or npm complains about the Node version | Install Node 20.19+ or 22.12+ (LTS) from https://nodejs.org. |
| Tests fail with connection errors | `cafe_fausse_test` is missing, or `TEST_DATABASE_URL` is wrong. See step 4.2. |
| You changed `models.py` and now get "column does not exist" | The tables are out of date. Run `uv run flask init-db --drop` (this wipes local data). |
| Fonts look like Times New Roman | You're offline, so Google Fonts can't load. The layout still works, with fallback fonts. |

Still stuck? Copy the **full** error message from the terminal (Flask logs every unexpected error with a
traceback) and the browser's DevTools Console and Network tabs, then share it with the team.

---

## 14. Known limitations and ideas for next steps

The project meets the SRS. These are reasonable improvements if more development is needed:

**Backend and data**

* **Database migrations:** adopt Flask-Migrate (Alembic) so schema changes don't require
  `init-db --drop`.
* **Reservation management:** cancelling or changing a booking, for example via a link with a token sent by
  email.
* **Email:** confirmation emails for reservations and a double opt-in for the newsletter (needs an email
  provider such as SendGrid or Postmark), plus an unsubscribe link.
* **Seating model:** each booking currently holds one table for one 30-minute seating, regardless of party
  size. A more realistic model would block a table for about 90 minutes across overlapping seatings and
  match table sizes to party sizes.
* **Staff tools:** the SRS mentions managers overseeing reservations. A protected admin view, or an export,
  is not built yet. Staff currently use `psql`.
* **Abuse protection:** rate limiting (for example Flask-Limiter) and a CAPTCHA on the public forms.

**Frontend**

* **Shared configuration:** serve hours, max guests and the booking window from an API endpoint, so the
  values in [section 11](#other-values-that-are-duplicated-between-backend-and-frontend) aren't duplicated.
* **Frontend tests:** add Vitest and React Testing Library for components, and Playwright for end-to-end
  flows.
* **Content:** real photography of the restaurant (the gallery uses the four supplied images plus crops of
  them) and real founder biographies. The current ones are placeholder copy written from the SRS.

**Hosting**

* **Deployment:** for example the frontend on Netlify or Vercel and Flask plus Postgres on Render, Railway
  or Fly.io. You'd need:
  * a production WSGI server (gunicorn)
  * `FLASK_DEBUG=0`
  * a real database password stored as a secret
  * `CORS_ORIGINS` set to the site's domain, or Flask serving the built frontend directly
  * a staging URL recorded in `staging.md`

---

## 15. Quick reference

**One-time setup**

```bash
git clone https://github.com/achu44/quantic-web-app-project.git && cd quantic-web-app-project

# Database (as a Postgres superuser: `psql postgres` / `psql -U postgres` / `sudo -u postgres psql`)
#   CREATE ROLE cafe_fausse WITH LOGIN PASSWORD 'cafe_fausse';
#   CREATE DATABASE cafe_fausse OWNER cafe_fausse;
#   CREATE DATABASE cafe_fausse_test OWNER cafe_fausse;

cd backend && cp .env.example .env && uv sync && uv run flask init-db && cd ..
cd frontend && npm ci && cd ..
```

**Every session (two terminals)**

```bash
cd backend && uv run flask run          # API      → http://127.0.0.1:5001
cd frontend && npm run dev              # Website  → http://localhost:5173
```

**Handy commands**

| Task | Command (from `backend/` unless noted) |
|------|----------------------------------------|
| Run backend tests | `uv run pytest` |
| Lint and build frontend | `npm run lint && npm run build` (from `frontend/`) |
| Open the database | `psql "postgresql://cafe_fausse:cafe_fausse@localhost:5432/cafe_fausse"` |
| Wipe and recreate tables | `uv run flask init-db --drop` |
| Fill a seating for a demo | `uv run flask seed-demo 2026-12-05T19:00 [--leave 0]` |
| List API routes | `uv run flask routes` |
| Python shell with the app loaded | `uv run flask shell` |
