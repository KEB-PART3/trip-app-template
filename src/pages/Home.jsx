import { useEffect, useMemo, useRef, useState } from 'react'
import { DRAFT_ISO, ARRIVAL_ISO, TIMER_FLIP_ISO, TAGLINES, TRIP_START_ISO, TRIP_END_ISO, ITINERARY, describeWeather , TRIP_NAME , TZ } from '../constants.js'
import { getWeather } from '../api.js'
import { diffParts, findCurrentAndNext, dayTimeToDate, ymdCT } from '../time.js'
import { PHOTOS } from '../photos.js'
import Photo from '../components/Photo.jsx'
import Weather from '../components/Weather.jsx'
import HouseCard from '../components/HouseCard.jsx'
import MorningAfter from './MorningAfter.jsx'


// Countdown captions are derived from the ISO constants rather than typed out,
// so moving the trip's dates can't leave a stale label behind.
function fmtTarget(iso) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  }).replace(',', ' ·').replace(',', ' ·')
}

export default function Home({ state, nick, onRefresh, onNavigate }) {
  const [, tick] = useState(0)
  useEffect(() => { const iv = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(iv) }, [])

  const draftTarget = useMemo(() => new Date(DRAFT_ISO), [])
  const arrivalTarget = useMemo(() => new Date(ARRIVAL_ISO), [])
  const timerFlip = useMemo(() => new Date(TIMER_FLIP_ISO), [])
  const now = new Date()

  const d = diffParts(draftTarget)
  const dNash = diffParts(arrivalTarget)
  // Before Friday midnight the timer counts to arrivals; after, to the main event.
  const draftPhase = now >= timerFlip

  const [taglineIdx, setTaglineIdx] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setTaglineIdx(i => (i + 1) % TAGLINES.length), 4000)
    return () => clearInterval(iv)
  }, [])

  // The final day AND everything after: Home becomes the Morning After — live
  // getaway board + voting on Sunday, then the permanent yearbook (results,
  // numbers, the '27 countdown). The pre-trip Home never returns; a countdown
  // to a trip that already happened is worse than a memory of it.
  if (ymdCT(now) >= TRIP_END_ISO.slice(0, 10)) {
    return <MorningAfter now={now} state={state} nick={nick} onRefresh={onRefresh} />
  }

  return (
    <div className="home">
      <div className="hero-full">
        <Photo photo={PHOTOS.skyline} className="hero-bg" eager />
        <div className="hero-scrim" />
        <div className="hero-content">
          <h1 className="hero-title">{TRIP_NAME}</h1>
          <div className="hero-tagline" key={taglineIdx}>{TAGLINES[taglineIdx]}</div>
        </div>
      </div>

      <div className="card countdown-card countdown-float">
        {draftPhase ? (
          <>
            <div className="cd-label">THE MAIN EVENT</div>
            <div className="cd-time">{fmtTarget(DRAFT_ISO)}</div>
            {d.done ? (
              <div className="cd-live">🎉 UNDER WAY.</div>
            ) : (
              <div className="cd-grid">
                <TimeCell v={d.days} label="days" />
                <TimeCell v={d.hours} label="hrs" />
                <TimeCell v={d.mins} label="min" />
                <TimeCell v={d.secs} label="sec" />
              </div>
            )}
          </>
        ) : dNash.done ? (
          <>
            <div className="cd-label">ARRIVAL</div>
            <div className="cd-live">🎸 THE GANG’S ALL HERE 🐔</div>
            <div className="cd-note">Draft countdown starts at midnight.</div>
          </>
        ) : (
          <>
            <div className="cd-label">🛬 ARRIVAL</div>
            <div className="cd-time">{fmtTarget(ARRIVAL_ISO)}</div>
            <div className="cd-grid">
              <TimeCell v={dNash.days} label="days" />
              <TimeCell v={dNash.hours} label="hrs" />
              <TimeCell v={dNash.mins} label="min" />
              <TimeCell v={dNash.secs} label="sec" />
            </div>
          </>
        )}
      </div>

      <div className="hero-welcome">Not long now.</div>

      <TodayCard now={now} onNavigate={onNavigate} />

      <Weather />

      <HouseCard onNavigate={onNavigate} />
    </div>
  )
}



function TimeCell({ v, label }) {
  return (
    <div className="cd-cell">
      <div className="cd-num">{String(v).padStart(2, '0')}</div>
      <div className="cd-unit">{label}</div>
    </div>
  )
}

function fmtEventTime(dateStr, hhmm) {
  return dayTimeToDate(dateStr, hhmm).toLocaleString('en-US', {
    timeZone: TZ, hour: 'numeric', minute: '2-digit'
  })
}

