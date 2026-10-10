import { useState } from 'react'
import { MEMBERS, FLIGHTS, ARRIVAL_DAY, DEPARTURE_DAY, shortAirline } from '../constants.js'
import CarIcon from '../components/CarIcon.jsx'

// "1:20 PM" -> minutes since midnight, for sorting. Unparseable/blank sorts last.
function parseClock(s) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec((s || '').trim())
  if (!m) return 1e9
  let h = Number(m[1]) % 12
  if (/PM/i.test(m[3])) h += 12
  return h * 60 + Number(m[2])
}

// Read-only. Flight data is maintained by hand in FLIGHTS (constants.js), from the group
// spreadsheet — nobody edits it in the app. One chronological list, toggled between
// arrivals and departures: on a phone that beats a wide two-sided table, and the sorted
// order IS the pickup / Uber-share plan.
export default function Flights() {
  const [view, setView] = useState('arrivals')
  const arriving = view === 'arrivals'

  const rows = MEMBERS.map(m => ({ m, f: FLIGHTS[m.nick] || {} }))
  const roadtrippers = rows.filter(x => x.f.roadtrip)

  // An entry with its own arrivalDay (Morgan, Wednesday) lands before the default
  // Thursday crowd, so day sorts before clock. Departures are all Sunday.
  const dayRank = f => (arriving && f.arrivalDay ? 0 : 1)
  const time = f => (arriving ? f.arrivalTime : f.departureTime)
  const airline = f => (arriving ? f.arrivalAirline : f.departureAirline)
  const flightNo = f => (arriving ? f.arrivalFlight : f.departureFlight)

  // Same flight = same row: the 8:05 AM United 626 trio is one Uber, not three
  // list entries. Grouped by airline + flight number, then sorted chronologically.
  const groups = new Map()
  for (const { m, f } of rows) {
    if (f.roadtrip || !time(f)) continue
    const key = `${airline(f)} ${flightNo(f)}`
    if (!groups.has(key)) groups.set(key, { key, f, who: [] })
    groups.get(key).who.push(m.nick)
  }
  const flyers = [...groups.values()]
    .sort((a, b) => dayRank(a.f) - dayRank(b.f) || parseClock(time(a.f)) - parseClock(time(b.f)))

  return (
    <div className="flights">
      <h1 className="page-title">Flights</h1>
      {/* Both intros render stacked in one grid cell; the inactive one is
          invisible but still holds its height. The block is always as tall as
          the TALLER text, so the card below never jumps when the view flips. */}
      <div className="fl-intro">
        <p className={'page-sub' + (arriving ? '' : ' fl-intro-ghost')}>
          The coop fills up <b>{ARRIVAL_DAY}</b> — except Morgan, who sneaks in Wednesday
          night to claim the good bed.
        </p>
        <p className={'page-sub' + (arriving ? ' fl-intro-ghost' : '')}>
          <b>{DEPARTURE_DAY}</b>, it all falls apart. The 8:05 crew is gone before the rest are awake.
        </p>
      </div>

      <div className="card">
        <div className="fl-toggle">
          <button
            className={'btn fl-toggle-btn' + (arriving ? ' selected' : '')}
            onClick={() => setView('arrivals')}
          >
            🛬 Arrivals
          </button>
          <button
            className={'btn fl-toggle-btn' + (!arriving ? ' selected' : '')}
            onClick={() => setView('departures')}
          >
            🛫 Departures
          </button>
        </div>
        <div className="fl-daylabel">{arriving ? ARRIVAL_DAY : DEPARTURE_DAY} · AVL</div>
        <ol className="chrono">
          {flyers.map(({ key, f, who }) => (
            <li key={key}>
              <div className="chrono-when">
                {arriving && f.arrivalDay && <span className="day-note">{f.arrivalDay.split(',')[0]}</span>}
                {time(f)}
              </div>
              <div className="chrono-who">{who.join(' · ')}</div>
              <div className="chrono-flight">{shortAirline(airline(f))} {flightNo(f)}</div>
            </li>
          ))}
          {/* The drivers belong in the same table, not in a footnote under it — they're
              part of the same "who's getting here when" answer. No clock, so the time
              column carries the car and the carrier column says what they're on. */}
          {roadtrippers.length > 0 && (
            <li className="chrono-road">
              <div className="chrono-when"><CarIcon /></div>
              <div className="chrono-who">{roadtrippers.map(x => x.m.nick).join(' · ')}</div>
              <div className="chrono-flight">Roadtrip</div>
            </li>
          )}
        </ol>
      </div>
    </div>
  )
}
