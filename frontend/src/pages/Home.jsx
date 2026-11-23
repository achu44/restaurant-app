import { Link } from 'react-router-dom'
import { restaurant } from '../content/restaurant.js'
import { history } from '../content/about.js'
import { menu, formatPrice } from '../content/menu.js'
import HoursList from '../components/HoursList.jsx'
import { AwardsList, ReviewList } from '../components/Recognition.jsx'
import { openStatus } from '../lib/hours.js'
import { usePageTitle } from '../lib/usePageTitle.js'
import './Home.css'

const featured = ['Ribeye Steak', 'Vegetable Risotto', 'Tiramisu']
const featuredItems = menu.flatMap((c) => c.items).filter((i) => featured.includes(i.name))

export default function Home() {
  usePageTitle(null)
  const status = openStatus()

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <img
          className="hero__img"
          src="/images/home-cafe-fausse.webp"
          srcSet="/images/home-cafe-fausse-800.webp 800w, /images/home-cafe-fausse.webp 1600w"
          sizes="100vw"
          width="1600"
          height="914"
          alt="The Café Fausse dining room: a gilded ceiling, crystal chandeliers and candlelit tables"
          fetchPriority="high"
        />
        <div className="hero__content container">
          <p className={`hero__status${status.open ? ' is-open' : ''}`}>{status.text}</p>
          <h1 id="hero-title" className="hero__title">
            Café Fausse
          </h1>
          <p className="hero__tagline">
            Italian cooking with a modern hand, in the heart of Washington, DC since {restaurant.founded}.
          </p>
          <div className="btn-row">
            <Link to="/reservations" className="btn btn--brass">
              Book a table
            </Link>
            <Link to="/menu" className="btn btn--ghost">
              See the menu
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <h2>A dining room made for long evenings</h2>
            <p className="lede">{history}</p>
            <Link to="/about">Meet Antonio and Maria</Link>
          </div>
          <img
            className="split__img"
            src="/images/gallery-cafe-interior-800.webp"
            srcSet="/images/gallery-cafe-interior-800.webp 800w, /images/gallery-cafe-interior.webp 1600w"
            sizes="(min-width: 900px) 50vw, 100vw"
            width="1600"
            height="914"
            loading="lazy"
            alt="The salon with wood-paneled walls, chandeliers and tables set with fresh flowers"
          />
        </div>
      </section>

      <section className="section section--tint">
        <div className="container kitchen">
          <img
            className="kitchen__img"
            src="/images/gallery-ribeye-steak-800.webp"
            width="800"
            height="800"
            loading="lazy"
            alt="Ribeye steak with roasted carrots and fresh herbs"
          />
          <div>
            <h2>From the kitchen</h2>
            <ul className="kitchen__list">
              {featuredItems.map((item) => (
                <li key={item.name}>
                  <span className="kitchen__name">{item.name}</span>
                  <span className="kitchen__price">${formatPrice(item.price)}</span>
                  <span className="kitchen__desc">{item.description}</span>
                </li>
              ))}
            </ul>
            <Link to="/menu" className="btn btn--primary">
              See the full menu
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container recognition">
          <h2 className="visually-hidden">Awards and reviews</h2>
          <ReviewList limit={1} />
          <AwardsList />
        </div>
      </section>

      <section className="section" aria-labelledby="visit-title">
        <div className="container visit">
          <div>
            <h2 id="visit-title">Visit us</h2>
            <address className="visit__address">
              {restaurant.address.street}
              <br />
              {restaurant.address.city}
            </address>
            <p>
              Call <a href={restaurant.phoneHref}>{restaurant.phone}</a> or book online. We hold tables
              for 15 minutes past the reservation time.
            </p>
            <Link to="/reservations" className="btn btn--primary">
              Book a table
            </Link>
          </div>
          <div className="visit__hours">
            <h3>Hours</h3>
            <HoursList />
          </div>
        </div>
      </section>
    </>
  )
}
