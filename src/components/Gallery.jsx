import { useRef, useState, useEffect } from 'react'
import Photo from './Photo.jsx'
import Lightbox from './Lightbox.jsx'

// Swipe is native scroll + CSS scroll-snap — no drag handlers to fight the browser.
// The active dot comes from an IntersectionObserver rather than an onScroll handler:
// it fires only when a slide actually becomes the visible one, instead of on every
// scroll frame.
export default function Gallery({ photos }) {
  const trackRef = useRef(null)
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const slides = [...track.querySelectorAll('.gallery-slide')]

    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(slides.indexOf(e.target))
        }
      },
      { root: track, threshold: 0.6 }
    )
    slides.forEach(s => io.observe(s))
    return () => io.disconnect()
  }, [photos])

  function go(i) {
    const el = trackRef.current
    if (!el) return
    setActive(i) // don't wait for the observer — the tap should feel instant
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="gallery">
      <div className="gallery-track" ref={trackRef}>
        {photos.map((p, i) => (
          <div className="gallery-slide" key={p.src}>
            <Photo photo={p} eager={i === 0} onClick={() => setLightbox(i)} />
          </div>
        ))}
      </div>

      <div className="gallery-dots">
        {photos.map((p, i) => (
          <button
            key={p.src}
            className={'dot' + (i === active ? ' dot-on' : '')}
            aria-label={`Photo ${i + 1} of ${photos.length}`}
            aria-current={i === active}
            onClick={() => go(i)}
          />
        ))}
      </div>

      <Lightbox photos={photos} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
    </div>
  )
}
