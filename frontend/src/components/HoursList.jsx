import { hours } from '../content/restaurant.js'
import { isToday } from '../lib/hours.js'
import './HoursList.css'

export default function HoursList({ className = '' }) {
  return (
    <dl className={`hours-list ${className}`}>
      {hours.map((h) => (
        <div key={h.label} className={isToday(h) ? 'is-today' : undefined}>
          <dt>
            {h.label}
            {isToday(h) && <span className="hours-list__today"> (today)</span>}
          </dt>
          <dd>{h.display}</dd>
        </div>
      ))}
    </dl>
  )
}
