import { useEffect } from 'react'

export default function Lightbox({ photos, index, onClose, onIndex }) {
  const open = index !== null
  const count = photos.length

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex((index + 1) % count)
      if (e.key === 'ArrowLeft') onIndex((index - 1 + count) % count)
    }
    window.addEventListener('keydown', onKey)
    // Don't let the page scroll behind the lightbox.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, index, count, onClose, onIndex])

  if (!open) return null
  const photo = photos[index]

  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label="Photo viewer">
      <button className="lb-close" onClick={onClose} aria-label="Close">✕</button>
      <img className="lb-img" src={photo.src} alt={photo.alt} onClick={e => e.stopPropagation()} />
      {count > 1 && (
        <>
          <button
            className="lb-nav lb-prev"
            aria-label="Previous photo"
            onClick={e => { e.stopPropagation(); onIndex((index - 1 + count) % count) }}
          >‹</button>
          <button
            className="lb-nav lb-next"
            aria-label="Next photo"
            onClick={e => { e.stopPropagation(); onIndex((index + 1) % count) }}
          >›</button>
          <div className="lb-count">{index + 1} / {count}</div>
        </>
      )}
    </div>
  )
}
