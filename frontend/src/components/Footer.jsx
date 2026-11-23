import { Link } from 'react-router-dom'
import { restaurant } from '../content/restaurant.js'
import HoursList from './HoursList.jsx'
import NewsletterForm from './NewsletterForm.jsx'
import { navLinks } from './navLinks.js'
import './Footer.css'

const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <p className="site-footer__name">Café Fausse</p>
          <address>
            {restaurant.address.street}
            <br />
            {restaurant.address.city}
            <br />
            <a href={restaurant.phoneHref}>{restaurant.phone}</a>
          </address>
        </div>

        <div>
          <h2 className="site-footer__heading">Hours</h2>
          <HoursList />
        </div>

        <div className="site-footer__newsletter">
          <h2 className="site-footer__heading">Newsletter</h2>
          <NewsletterForm tone="dark" />
        </div>
      </div>

      <div className="container site-footer__base">
        <nav aria-label="Footer">
          <ul>
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <Link to={to}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <p>© {YEAR} Café Fausse. Serving Washington since {restaurant.founded}.</p>
      </div>
    </footer>
  )
}
