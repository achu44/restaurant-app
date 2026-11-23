import { Link } from 'react-router-dom'
import { menu, formatPrice } from '../content/menu.js'
import { usePageTitle } from '../lib/usePageTitle.js'
import './Menu.css'

export default function Menu() {
  usePageTitle('Menu')

  return (
    <div className="menu-page">
      <header className="menu-page__header container">
        <h1>Menu</h1>
        <p className="lede">
          A short menu, cooked to order. Vegetarian dishes are marked (v). Please tell your server about
          any allergies.
        </p>
      </header>

      <nav className="menu-tabs" aria-label="Menu sections">
        {menu.map((c) => (
          <a key={c.id} href={`#${c.id}`}>
            {c.title}
          </a>
        ))}
      </nav>

      <div className="container menu-card">
        {menu.map((category) => (
          <section key={category.id} id={category.id} className="menu-section" aria-labelledby={`${category.id}-h`}>
            <h2 id={`${category.id}-h`}>{category.title}</h2>
            <ul>
              {category.items.map((item) => (
                <li key={item.name} className="menu-item">
                  <div className="menu-item__line">
                    <h3 className="menu-item__name">
                      {item.name}
                      {item.vegetarian && (
                        <abbr className="menu-item__veg" title="Vegetarian">
                          {' '}
                          (v)
                        </abbr>
                      )}
                    </h3>
                    <span className="menu-item__leader" aria-hidden="true" />
                    <span className="menu-item__price">
                      <span className="visually-hidden">Price: </span>${formatPrice(item.price)}
                    </span>
                  </div>
                  <p className="menu-item__desc">{item.description}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="section menu-cta">
        <div className="container">
          <h2>Dinner is served nightly from 5 PM</h2>
          <Link to="/reservations" className="btn btn--primary">
            Book a table
          </Link>
        </div>
      </section>
    </div>
  )
}
