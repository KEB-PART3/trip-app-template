import { TZ, TZ_OFFSET_HOURS } from './constants.js'

const fmtDate = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric'
})
const fmtTime = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, hour: 'numeric', minute: '2-digit'
})
const fmtDateTime = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
})

export function fmtCT(iso) { return fmtDateTime.format(new Date(iso)) }
export function dateCT(iso) { return fmtDate.format(new Date(iso)) }
export function timeCT(iso) { return fmtTime.format(new Date(iso)) }

// Today's date in the trip's timezone, as 'YYYY-MM-DD' to match ITINERARY day keys.
// en-CA formats as YYYY-MM-DD; recomputing each render means the "today" view rolls
// over at Central midnight with no extra timer.
const fmtYmd = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
})
export function ymdCT(date = new Date()) { return fmtYmd.format(date) }

// Turn a YYYY-MM-DD (trip timezone) + HH:mm (24h, may exceed 24 to indicate next day) into an ISO instant.
export function dayTimeToDate(dateStr, hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const addDays = h >= 24 ? 1 : 0
  const hour = h % 24
  const [y, mo, d] = dateStr.split('-').map(Number)
  // TZ_OFFSET_HOURS is the hours to add to local wall-clock time to get UTC.
  const utcMillis = Date.UTC(y, mo - 1, d + addDays, hour + TZ_OFFSET_HOURS, m, 0)
  return new Date(utcMillis)
}

export function diffParts(target) {
  const ms = Math.max(0, target.getTime() - Date.now())
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  return { days, hours, mins, secs, done: ms === 0 }
}

// Given now and the ITINERARY array, return { current, next } event refs
export function findCurrentAndNext(itinerary, now = new Date()) {
  const all = []
  for (const day of itinerary) {
    for (const ev of day.events) {
      // Keep ev.start/ev.end as the raw "HH:MM" strings (callers build keys from them);
      // expose the resolved instants as startAt/endAt.
      all.push({
        ...ev,
        startAt: dayTimeToDate(day.date, ev.start),
        endAt: dayTimeToDate(day.date, ev.end),
        dayLabel: day.label,
        date: day.date
      })
    }
  }
  all.sort((a, b) => a.startAt - b.startAt)
  let current = null
  let next = null
  for (const ev of all) {
    if (ev.startAt <= now && now < ev.endAt) { current = ev; break }
  }
  for (const ev of all) {
    if (ev.startAt > now) { next = ev; break }
  }
  return { current, next, all }
}
