import { Link } from 'react-router-dom'
import { commitments, founders, history } from '../content/about.js'
import { usePageTitle } from '../lib/usePageTitle.js'
import './About.css'

export default function About() {
  usePageTitle('About us')

  return (
    <>
      <section className="about-intro">
        <div className="container about-intro__grid">
          <div>
            <h1>About Café Fausse</h1>
            <p className="about-intro__history">{history}</p>
          </div>
          <img
            src="/images/detail-banquette.webp"
            width="573"
            height="614"
            alt="A tufted leather banquette beside a mirrored wall and white flowers"
          />
        </div>
      </section>

      <section className="section" aria-labelledby="founders-title">
        <div className="container">
          <h2 id="founders-title">The founders</h2>
          <div className="founders">
            {founders.map((f) => (
              <article key={f.name} className="founder">
                <h3>{f.name}</h3>
                <p className="founder__role">{f.role}</p>
                {f.bio.map((para) => (
                  <p key={para.slice(0, 24)}>{para}</p>
                ))}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="commit-title">
        <div className="container">
          <h2 id="commit-title">What we promise every guest</h2>
          <ul className="commitments">
            {commitments.map((c) => (
              <li key={c.title}>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </li>
            ))}
          </ul>
          <div className="btn-row about-cta">
            <Link to="/reservations" className="btn btn--primary">
              Book a table
            </Link>
            <Link to="/gallery" className="btn btn--ghost">
              Look around the gallery
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
