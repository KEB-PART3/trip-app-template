import { MEMBERS, FLIGHTS, GOLF, HOUSE_ADDRESS, HOUSE_LATLNG, uberUrl, directionsUrl, TRIP_END_ISO, shortAirline , TRIP_NAME } from '../constants.js'
import { dayTimeToDate } from '../time.js'
import { PHOTOS } from '../photos.js'
import { PropCard } from './Props.jsx'
import CarIcon from '../components/CarIcon.jsx'

// The Morning After — the home tab's final-day takeover (Sunday, Aug 16).
// Assembles itself from data the app already has: flights -> getaway board,
// props -> weekend-by-the-numbers, the Sunday superlative pack -> live awards
// voting. Zero organiser work on the one morning they're least capable of it.

const SUNDAY = TRIP_END_ISO.slice(0, 10) // '2026-08-16'
const AVL = { lat: 35.4361, lng: -82.5418 }
const FF27_TARGET = new Date('2028-06-08T00:00:00-04:00')

// '8:05 AM' -> '08:05' (24h) for dayTimeToDate
function to24h(t) {
  const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(t || '')
  if (!m) return null
  let h = Number(m[1]) % 12
  if (/pm/i.test(m[3])) h += 12
  return `${String(h).padStart(2, '0')}:${m[2]}`
}

function GetawayBoard({ now }) {
  // Group flyers by identical flight (same airline + number), keep roadtrippers
  // and no-data guys visible — everyone appears on the board.
  const groups = new Map()
  const roadtrip = []
  const unknown = []
  for (const m of MEMBERS) {
    const f = FLIGHTS[m.nick]
    if (!f) { unknown.push(m.nick); continue }
    if (f.roadtrip) { roadtrip.push(m.nick); continue }
    if (!f.departureTime) { unknown.push(m.nick); continue }
    const key = `${f.departureAirline} ${f.departureFlight}`
    if (!groups.has(key)) groups.set(key, { key, time: f.departureTime, airline: f.departureAirline, flight: f.departureFlight, who: [] })
    groups.get(key).who.push(m.nick)
  }
  const rows = [...groups.values()]
    .map(g => ({ ...g, at: dayTimeToDate(SUNDAY, to24h(g.time) || '23:59') }))
    .sort((a, b) => a.at - b.at)

  // The drivers have no departure time on file, so the board had no way to
  // retire them and they sat at full brightness while everyone else greyed out.
  // Proxy: they're gone once the FIRST plane is. It's a long haul home and
  // nobody driving it leaves after the 8:05 crowd — no invented clock times,
  // and the row dims on its own the same way the flights do.
  const firstOut = rows.length ? rows[0].at : null
  const roadGone = firstOut ? now >= firstOut : false

  const fmtLeft = at => {
    const ms = at - now
    if (ms <= 0) return { text: 'wheels up ✈️', urgent: false, gone: true }
    const h = Math.floor(ms / 3600000)
    const mm = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0')
    return { text: `leaves in ${h}:${mm}`, urgent: ms < 2.5 * 3600000, gone: false }
  }

  return (
    <div className="card">
      <div className="card-title">🛫 Getaway board</div>
      {rows.map(g => {
        const left = fmtLeft(g.at)
        return (
          <div key={g.key} className={'getaway-row' + (left.gone ? ' getaway-gone' : '')}>
            <div className="gr-time">{g.time}</div>
            <div>
              <div className="gr-who">{g.who.join(' · ')}</div>
              {/* Countdown rides the meta line instead of owning a third column —
                  the names keep the width and every row is the same two lines. */}
              <div className="gr-flight">
                {shortAirline(g.airline)} {g.flight} · <span className={'gr-count' + (left.urgent ? ' urgent' : '')}>{left.text}</span>
              </div>
            </div>
          </div>
        )
      })}
      {roadtrip.length > 0 && (
        <div className={'getaway-row' + (roadGone ? ' getaway-gone' : '')}>
          <div className="gr-time"><CarIcon width={23} /></div>
          <div>
            <div className="gr-who">{roadtrip.join(' · ')}</div>
            <div className="gr-flight">
              Roadtrip · <span className="gr-count">{roadGone ? 'on the road 🚗' : 'driving home'}</span>
            </div>
          </div>
        </div>
      )}
      {unknown.length > 0 && (
        <div className="getaway-row">
          <div className="gr-time">❓</div>
          <div>
            <div className="gr-who">{unknown.join(' · ')}</div>
            <div className="gr-flight">No flight on file</div>
          </div>
        </div>
      )}
      <a className="btn btn-primary jb-open" style={{ marginTop: 12 }}
         href={uberUrl('Asheville Regional Airport, Asheville, NC', AVL, 'Airport departures')}
         target="_blank" rel="noreferrer">
        🚗 Uber to the airport
      </a>
      <a className="map-link" style={{ marginTop: 10, display: 'inline-flex' }}
         href={directionsUrl(HOUSE_ADDRESS)} target="_blank" rel="noreferrer">
        📍 Back to the house one last time
      </a>
    </div>
  )
}

