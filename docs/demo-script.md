# Demo script (5–10 minutes)

## Before recording

```bash
# Terminal 1: API (start from a clean database)
cd backend && uv run flask --app app init-db --drop && uv run flask --app app run -p 5001
# Terminal 2: frontend
cd frontend && npm run dev
# Terminal 3: database
psql cafe_fausse
```

Choose a demo date and time within the next 60 days, for example `2026-12-05T19:00` (a Saturday).

## 1. Introduction (≈1 min)

* Show your government-issued ID to the camera and state your name.
* Outline the stack: React + Vite frontend, Flask API, PostgreSQL.

## 2. Pages and navigation (≈2 min)

* **Home:** the name, the live open/closed status, contact details and hours, then scroll through the
  featured dishes, awards and review.
* **Menu:** the four categories with prices; click the sticky section links.
* **About us:** the history, founder biographies and commitments.
* **Gallery:** use the filters, open the lightbox and move with the ← → keys, close with Esc, then scroll to
  the awards and reviews.
* Show responsiveness: Chrome DevTools device toolbar → iPhone, then open the hamburger menu.
* Visit a missing route such as `/nope` to show the 404 page.

## 3. Newsletter → database (≈1 min)

1. In the footer, submit `not-an-email` to show the validation message.
2. Submit `grader.demo@example.com` and show the success message.
3. Submit the same address again to show the “already on our list” message.
4. In psql:

```sql
SELECT customer_id, customer_name, email, newsletter_signup, created_at
FROM customers ORDER BY customer_id;
```

## 4. Reservations → database (≈3 min)

1. Submit the empty form to show the inline field errors.
2. Pick the demo date. The time dropdown loads live availability.
3. Book 7:00 PM for 4 guests with a name, email, phone and the newsletter box ticked. The confirmation shows
   the table number.
4. In psql:

```sql
SELECT r.reservation_id, c.customer_name, c.email, c.phone_number, c.newsletter_signup,
       r.time_slot, r.table_number, r.guest_count
FROM reservations r JOIN customers c USING (customer_id)
ORDER BY r.reservation_id;
```

5. **Duplicate protection:** book the same slot again with the same email and show the “already have a
   reservation” message.
6. **Fully booked (server-side check):**
   1. Leave exactly one table free at 7:30 PM:
      `cd backend && uv run flask --app app seed-demo 2026-12-05T19:30`
   2. Re-select the date in the form. 7:30 PM now shows “(1 left)”. Select it and fill in the details,
      but don't submit yet.
   3. Take the last table from the terminal (as if another guest booked it):
      `uv run flask --app app seed-demo 2026-12-05T19:30 --leave 0`
   4. Click **Book table**. The server rejects it with “All 30 tables are booked for this time. Please
      choose another time.” and the dropdown refreshes, showing 7:30 PM as fully booked.

```sql
SELECT time_slot, count(*) AS tables_booked, 30 - count(*) AS tables_free
FROM reservations GROUP BY time_slot ORDER BY time_slot;

-- Each table appears at most once per slot (enforced by a UNIQUE constraint):
\d reservations
```

## 5. Implementation decisions (≈1–2 min)

* Discrete 30-minute seatings × 30 tables, with a random free table assigned.
* Advisory lock plus UNIQUE constraints prevent overbooking; the concurrency test (`uv run pytest`) proves it.
* Newsletter stored in `customers.newsletter_signup`, with e-mail as the natural key.
* Design: the palette comes from the photos, Bodoni and Figtree type, Grid and Flexbox, mobile-first, and
  an accessible lightbox.
* AI tooling: Claude Code (see `ai-tooling.md`).
