import { hours, restaurant } from '../content/restaurant.js'

/** Current wall-clock time in Washington, DC as { day, minutes, isoDate }. */
export function restaurantNow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: restaurant.timeZone,
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  )
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday)
  return {
    day,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    isoDate: `${parts.year}-${parts.month}-${parts.day}`,
  }
}

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export const formatClock = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m ? `${hour}:${String(m).padStart(2, '0')} ${suffix}` : `${hour} ${suffix}`
}

export const hoursForDay = (day) => hours.find((h) => h.days.includes(day))

/** A short, factual sentence about whether the restaurant is open right now. */
export function openStatus(date = new Date()) {
  const { day, minutes } = restaurantNow(date)
  const today = hoursForDay(day)
  const open = toMinutes(today.open)
  const close = toMinutes(today.close)
  if (minutes < open) return { open: false, text: `Opens today at ${formatClock(today.open)}` }
  if (minutes < close) return { open: true, text: `Open now until ${formatClock(today.close)}` }
  const tomorrow = hoursForDay((day + 1) % 7)
  return { open: false, text: `Closed now. Opens tomorrow at ${formatClock(tomorrow.open)}` }
}

export const isToday = (h, date = new Date()) => h.days.includes(restaurantNow(date).day)
