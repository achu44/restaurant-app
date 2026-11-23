import { Link } from 'react-router-dom'
import { usePageTitle } from '../lib/usePageTitle.js'

export default function NotFound() {
  usePageTitle('Page not found')
  return (
    <section className="section">
      <div className="container">
        <h1>We couldn’t find that page</h1>
        <p className="lede">The link may be out of date. Try the menu, or book a table.</p>
        <div className="btn-row">
          <Link to="/" className="btn btn--primary">
            Go to the home page
          </Link>
          <Link to="/reservations" className="btn btn--ghost">
            Book a table
          </Link>
        </div>
      </div>
    </section>
  )
}
