import { useEffect, useState } from 'react'
import { getWeather } from '../api.js'
import { TRIP_DATES, describeWeather } from '../constants.js'

// A cheeky one-liner for the conditions. Storms outrank heat outranks rain, so the card
// leads with the nastiest thing about the day. Pick is deterministic per day (hashed off
// the date) so it doesn't reshuffle on every re-render.
const VERDICTS = {
  storm: ['Ark weather', 'Biblical', 'Poncho o’clock', 'Gonna get wet', 'Bring the jacket'],
  hot:   ['Properly hot', 'Scorcher', 'Shade weather', 'Surface of the sun'],
  warm:  ['Toasty', 'A warm one', 'Shirt-sticking weather'],
  rain:  ['Soggy', 'Damp and grumpy', 'Umbrella day'],
  nice:  ['Chef’s kiss', 'Actually perfect', 'Golf weather', 'Patio weather'],
  meh:   ['Grey but fine', 'Meh skies', 'Nothing to report']
}

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

// heat = the temperature that matters for "is it nasty" (feels-like now, or the daily high).
function verdictFor(key, code, heat, pop) {
  let cat
  if (code >= 95 || (pop != null && pop >= 70)) cat = 'storm'
  else if (heat >= 93) cat = 'hot'
  else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (pop != null && pop >= 40)) cat = 'rain'
  else if (heat >= 85) cat = 'warm'
  else if (code <= 1) cat = 'nice'
  else cat = 'meh'
  const list = VERDICTS[cat]
  return { cat, text: list[hash(key) % list.length] }
}

// The expanded day: 8 AM to midnight in 2-hour steps — nine slots, one glance,
// "is the rain at tee time or after dark." A 24-row hour table would be
// overcomplicating it; this answers the actual question.
function Hourly({ data, date }) {
  const h = data?.hourly
  if (!date || !h?.time) return null
  const slots = []
  for (let i = 0; i < h.time.length; i++) {
    if (!h.time[i].startsWith(date)) continue
    const hr = Number(h.time[i].slice(11, 13))
    if (hr < 8 || hr % 2 !== 0) continue
    slots.push({
      hr,
      temp: Math.round(h.temperature_2m[i]),
      pop: h.precipitation_probability?.[i],
      emoji: describeWeather(h.weather_code[i])[1]
    })
  }
  if (!slots.length) return null
  const fmtHr = hr => (hr === 12 ? '12P' : hr < 12 ? hr + 'A' : (hr - 12) + 'P')
  return (
    <div className="hourly">
      {slots.map(s => (
        <div className="hourly-slot" key={s.hr}>
          <div className="hourly-hr">{fmtHr(s.hr)}</div>
          <div className="hourly-emoji">{s.emoji}</div>
          <div className="hourly-temp">{s.temp}°</div>
          <div className={'hourly-pop' + (s.pop >= 40 ? ' wet' : '')}>{s.pop != null ? s.pop + '%' : ''}</div>
        </div>
      ))}
    </div>
  )
}

export default function Weather() {
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  // Which day card is expanded to hourly (its date string), or null. Tap a day
  // to open, tap it again to close, tap another day to switch — accordion rules
  // every phone weather app already taught everyone.
  const [selDay, setSelDay] = useState(null)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const w = await getWeather()
        if (alive) { setData(w); setFailed(false) }
      } catch {
        if (alive) setFailed(true)
      }
    }
    load()
    const iv = setInterval(load, 30 * 60 * 1000)
    return () => { alive = false; clearInterval(iv) }
  }, [])

  if (failed && !data) {
    return (
      <div className="card weather">
        <div className="card-title">🌡️ Weather</div>
        <p className="weather-note">
          Typical mid-August: hot and humid, highs near 90°F, muggy nights, and a real chance
          of an afternoon thunderstorm. Pack light, hydrate, keep a backup plan for the storms.
        </p>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="card weather">
        <div className="card-title">🌡️ Weather</div>
        <div className="weather-loading">Checking the skies…</div>
      </div>
    )
  }

  const cur = data.current || {}
  const [curLabel, curEmoji] = describeWeather(cur.weather_code)
  const nowVerdict = verdictFor('now', cur.weather_code, cur.apparent_temperature, null)

  // All available forecast days.
  const daily = data.daily || {}
  const allDays = (daily.time || []).map((date, i) => ({
    date,
    code: daily.weather_code?.[i],
    hi: daily.temperature_2m_max?.[i],
    lo: daily.temperature_2m_min?.[i],
    pop: daily.precipitation_probability_max?.[i]
  }))
  // Show the trip days once they're in range; until then, a rolling preview of the next week.
  const tripDays = allDays.filter(d => TRIP_DATES.includes(d.date))
  const showingTrip = tripDays.length > 0
  const days = showingTrip ? tripDays : allDays.slice(0, 7)

  return (
    <div className="card weather">
      <div className="card-title">🌡️ Weather</div>

      {/* Two labelled sections: what it's like outside right now, then the trip
          forecast. Without the first label, the big 70° reads as ambiguous —
          today? Thursday? During the trip both stay useful: live conditions on
          top, the four days below. */}
      <div className="weather-strip-label">Right now</div>
      <div className="weather-now">
        <div className="wn-emoji">{curEmoji}</div>
        <div className="wn-temp">{Math.round(cur.temperature_2m)}°</div>
        <div className="wn-meta">
          <div className={'wn-verdict verdict-' + nowVerdict.cat}>{nowVerdict.text}</div>
          <div className="wn-sub">
            {curLabel} · feels {Math.round(cur.apparent_temperature)}° · {Math.round(cur.relative_humidity_2m)}% humidity
          </div>
        </div>
      </div>

      <div className="weather-strip-label">
        {showingTrip ? 'The trip, day by day' : 'The next week'}
        <span className="weather-strip-hint"> · tap a day for hourly</span>
      </div>
      <div className="weather-carousel">
        {days.map(d => {
          const [label, emoji] = describeWeather(d.code)
          const v = verdictFor(d.date, d.code, d.hi, d.pop)
          const day = new Date(d.date + 'T12:00:00')
          const dow = day.toLocaleDateString('en-US', { weekday: 'short' })
          const md = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const sel = selDay === d.date
          return (
            <button
              className={'wcard verdict-border-' + v.cat + (sel ? ' wcard-sel' : '')}
              key={d.date}
              onClick={() => setSelDay(sel ? null : d.date)}
            >
              <div className="wcard-dow">{dow}</div>
              <div className="wcard-date">{md}</div>
              <div className="wcard-emoji" title={label}>{emoji}</div>
              <div className="wcard-verdict" title={label}>{v.text}</div>
              <div className="wcard-temps">
                <span className="wcard-hi">{Math.round(d.hi)}°</span>
                <span className="wcard-lo">{Math.round(d.lo)}°</span>
              </div>
              {d.pop != null && <div className="wcard-pop">💧 {d.pop}%</div>}
            </button>
          )
        })}
      </div>
      <Hourly data={data} date={selDay} />
      {!showingTrip && (
        <p className="weather-mini-note">The trip forecast arrives about two weeks out.</p>
      )}
    </div>
  )
}
