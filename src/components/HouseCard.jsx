import { useEffect, useState } from 'react'
import { HOUSE_ACCESS, HOUSE_ADDRESS, HOUSE_DEST, HOUSE_LATLNG, directionsUrl, uberUrl } from '../constants.js'
import { PHOTOS } from '../photos.js'
import { copyText } from '../copy.js'
import Photo from './Photo.jsx'
import WaymoLink from './WaymoLink.jsx'

// The House, as a self-contained card on Home.
//
// It used to be a bare photo card floating between the weather card and the
// bottom of the page — the only block on Home without a container, while Sneak
// peek and the weather card both had a titled header with a way in on the
// right. This adopts that same shape, which is why it borrows .today-head and
// .today-all rather than inventing a second version of them.
//
// What's on the card is what you need standing at the front door: the code, the
// wifi, and the one instruction that makes the lock work. Everything else —
// parking, finding the complex, how to lock up, the check-in caveat — lives
// behind "Details →" on the House page. The split is deliberate: this card is
// for someone holding a bag, not someone reading.
export default function HouseCard({ onNavigate }) {
  return (
    <div className="card house-home">
      <div className="today-head">
        <div className="card-title">🏠 The House</div>
        <button className="today-all" onClick={() => onNavigate('house')}>Details →</button>
      </div>

      <div className="photo-card hh-photo">
        <button className="pc-open" onClick={() => onNavigate('house')} aria-label="Open house details">
          <Photo photo={PHOTOS.houseRoof} className="pc-bg" />
          <div className="pc-scrim" />
          <div className="pc-text">
            <div className="pc-title">Take me home</div>
            <div className="pc-sub">1 Sample Street · Downtown · 4 bd · 13 beds</div>
          </div>
        </button>
        <div className="pc-btns">
          <a className="pc-directions" href={directionsUrl(HOUSE_DEST)} target="_blank" rel="noreferrer">
            <span className="pc-ico">📍</span>Directions
          </a>
          <a className="pc-directions pc-uber" href={uberUrl(HOUSE_ADDRESS, HOUSE_LATLNG, 'The house')} target="_blank" rel="noreferrer">
            <span className="pc-ico">🚗</span>Uber
          </a>
          <WaymoLink className="pc-directions pc-waymo"><span className="pc-ico">🤖</span>Waymo</WaymoLink>
        </div>
      </div>

      <AccessCols />
    </div>
  )
}

// The two values worth having without navigating anywhere, plus the step that
// makes them useful.
//
// The lock line is NOT hidden behind a tap. The code on its own does not open
// the door — the keypad ignores you until the Yale button wakes it, and the
// handle won't turn until you confirm with ✓ — so a first-timer holding only
// the digits stands there pressing numbers at a lock that isn't listening. One
// line of always-on text is the cheapest possible insurance against that.
function AccessCols() {
  // Which cell was just copied, or '' for none. One value rather than a flag
  // per cell so a second tap moves the confirmation instead of lighting two.
  const [hit, setHit] = useState('')
  useEffect(() => {
    if (!hit) return
    const clear = () => setHit('')
    const t = setTimeout(clear, 1600)
    // iOS freezes timers in backgrounded tabs. Someone who copies the wifi
    // password and switches straight to Settings to paste it would otherwise
    // come back to a stale "Copied ✓" that never expired.
    const onVis = () => { if (document.hidden) clear() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearTimeout(t); document.removeEventListener('visibilitychange', onVis) }
  }, [hit])

  const tap = (key, value) => { copyText(value); setHit(key) }

  return (
    <>
      <div className="hh-cols">
        <button className="hh-col" onClick={() => tap('code', HOUSE_ACCESS.doorCode)}
                aria-label="Copy the door code">
          <span className="hh-k">🔑 Door code</span>
          <span className={'hh-v' + (hit === 'code' ? ' is-hit' : '')}>
            {hit === 'code' ? 'Copied ✓' : HOUSE_ACCESS.doorCode}
          </span>
        </button>
        <div className="hh-div" />
        <button className="hh-col" onClick={() => tap('wifi', HOUSE_ACCESS.wifiPass)}
                aria-label="Copy the wifi password">
          <span className="hh-k">📶 Wi-Fi</span>
          <span className={'hh-v' + (hit === 'wifi' ? ' is-hit' : '')}>
            {hit === 'wifi' ? 'Copied ✓' : HOUSE_ACCESS.wifiPass}
          </span>
        </button>
      </div>
      <p className="hh-hint">{HOUSE_ACCESS.enterShort}</p>
    </>
  )
}
