// Client-side validation mirroring the Flask API rules (backend/app/validation.py).
export const MAX_GUESTS = 8
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/

export function validateEmail(value) {
  const email = (value || '').trim()
  if (!email) return 'Enter your email address.'
  if (email.length > 254 || !EMAIL_RE.test(email)) return 'Enter an email address like name@example.com.'
  return null
}

export function validateName(value) {
  const name = (value || '').trim()
  if (!name) return 'Enter the name for the reservation.'
  if (name.length > 120) return 'Use 120 characters or fewer.'
  return null
}

export function validatePhone(value) {
  const phone = (value || '').trim()
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!/^[0-9+()\-.\s]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
    return 'Enter a phone number like (202) 555-0100, or leave it blank.'
  }
  return null
}

export function validateReservation(values) {
  const errors = {
    date: values.date ? null : 'Choose a date.',
    time_slot: values.time_slot ? null : 'Choose a time.',
    guests:
      Number(values.guests) >= 1 && Number(values.guests) <= MAX_GUESTS ? null : 'Choose the number of guests.',
    name: validateName(values.name),
    email: validateEmail(values.email),
    phone: validatePhone(values.phone),
  }
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v))
}
