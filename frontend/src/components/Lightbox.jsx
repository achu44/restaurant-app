import { useEffect, useRef } from 'react'
import './Lightbox.css'

/**
 * Accessible image lightbox (SRS FR-13) built on the native <dialog> element, which
 * provides focus trapping, Escape-to-close and an inert background for free.
 * Arrow keys move between images; clicking the backdrop closes it.
 */
export default function Lightbox({ images, index, onClose, onNavigate }) {
  const dialogRef = useRef(null)
  const image = index == null ? null : images[index]

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (image && !dialog.open) dialog.showModal()
    if (!image && dialog.open) dialog.close()
  }, [image])

  useEffect(() => {
    if (!image) return
    const onKey = (e) => {
      if (e.key === 'ArrowRight') onNavigate(1)
      if (e.key === 'ArrowLeft') onNavigate(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [image, onNavigate])

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label={image ? image.caption : 'Image viewer'}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
    >
      {image && (
        <div className="lightbox__frame">
          <figure className="lightbox__figure">
            <img src={image.src} alt={image.alt} width={image.width} height={image.height} />
            <figcaption>
              <span>{image.caption}</span>
              <span className="lightbox__count">
                {index + 1} of {images.length}
              </span>
            </figcaption>
          </figure>
          <button type="button" className="lightbox__btn lightbox__close" onClick={onClose} autoFocus>
            <span aria-hidden="true">×</span>
            <span className="visually-hidden">Close image viewer</span>
          </button>
          {images.length > 1 && (
            <>
              <button type="button" className="lightbox__btn lightbox__prev" onClick={() => onNavigate(-1)}>
                <span aria-hidden="true">‹</span>
                <span className="visually-hidden">Previous image</span>
              </button>
              <button type="button" className="lightbox__btn lightbox__next" onClick={() => onNavigate(1)}>
                <span aria-hidden="true">›</span>
                <span className="visually-hidden">Next image</span>
              </button>
            </>
          )}
        </div>
      )}
    </dialog>
  )
}
