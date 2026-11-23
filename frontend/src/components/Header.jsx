import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { navLinks } from './navLinks.js'
import './Header.css'

export default function Header() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="wordmark" aria-label="Café Fausse, home" onClick={close}>
          Café Fausse
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="nav-toggle__bars" aria-hidden="true" />
          <span className="visually-hidden">{open ? 'Close menu' : 'Open menu'}</span>
        </button>

        <nav id="site-nav" className={`site-nav${open ? ' is-open' : ''}`} aria-label="Main">
          <ul>
            {navLinks.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} onClick={close}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <Link to="/reservations" className="btn btn--brass site-nav__cta" onClick={close}>
            Book a table
          </Link>
        </nav>
      </div>
    </header>
  )
}
