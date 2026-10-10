import { HOUSE_GALLERY } from '../photos.js'
import { HOUSE_ADDRESS, HOUSE_DEST, HOUSE_LATLNG, ARRIVAL_WINDOW_END_ISO, directionsUrl, uberUrl , ARRIVAL_DAY } from '../constants.js'
import Gallery from '../components/Gallery.jsx'
import WaymoLink from '../components/WaymoLink.jsx'
import ArrivalInfo from '../components/ArrivalInfo.jsx'

export default function House({ onBack }) {
  const gmaps = directionsUrl(HOUSE_DEST)
  const uber = uberUrl(HOUSE_ADDRESS, HOUSE_LATLNG, 'The house')
  return (
    <div className="house">
      <button className="back" onClick={onBack}>← Back</button>
      <h1 className="page-title">The House</h1>

      <Gallery photos={HOUSE_GALLERY} />

      <div className="card">
        <div className="house-address">1 Sample Street</div>
        <div className="house-sub">Asheville, NC</div>
        <div className="house-stats">
          <div><b>4</b> bedrooms</div>
          <div><b>13</b> beds<span className="stat-paren">(no sharing)</span></div>
          <div><b>4</b> baths</div>
        </div>
        <div className="host">Chris is our host.</div>
        {/* Same three rides as the Home card, in this page's button vocabulary
            rather than the photo-card pills. Waymo is last on purpose: it's the
            fun option, not the fast one, and it can't take a destination from a
            link — WaymoLink copies the address on the way out. */}
        <div className="map-btns">
          <a className="btn btn-primary" href={gmaps} target="_blank" rel="noreferrer">📍 Directions</a>
          <a className="btn btn-uber" href={uber} target="_blank" rel="noreferrer">🚗 Uber</a>
          <WaymoLink className="btn btn-waymo">🤖 Waymo</WaymoLink>
        </div>
      </div>

      <ArrivalInfo />

      {/* Check-in info stops being info once everyone's checked in. Cook lands at
          5; after 6 PM Thursday the card quietly retires. */}
      {Date.now() < new Date(ARRIVAL_WINDOW_END_ISO).getTime() && (
        <div className="card">
          <div className="card-title">🕛 Arrival window</div>
          <div className="house-arrival">{ARRIVAL_DAY} · <b>12:00 – 5:00 PM</b></div>
          <div className="muted">Coordinate landings on the Flights page.</div>
        </div>
      )}
    </div>
  )
}
