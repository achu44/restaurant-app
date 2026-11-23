import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import HoursList from '../components/HoursList.jsx'
import { restaurant } from '../content/restaurant.js'
import { restaurantNow } from '../lib/hours.js'
import { MAX_GUESTS, validateReservation } from '../lib/validation.js'
import { usePageTitle } from '../lib/usePageTitle.js'
import './Reservations.css'

const BOOKING_HORIZON_DAYS = 60

const addDays = (isoDate, days) => {
  const d = new Date(`${isoDate}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const longDate = (isoDate) =>
  new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

const timeLabel = (isoSlot) => {
  const [h, m] = isoSlot.slice(11, 16).split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

const emptyForm = { date: '', time_slot: '', guests: '2', name: '', email: '', phone: '', newsletter: false }

function slotOptionLabel(slot) {
  if (slot.status === 'past') return `${slot.label} (passed)`
  if (slot.status === 'full') return `${slot.label} (fully booked)`
  if (slot.status !== 'open') return `${slot.label} (unavailable)`
  if (slot.tables_remaining <= 5) return `${slot.label} (${slot.tables_remaining} left)`
  return slot.label
}

export default function Reservations() {
  usePageTitle('Reservations')
  const today = restaurantNow().isoDate
  const maxDate = addDays(today, BOOKING_HORIZON_DAYS)

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [slots, setSlots] = useState(null) // null = no date chosen yet
  const [slotsState, setSlotsState] = useState('idle') // idle | loading | error
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const errorRef = useRef(null)
  const confirmRef = useRef(null)

  const loadSlots = useCallback(async (date) => {
    if (!date) return
    setSlotsState('loading')
    try {
      const data = await api.availability(date)
      setSlots(data.slots)
      setSlotsState('idle')
      return data.slots
    } catch (err) {
      setSlots(null)
      setSlotsState('error')
      setFormError(err.message)
    }
  }, [])

  useEffect(() => {
    if (confirmation) confirmRef.current?.focus()
  }, [confirmation])

  useEffect(() => {
    if (formError) errorRef.current?.focus()
  }, [formError])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function onDateChange(value) {
    setForm((f) => ({ ...f, date: value, time_slot: '' }))
    setErrors((e) => ({ ...e, date: undefined, time_slot: undefined }))
    setFormError(null)
    setSlots(null)
    if (value) loadSlots(value)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    const found = validateReservation(form)
    setErrors(found)
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0]
      document.getElementById(`res-${first}`)?.focus()
      return
    }

    setSubmitting(true)
    try {
      const res = await api.reserve({
        time_slot: form.time_slot,
        guests: Number(form.guests),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        newsletter: form.newsletter,
      })
      setConfirmation(res.reservation)
      setForm(emptyForm)
      setSlots(null)
    } catch (err) {
      if (err.code === 'validation_error') {
        setErrors(err.fields)
        setFormError('Some details need attention. Check the highlighted fields.')
      } else {
        setFormError(err.message)
        // The slot may have just filled up: refresh times so the guest sees current availability.
        if (['slot_full', 'conflict', 'invalid_slot'].includes(err.code)) {
          setForm((f) => ({ ...f, time_slot: '' }))
          loadSlots(form.date)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const openSlots = slots?.filter((s) => s.available) ?? []

  return (
    <div className="reserve-page">
      <div className="container reserve-layout">
        <div className="reserve-main">
          <h1>Book a table</h1>
          <p className="lede">
            Choose a date and time, and we’ll assign your table straight away. For parties larger than{' '}
            {MAX_GUESTS}, call us at <a href={restaurant.phoneHref}>{restaurant.phone}</a>.
          </p>

          {confirmation ? (
            <section className="confirmation" tabIndex={-1} ref={confirmRef} aria-labelledby="confirm-title">
              <h2 id="confirm-title">Your table is booked</h2>
              <p>
                Thank you, {confirmation.name}. We’ve reserved a table for you and look forward to your
                visit.
              </p>
              <dl className="confirmation__details">
                <div>
                  <dt>Date</dt>
                  <dd>{longDate(confirmation.time_slot.slice(0, 10))}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{timeLabel(confirmation.time_slot)}</dd>
                </div>
                <div>
                  <dt>Guests</dt>
                  <dd>{confirmation.guests}</dd>
                </div>
                <div>
                  <dt>Table</dt>
                  <dd>{confirmation.table_number}</dd>
                </div>
                <div>
                  <dt>Confirmation number</dt>
                  <dd>CF-{String(confirmation.reservation_id).padStart(5, '0')}</dd>
                </div>
              </dl>
              <div className="btn-row">
                <button type="button" className="btn btn--primary" onClick={() => setConfirmation(null)}>
                  Book another table
                </button>
                <Link to="/menu" className="btn btn--ghost">
                  See the menu
                </Link>
              </div>
            </section>
          ) : (
            <form className="reserve-form" onSubmit={handleSubmit} noValidate>
              {formError && (
                <div className="form-alert" role="alert" tabIndex={-1} ref={errorRef}>
                  {formError}
                </div>
              )}

              <fieldset>
                <legend>When</legend>
                <div className="field-row">
                  <Field id="res-date" label="Date" error={errors.date}>
                    <input
                      id="res-date"
                      type="date"
                      min={today}
                      max={maxDate}
                      value={form.date}
                      onChange={(e) => onDateChange(e.target.value)}
                      aria-invalid={Boolean(errors.date)}
                      aria-describedby={errors.date ? 'res-date-error' : undefined}
                      required
                    />
                  </Field>

                  <Field
                    id="res-time_slot"
                    label="Time"
                    error={errors.time_slot}
                    hint={
                      slotsState === 'loading'
                        ? 'Checking availability…'
                        : slots && !openSlots.length
                          ? 'No tables are left on this date. Try another day.'
                          : !form.date
                            ? 'Choose a date first.'
                            : null
                    }
                  >
                    <select
                      id="res-time_slot"
                      value={form.time_slot}
                      onChange={(e) => update('time_slot', e.target.value)}
                      disabled={!slots || slotsState === 'loading'}
                      aria-invalid={Boolean(errors.time_slot)}
                      aria-describedby="res-time_slot-hint res-time_slot-error"
                      required
                    >
                      <option value="">{slots ? 'Select a time' : '—'}</option>
                      {slots?.map((s) => (
                        <option key={s.time_slot} value={s.time_slot} disabled={!s.available}>
                          {slotOptionLabel(s)}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field id="res-guests" label="Guests" error={errors.guests}>
                    <select
                      id="res-guests"
                      value={form.guests}
                      onChange={(e) => update('guests', e.target.value)}
                      aria-invalid={Boolean(errors.guests)}
                      aria-describedby={errors.guests ? 'res-guests-error' : undefined}
                    >
                      {Array.from({ length: MAX_GUESTS }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'guest' : 'guests'}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </fieldset>

              <fieldset>
                <legend>Your details</legend>
                <div className="field-row field-row--2">
                  <Field id="res-name" label="Name" error={errors.name}>
                    <input
                      id="res-name"
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'res-name-error' : undefined}
                      required
                    />
                  </Field>
                  <Field id="res-email" label="Email" error={errors.email}>
                    <input
                      id="res-email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'res-email-error' : undefined}
                      required
                    />
                  </Field>
                  <Field id="res-phone" label="Phone (optional)" error={errors.phone}>
                    <input
                      id="res-phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? 'res-phone-error' : undefined}
                    />
                  </Field>
                </div>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.newsletter}
                    onChange={(e) => update('newsletter', e.target.checked)}
                  />
                  <span>Send me the Café Fausse newsletter</span>
                </label>
              </fieldset>

              <button type="submit" className="btn btn--primary reserve-form__submit" disabled={submitting}>
                {submitting ? 'Booking your table…' : 'Book table'}
              </button>
            </form>
          )}
        </div>

        <aside className="reserve-aside" aria-label="Reservation information">
          <img
            src="/images/detail-table-setting.webp"
            width="716"
            height="512"
            alt="A round table set with linen, silverware and flowers before service"
            loading="lazy"
          />
          <div className="reserve-aside__body">
            <h2>Hours</h2>
            <HoursList />
            <p>
              Seatings every 30 minutes, with the last seating one hour before closing. We hold tables for
              15 minutes.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Field({ id, label, error, hint, children }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error">
          {error}
        </p>
      )}
    </div>
  )
}
