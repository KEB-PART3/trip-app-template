// Lazy by default. Pass eager for the hero — it's the LCP image and lazy-loading it
// just delays the one thing people see first.
export default function Photo({ photo, className = '', eager = false, onClick }) {
  const cls = [
    'photo',
    photo.fit === 'contain' ? 'photo-contain' : '',
    photo.tile ? 'photo-tile-' + photo.tile : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <img
      className={cls}
      src={photo.src}
      alt={photo.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding={eager ? 'sync' : 'async'}
      fetchpriority={eager ? 'high' : 'auto'}
      onClick={onClick}
      draggable={false}
    />
  )
}
