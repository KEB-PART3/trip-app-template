import { useEffect, useState } from 'react'
import { ITINERARY, KICKOFF_ISO, MATCH, HOUSE_ADDRESS, HOUSE_DEST, mapsUrl, directionsUrl , TZ } from '../constants.js'
import { findCurrentAndNext, dayTimeToDate, diffParts } from '../time.js'
import { PHOTOS } from '../photos.js'
import Photo from '../components/Photo.jsx'

function fmtTime(dateStr, hhmm) {
  const d = dayTimeToDate(dateStr, hhmm)
  return d.toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })
}

export default function Itinerary({ focusDay = null, navSeq = 0 }) {
  const [, tick] = useState(0)
  useEffect(() => { const iv = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(iv) }, [])

  // Arriving from the Home rail's "Full →" (or a rail card): land on that day.
  // Depends on navSeq as well as focusDay so that tapping the same day twice
  // still jumps — App resets scroll to top on every navigation, so without the
  // nonce the second tap would leave you at the top of the page.
  useEffect(() => {
    if (!focusDay) return
    document.getElementById('day-' + focusDay)?.scrollIntoView({ block: 'start' })
  }, [focusDay, navSeq])

  const { current, next } = findCurrentAndNext(ITINERARY, new Date())
  const currentKey = current ? current.date + '|' + current.start : null
  const nextKey = next ? next.date + '|' + next.start : null

  return (
    <div className="itinerary">
      <h1 className="page-title">Itinerary</h1>
      <p className="page-sub">All times local.</p>
      {ITINERARY.map(day => (
        <section className="day" key={day.date} id={'day-' + day.date}>
          <h2 className="day-label">{day.label}</h2>
          <div className="events">
            {day.events.map(ev => {
              const key = day.date + '|' + ev.start
              const isCurrent = key === currentKey
              const isNext = !current && key === nextKey
              const when = `${fmtTime(day.date, ev.start)} – ${fmtTime(day.date, ev.end)}`
              const chips = <Chips isCurrent={isCurrent} isNext={isNext} />

              if (ev.marquee) {
                return (
                  <Marquee key={key} ev={ev} when={when} chips={chips} isCurrent={isCurrent} isNext={isNext} />
                )
              }
              if (ev.choices) {
                return (
                  <SplitRow key={key} ev={ev} day={day} chips={chips} isCurrent={isCurrent} isNext={isNext} />
                )
              }
              return (
                <Row key={key} ev={ev} day={day} chips={chips} isCurrent={isCurrent} isNext={isNext} />
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function Chips({ isCurrent, isNext }) {
  return (
    <>
      {isCurrent && <span className="chip chip-live">NOW</span>}
      {isNext && <span className="chip chip-next">NEXT</span>}
    </>
  )
}

// Real venues get a "Directions 📍" call to action — turn-by-turn from wherever the
// phone is standing (not just a map search). Events AT the house get a quieter
// "🏠 The house" location tag instead: you're already there, but it stays tappable
// (a plain map view) for Thursday, before anyone knows the address.
function MapLink({ query, label, className = '' }) {
  if (!query) return null
  const home = query === HOUSE_ADDRESS
  return (
    <a
      className={'map-link ' + (home ? 'map-link-home ' : '') + className}
      href={home ? mapsUrl(HOUSE_DEST) : directionsUrl(query)}
      target="_blank"
      rel="noreferrer"
      onClick={e => e.stopPropagation()}
    >
      {home ? '🏠 The house' : `${label || 'Directions'} 📍`}
    </a>
  )
}

// The same-slot fork: half the guys go one way, half the other, so the two
// activities render side by side as one event — parallel on screen because
// they're parallel in life. Each half card carries its own time, photo, and
// Directions; the shared header carries the NOW/NEXT chip for the slot.
function SplitRow({ ev, day, chips, isCurrent, isNext }) {
  return (
    <div className={'event event-split' + (isCurrent ? ' event-current' : '') + (isNext ? ' event-next' : '')}>
      <div className="split-head">{ev.title}{chips}</div>
      <div className="split-grid">
        {ev.choices.map(c => {
          const photo = c.photo ? PHOTOS[c.photo] : null
          return (
            <div className="split-card" key={c.title}>
              {photo && <Photo photo={photo} className="split-thumb" />}
              <div className="split-body">
                {/* Same time language as every other row: start over ↓ over end. */}
                <div className="event-time split-when">
                  <div>{fmtTime(day.date, c.start)}</div>
                  <div className="event-time-sep">↓</div>
                  <div>{fmtTime(day.date, c.end)}</div>
                </div>
                <div className="split-title">{c.title}</div>
                <div className="split-sub">{c.sub}</div>
                <MapLink query={c.map} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Row({ ev, day, chips, isCurrent, isNext }) {
  const photo = ev.photo ? PHOTOS[ev.photo] : null
  return (
    <div className={
      'event' +
      (photo ? ' event-photo' : '') +
      (isCurrent ? ' event-current' : '') +
      (isNext ? ' event-next' : '')
    }>
      <div className="event-time">
        <div>{fmtTime(day.date, ev.start)}</div>
        <div className="event-time-sep">↓</div>
        <div>{fmtTime(day.date, ev.end)}</div>
      </div>
      {photo && <Photo photo={photo} className="event-thumb" />}
      <div className="event-body">
        <div className="event-title">{ev.title}{chips}</div>
        <div className="event-sub">{ev.sub}</div>
        {ev.detail && <div className="event-detail">{ev.detail}</div>}
        <MapLink query={ev.map} label={ev.mapLabel} />
      </div>
    </div>
  )
}

function Marquee({ ev, when, chips, isCurrent, isNext }) {
  const cls = 'marquee' + (isCurrent ? ' marquee-current' : '') + (isNext ? ' marquee-next' : '')
  if (ev.match) return <MatchCard ev={ev} when={when} chips={chips} cls={cls} />
  if (ev.draft) return <DraftCard ev={ev} when={when} chips={chips} cls={cls} />

  const photo = PHOTOS[ev.photo]
  const avatar = ev.avatar ? PHOTOS[ev.avatar] : null
  return (
    <div className={cls}>
      <div className="mq-media">
        <Photo photo={photo} className="mq-bg" />
        <div className="mq-scrim" />
        <div className="mq-head">
          <div className="mq-when">{when}{chips}</div>
          <div className="mq-title">{ev.title}</div>
          <div className="mq-sub">{ev.sub}</div>
        </div>
      </div>
      {(ev.detail || ev.map) && (
        <div className="mq-body">
          {avatar && <Photo photo={avatar} className="mq-avatar" />}
          <div className="mq-body-text">
            {ev.detail && <p className="mq-detail">{ev.detail}</p>}
            <MapLink query={ev.map} label={ev.mapLabel} className="map-link-solo" />
          </div>
        </div>
      )}
    </div>
  )
}

function DraftCard({ ev, when, chips, cls }) {
  return (
    <div className={cls + ' mq-draft'}>
      <div className="mq-media mq-draft-media">
        <div className="mq-head">
          <div className="mq-when">{when}{chips}</div>
          <div className="mq-title">THE DRAFT</div>
          <div className="mq-sub">{ev.sub}</div>
        </div>
      </div>
    </div>
  )
}

function MatchCard({ ev, when, chips, cls }) {
  const d = diffParts(new Date(KICKOFF_ISO))
  return (
    <div className={cls + ' mq-match'}>
      <div className="mq-media">
        <Photo photo={PHOTOS.skyline} className="mq-bg" />
        <div className="mq-scrim" />
        <div className="mq-head">
          <div className="mq-when">{when}{chips}</div>
          <div className="mq-title">{MATCH.home} <span className="mq-vs">vs</span> {MATCH.away}</div>
          <div className="mq-sub">{MATCH.venue} · {MATCH.when}</div>
        </div>
      </div>

      <div className="seat">
        <div className="seat-block">
          <div className="seat-label">Section</div>
          <div className="seat-num">{MATCH.section}</div>
        </div>
        <div className="seat-block">
          <div className="seat-label">Row</div>
          <div className="seat-num">{MATCH.row}</div>
        </div>
      </div>

      <div className="mq-maprow"><MapLink query={ev.map} label={ev.mapLabel} className="map-link-solo" /></div>

      <div className="spotlight">
        <Photo photo={PHOTOS.houseDeck} className="spotlight-img" />
        <div className="spotlight-body">
          <div className="spotlight-title">Worth knowing</div>
          <p className="spotlight-text">{MATCH.note}</p>
        </div>
      </div>

      <div className="mq-body">
        <div className="cd-label">Kickoff in</div>
        {d.done ? (
          <div className="cd-live">⚽ Game underway.</div>
        ) : (
          <div className="cd-grid">
            <Cell v={d.days} label="days" />
            <Cell v={d.hours} label="hrs" />
            <Cell v={d.mins} label="min" />
            <Cell v={d.secs} label="sec" />
          </div>
        )}
      </div>
    </div>
  )
}

function Cell({ v, label }) {
  return (
    <div className="cd-cell">
      <div className="cd-num">{String(v).padStart(2, '0')}</div>
      <div className="cd-unit">{label}</div>
    </div>
  )
}
