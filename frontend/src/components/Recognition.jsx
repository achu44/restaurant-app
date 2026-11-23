import { awards, reviews } from '../content/recognition.js'
import './Recognition.css'

export function AwardsList() {
  return (
    <ul className="awards">
      {awards.map((a) => (
        <li key={a.title}>
          <span className="awards__year">{a.year}</span>
          <span className="awards__title">{a.title}</span>
          {a.source && <span className="awards__source">{a.source}</span>}
        </li>
      ))}
    </ul>
  )
}

export function ReviewList({ limit }) {
  return (
    <div className="reviews">
      {reviews.slice(0, limit).map((r) => (
        <figure key={r.source} className="review">
          <blockquote>
            <p>“{r.quote}”</p>
          </blockquote>
          <figcaption>{r.source}</figcaption>
        </figure>
      ))}
    </div>
  )
}
