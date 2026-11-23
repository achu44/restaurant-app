import { useCallback, useState } from 'react'
import Lightbox from '../components/Lightbox.jsx'
import { AwardsList, ReviewList } from '../components/Recognition.jsx'
import { galleryCategories, galleryImages } from '../content/gallery.js'
import { usePageTitle } from '../lib/usePageTitle.js'
import './Gallery.css'

export default function Gallery() {
  usePageTitle('Gallery')
  const [filter, setFilter] = useState('all')
  const [active, setActive] = useState(null)

  const visible = filter === 'all' ? galleryImages : galleryImages.filter((i) => i.category === filter)

  const navigate = useCallback(
    (step) => setActive((i) => (i == null ? i : (i + step + visible.length) % visible.length)),
    [visible.length],
  )

  return (
    <>
      <section className="gallery-page">
        <div className="container">
          <h1>Gallery</h1>
          <p className="lede">The dining room, the kitchen and a few evenings we remember well. Select a photo to enlarge it.</p>

          <div className="gallery-filters" role="group" aria-label="Filter photos">
            {galleryCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={filter === c.id}
                onClick={() => {
                  setFilter(c.id)
                  setActive(null)
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <ul className="gallery-grid">
            {visible.map((img, i) => (
              <li key={img.src} className={[img.wide && 'is-wide', img.tall && 'is-tall'].filter(Boolean).join(' ') || undefined}>
                <button type="button" className="gallery-tile" onClick={() => setActive(i)}>
                  <img src={img.thumb} alt={img.alt} width={img.width} height={img.height} loading="lazy" />
                  <span className="gallery-tile__caption">{img.caption}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--dark" aria-labelledby="awards-title">
        <div className="container">
          <h2 id="awards-title">Awards</h2>
          <AwardsList />
        </div>
      </section>

      <section className="section" aria-labelledby="reviews-title">
        <div className="container">
          <h2 id="reviews-title">What critics say</h2>
          <ReviewList />
        </div>
      </section>

      <Lightbox images={visible} index={active} onClose={() => setActive(null)} onNavigate={navigate} />
    </>
  )
}
