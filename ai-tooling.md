# AI tooling used

> Draft written alongside the build. Edit it to reflect your own experience before submitting.

## Tools

* **Claude Code** (Anthropic's agentic coding CLI, Claude Opus model) was the main tool, used in the
  terminal against this repository.

## How it was used

1. **Requirements analysis in plan mode.** Claude Code read the project instructions PDF and the
   Café Fausse SRS, then mapped every requirement (FR-1–FR-18, NFR-1–NFR-9) and rubric item into an
   architecture plan. The plan covered the repo layout, database schema, REST API, reservation algorithm,
   page designs and a verification checklist. Two open questions were put to me before any code was
   written: local versus staging hosting, and the time-slot model.
2. **Backend scaffolding and logic.** It set up the uv/Flask project and wrote the SQLAlchemy models with
   DB-level constraints, the opening-hours/slot rules, validation, and the booking service. The booking
   service uses an advisory lock, a race-safe customer upsert and random table assignment.
3. **Tests.** It wrote a pytest suite against a separate test database, including a 40-thread
   concurrency test proving the 30-table limit can't be exceeded, and ran it after each change.
4. **Frontend.** It scaffolded Vite + React and proposed a visual direction (palette, type, layout)
   grounded in the supplied photos. It then built the pages, the reusable components, the accessible
   lightbox and the reservation form with live availability.
5. **Visual QA.** It ran both servers and took headless-Chrome screenshots at desktop and phone widths,
   reviewed them, and fixed what it found: gaps in the gallery grid and lint warnings.
6. **End-to-end checks.** It exercised the API through the Vite proxy with curl (booking, duplicate,
   full slot, invalid input, newsletter) and inspected the results directly in `psql`.
7. **Documentation.** It drafted README.md, the demo script, staging.md and this file.

## What worked well

* Reading the PDFs directly and keeping requirements traceable (SRS IDs appear in code comments and the
  README).
* Thinking through edge cases I might have skipped, such as concurrent bookings, duplicate bookings by
  the same guest, returning customers, time zones and DB outages, and backing them with tests.
* Fast iteration: build, screenshot, critique, fix in a tight loop.

## What didn't work as well, or needed oversight

* Headless Chrome's minimum window width made the first "mobile" screenshots look broken. Viewing the
  pages inside a 390px iframe showed the layout was actually fine, so screenshots need sanity-checking.
* Only four images were supplied. The AI proposed detail crops of those photos rather than inventing new
  imagery, but the gallery would benefit from more real photography.
* Invented content (founder biographies) is plausible but fictional, and needed human review.
* Generated code still needs review. For example, an early version of the customer upsert could race on
  a brand-new e-mail, and it was rewritten to use `INSERT … ON CONFLICT`.
