import { useId, useState } from 'react'
import { api } from '../api/client.js'
import { validateEmail } from '../lib/validation.js'
import './NewsletterForm.css'

/** Email newsletter sign-up (SRS FR-15/16). Stored server-side in customers.newsletter_signup. */
export default function NewsletterForm({ tone = 'dark' }) {
  const id = useId()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('idle') // idle | sending | done
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const problem = validateEmail(email)
    setError(problem)
    if (problem) return
    setStatus('sending')
    try {
      const res = await api.subscribe({ email: email.trim() })
      setMessage(res.message)
      setStatus('done')
      setEmail('')
    } catch (err) {
      setError(err.fields?.email || err.message)
      setStatus('idle')
    }
  }

  return (
    <form className={`newsletter newsletter--${tone}`} onSubmit={handleSubmit} noValidate>
      <label htmlFor={`${id}-email`} className="newsletter__label">
        Join our newsletter for seasonal menus and event evenings.
      </label>
      <div className="newsletter__row">
        <input
          id={`${id}-email`}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === 'done') setStatus('idle')
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-msg`}
        />
        <button className="btn btn--brass" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
      <p id={`${id}-msg`} className="newsletter__msg" role="status" aria-live="polite">
        {error ? <span className="newsletter__error">{error}</span> : status === 'done' ? message : ''}
      </p>
    </form>
  )
}