function Numbers({ predictions }) {
  const regular = predictions.filter(p => !p.superlative)
  const stats = []

  const totalVotes = predictions.reduce((n, p) => n + Object.keys(p.votes).length, 0)
  if (totalVotes) stats.push([String(totalVotes), 'prop votes cast this weekend'])

  const beer = regular.find(p => p.type === 'number' && /beer/i.test(p.question) && Object.keys(p.votes).length)
  if (beer) {
    const vals = Object.values(beer.votes).map(Number)
    stats.push([String(Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)), 'official league beer estimate (avg of your guesses)'])
    const boldest = Object.entries(beer.votes).sort((a, b) => b[1] - a[1])[0]
    stats.push([String(boldest[1]), `boldest beer guess (${boldest[0]}, obviously)`])
  }

  const contested = regular
    .filter(p => p.type === 'yesno' && Object.keys(p.votes).length >= 4)
    .map(p => {
      const vs = Object.values(p.votes)
      const yes = vs.filter(v => v === 'yes').length
      return { p, yes, no: vs.length - yes, gap: Math.abs(2 * yes - vs.length) }
    })
    .sort((a, b) => a.gap - b.gap || (b.yes + b.no) - (a.yes + a.no))[0]
  if (contested) stats.push([`${contested.yes}–${contested.no}`, `“${contested.p.question}” — the great debate`])

  const votesBy = {}
  for (const m of MEMBERS) votesBy[m.nick] = 0
  for (const p of predictions) for (const n of Object.keys(p.votes)) if (n in votesBy) votesBy[n]++
  const ranked = Object.entries(votesBy).sort((a, b) => b[1] - a[1])
  if (ranked.length && ranked[0][1] > 0) {
    stats.push([`${ranked[0][1]}`, `props voted by ${ranked[0][0]} — most engaged prophet`])
    const ghost = ranked[ranked.length - 1]
    if (ghost[1] === 0) stats.push(['0', `votes cast by ${ghost[0]} — the ghost 👻`])
  }

  if (!stats.length) return null
  return (
    <div className="card">
      <div className="card-title">📊 The weekend by the numbers</div>
      <div className="stat-grid">
        {stats.slice(0, 6).map(([num, cap]) => (
          <div className="stat" key={cap}>
            <div className="stat-num">{num}</div>
            <div className="stat-cap">{cap}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Post-trip: the tallied superlatives, locked. Winner = most votes; ties share it.
function Winners({ superlatives }) {
  const pretty = v => (v === 'yes' ? 'Yes' : v === 'no' ? 'No' : String(v))
  const results = superlatives.map(p => {
    // Tally case-insensitively ("Chattahoochee" and "chattahoochee" are one
    // song); display whichever casing was typed first.
    const tally = new Map()
    for (const v of Object.values(p.votes)) {
      const k = String(v).trim().toLowerCase()
      if (!k) continue
      const e = tally.get(k) || { label: String(v).trim(), n: 0 }
      e.n++; tally.set(k, e)
    }
    if (!tally.size) return null
    const top = Math.max(...[...tally.values()].map(e => e.n))
    const winners = [...tally.values()].filter(e => e.n === top).map(e => pretty(e.label))
    return { id: p.id, q: p.question, winners, top }
  }).filter(Boolean)
  if (!results.length) return null
  return (
    <div className="card">
      <div className="card-title">🏅 The 2026 Superlatives <span className="card-title-note">final</span></div>
      {results.map(r => (
        <div key={r.id} className="win-row">
          <div className="win-q">{r.q}</div>
          <div className="win-who">
            {r.winners.join(' · ')}
            <span className="win-count">{r.top} vote{r.top === 1 ? '' : 's'}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MorningAfter({ now, state, nick, onRefresh }) {
  const predictions = state?.predictions || []
  const superlatives = predictions.filter(p => p.superlative)
  const ff27Days = Math.max(0, Math.ceil((FF27_TARGET - now) / 86400000))
  // Sunday = live mode (getaway board, open voting). Monday onward = the yearbook:
  // countdown to '27 up top, results locked, numbers preserved, board retired.
  const postTrip = now.getTime() > new Date(TRIP_END_ISO).getTime()

  return (
    <div className="morning-after">
      <div className="ma-head">
        <div>
          <h1 className="page-title ma-title">{postTrip ? 'That Was ' + TRIP_NAME : 'The Morning After'}</h1>
          <p className="page-sub ma-sub">
            {postTrip ? 'In the books.' : 'One more airport run.'}
          </p>
        </div>
      </div>

      {postTrip && (
        <div className="card wrap-closer">
          <div className="wrap-bye">NEXT YEAR</div>
          <p className="jb-hint">
            Same time next year.<br />
            About <b>{ff27Days} days</b> to go.
          </p>
        </div>
      )}

      {!postTrip && <GetawayBoard now={now} />}

      {postTrip ? (
        <Winners superlatives={superlatives} />
      ) : superlatives.length > 0 && (
        <>
          <div className="ma-section-title">🏅 Sunday Superlatives — vote before wheels up</div>
          {superlatives.map(p => (
            <PropCard key={p.id} p={p} nick={nick} onRefresh={onRefresh} showBy={false} />
          ))}
          <p className="jb-hint" style={{ textAlign: 'center', marginTop: -4 }}>
            One vote each · results read aloud at the house · appeals denied
          </p>
        </>
      )}

      <Golf />

      <Numbers predictions={predictions} />

      {!postTrip && (
        <div className="card wrap-closer">
          <div className="wrap-bye">THAT'S A WRAP</div>
          <p className="jb-hint">
            It closes at wheels-up.<br />
            Next year: about <b>{ff27Days} days</b>.
          </p>
        </div>
      )}
    </div>
  )
}

// Friday's golf, as a leaderboard. Reuses the Wall of Champions row shape
// (rank | name over sub | number) rather than inventing a second board — it's
// the same job, and the app already has one answer for it.
function Golf() {
  const teams = [...GOLF.teams].sort((a, b) => a.score - b.score)
  const low = teams[0].score
  const outright = teams.filter(t => t.score === low).length === 1
  return (
    <div className="card">
      {/* No qualifier in the title — "Scramble · three teams of three" pushed it
          to two lines on a phone. It's footnote material, so it sits in the
          footnote with the venue. */}
      <div className="card-title">⛳ Golf</div>
      <ol className="wall golf-board">
        {teams.map(t => {
          // Ties share a rank and get a T, the way a real leaderboard reads.
          const tied = teams.filter(x => x.score === t.score).length > 1
          const rank = teams.findIndex(x => x.score === t.score) + 1
          const won = outright && t.score === low
          return (
            <li key={t.name} className={'wall-row' + (won ? ' wall-reigning' : '')}>
              <div className="wall-rank">{tied ? 'T' : ''}{rank}</div>
              <div className="wall-body">
                <div className="wall-team">{t.name}</div>
                <div className="wall-nick">{t.players.join(' · ')}</div>
              </div>
              <div className="wall-count golf-score">{t.score}</div>
            </li>
          )
        })}
      </ol>
      <p className="jb-hint golf-note">{GOLF.note}</p>
      <p className="jb-hint golf-venue">{GOLF.venue} · {GOLF.format} · {GOLF.roster}</p>
    </div>
  )
}