// Today at a glance — a swipeable photo rail of the day's events.
// During the trip: today's lineup with DONE/NOW/NEXT states, auto-scrolled so the live
// card is front and center, rolling to the next day at Central midnight (ymdCT
// recomputes each render). Before the trip: a sneak-peek of one trip day, cycling to a
// different day each calendar day so the guys graze the whole weekend before they land.
// After the trip: a wrap line.
function TodayCard({ now, onNavigate }) {
  const today = ymdCT(now)
  const tripDay = ITINERARY.find(d => d.date === today)
  const beforeTrip = now < new Date(TRIP_START_ISO)
  const railRef = useRef(null)

  const live = !!tripDay
  // Pre-trip preview: cycle a different day each calendar day (flips at CT
  // midnight) — but only the FIRST three days. Sunday is goodbyes and the
  // the goodbyes; that's a memory, not a sales pitch.
  const previewIdx = Number(today.slice(-2)) % (ITINERARY.length - 1)
  const day = tripDay || ITINERARY[previewIdx]

  const { current, next } = live ? findCurrentAndNext(ITINERARY, now) : { current: null, next: null }
  const curKey = current ? current.date + '|' + current.start : null
  const nextKey = next ? next.date + '|' + next.start : null

  // The day's forecast, as a small chip in the header — "what's next AND do I need to
  // rethink it" in one glance. Renders nothing until the forecast covers the day
  // (Open-Meteo sees ~16 days out) or if weather is unreachable.
  const [wx, setWx] = useState(null)
  useEffect(() => {
    let alive = true
    getWeather().then(w => { if (alive) setWx(w) }).catch(() => {})
    return () => { alive = false }
  }, [])
  const wxIdx = wx?.daily?.time ? wx.daily.time.indexOf(day.date) : -1
  const wxHi = wxIdx >= 0 ? wx.daily.temperature_2m_max?.[wxIdx] : null
  const wxEmoji = wxIdx >= 0 ? describeWeather(wx.daily.weather_code?.[wxIdx])[1] : null

  // Keep the live card centered as NOW/NEXT moves through the day.
  useEffect(() => {
    if (!live || !railRef.current) return
    const el = railRef.current.querySelector('[data-live="1"]')
    if (el) railRef.current.scrollTo({ left: Math.max(0, el.offsetLeft - 24), behavior: 'smooth' })
  }, [live, curKey, nextKey])

  if (!live && !beforeTrip) {
    return (
      <div className="card today">
        <div className="card-title">That’s a wrap</div>
        <div className="today-lead">See you next year.</div>
      </div>
    )
  }

  const daysOut = Math.max(1, Math.ceil((dayTimeToDate(day.date, '00:00') - now) / 86400000))

  return (
    <div className="card today">
      {/* The day label gets the card's FULL width on its own row — sharing a row
          with the weather chip + Full button squeezed "Saturday, Aug 15 — DRAFT
          DAY" into a wrap on real phones (bigger fonts, live forecast chip). */}
      <div className="today-head">
        <div className="card-title">{live ? 'Today' : '🔮 Sneak peek'}</div>
        <div className="today-head-right">
          {wxHi != null && <span className="today-wx">{wxEmoji} {Math.round(wxHi)}°</span>}
          <button className="today-all" onClick={() => onNavigate('itinerary', { day: day.date })}>Full →</button>
        </div>
      </div>
      <div className="today-daylabel">{day.label}</div>
      {!live && <div className="today-peek-row"><span className="chip chip-gold today-peek-chip">in {daysOut} days</span></div>}
      <div className="today-rail" ref={railRef}>
        {day.events.map(ev => {
          const key = day.date + '|' + ev.start
          const startAt = dayTimeToDate(day.date, ev.start)
          const endAt = dayTimeToDate(day.date, ev.end)
          const isNow = live && key === curKey
          const isNext = live && !current && key === nextKey
          const done = live && now >= endAt && !isNow
          const photo = PHOTOS[ev.photo] || PHOTOS.skyline
          return (
            <button
              key={key}
              data-live={isNow || isNext ? '1' : undefined}
              className={'tr-card' + (isNow ? ' tr-now' : '') + (isNext ? ' tr-next' : '') + (done ? ' tr-done' : '')}
              onClick={() => onNavigate('itinerary', { day: day.date })}
              aria-label={`${ev.title}, ${fmtEventTime(day.date, ev.start)} — open the itinerary`}
            >
              {ev.draft
                ? (
                  <div className="tr-draft">
                  </div>
                )
                : <Photo photo={photo} className="tr-bg" />}
              <div className="tr-scrim" />
              {isNow && <span className="chip chip-live tr-chip">NOW</span>}
              {isNext && <span className="chip chip-next tr-chip">NEXT</span>}
              {done && <span className="tr-chip tr-chip-done">✓ done</span>}
              <div className="tr-text">
                <div className="tr-time">{fmtEventTime(day.date, ev.start)}</div>
                <div className="tr-title">{ev.title}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
