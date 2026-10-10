import { MEMBERS, PAST_TRIPS, LAST_TRIP } from '../constants.js'

// Past trips — the group's own history, as a page.
//
// Entirely static: no API, no state, nothing to load. Everything is derived at
// module scope because the inputs never change.
//
// It is the page nobody asks for and everybody reads. If your group has a past
// — previous years, previous hosts, who has been to what — putting it on a
// screen costs an afternoon and buys more affection than most features.

// Ranked by trips attended, then by who started earliest.
const wall = [...MEMBERS].sort((a, b) => {
  if (b.trips !== a.trips) return b.trips - a.trips
  return a.firstTrip - b.firstTrip
})

// What each person's first year was, for the table.
const byFirst = [...MEMBERS].sort((a, b) => a.firstTrip - b.firstTrip || b.trips - a.trips)

const YEARS = PAST_TRIPS.length

export default function Lore() {
  return (
    <div className="lore">
      <h1 className="page-title lore-title">{YEARS} Years</h1>
      <p className="page-sub">Where we have been, and who keeps turning up.</p>

      <section className="reigning">
        <div className="reigning-text">
          <div className="reigning-year">LAST YEAR</div>
          <div className="reigning-team">{LAST_TRIP.place}</div>
          <div className="reigning-nick">{LAST_TRIP.year} · hosted by {LAST_TRIP.host}</div>
        </div>
      </section>

      <section className="card">
        <div className="card-title">The regulars <span className="card-title-note">trips</span></div>
        <ol className="wall">
          {wall.map((m, i) => (
            <li key={m.nick} className={'wall-row' + (i === 0 ? ' wall-reigning' : '')}>
              <div className="wall-rank">{i + 1}</div>
              <div className="wall-body">
                <div className="wall-team">
                  {m.nick}
                  {m.organizer && <span className="chip chip-gold">organiser</span>}
                </div>
                <div className="wall-nick">since {m.firstTrip}</div>
              </div>
              {/* The unit is stated once in the card title — repeating the word
                  "trips" down the right rail was the loudest thing on the page. */}
              <div className="wall-count">
                <div className="wall-num">{m.trips}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <div className="card-title">Every year</div>
        <div className="timeline">
          {PAST_TRIPS.map(t => (
            <div key={t.year} className={'tl-cell' + (t.year === LAST_TRIP.year ? ' tl-current' : '')}>
              <div className="tl-year">{t.year}</div>
              <div className="tl-team">{t.place}</div>
              <div className="tl-nick">{t.host}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-title">The record <span className="card-title-note">by first year</span></div>
        <table className="records">
          <thead>
            <tr><th className="rank">#</th><th>Who</th><th>First trip</th><th className="rec">Attended</th></tr>
          </thead>
          <tbody>
            {byFirst.map((m, i) => (
              <tr key={m.nick}>
                <td className="rank">{i + 1}</td>
                <td>{m.nick}</td>
                <td>{m.firstTrip}</td>
                <td className="rec">{m.trips}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="card-title">Notes</div>
        {PAST_TRIPS.filter(t => t.note).map(t => (
          <div className="win-row" key={t.year}>
            <div className="win-q">{t.year} · {t.place}</div>
            <div className="win-who">{t.note}</div>
          </div>
        ))}
      </section>
    </div>
  )
}
