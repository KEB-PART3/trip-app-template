import { useState } from 'react'
import { login } from '../api.js'
import { TRIP_NAME, TRIP_DATES, TRIP_CITY } from '../constants.js'

// Header copy is derived from constants.js — never hardcoded — so an adopter
// who replaces the trip data can't leave stale fantasy-weekend text behind.
function dateRange() {
  if (!TRIP_DATES?.length) return ''
  const atNoon = iso => new Date(iso + 'T12:00:00')
  const a = atNoon(TRIP_DATES[0])
  const b = atNoon(TRIP_DATES[TRIP_DATES.length - 1])
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
  const fmtA = a.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const fmtB = b.toLocaleDateString('en-US', sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' })
  return `${fmtA}–${fmtB}`
}

export default function Login({ onUnlock }) {
  const [pass, setPass] = useState('')
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      await login(pass) // the server checks the word and sets the cookie
      onUnlock()
    } catch (e) {
      setErr(e.message === 'Wrong word.' ? 'Wrong word. Try again.' : (e.message || 'Something went wrong.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login">
        <div className="login-header">
          <h1>{TRIP_NAME.toUpperCase()}</h1>
          <p className="login-sub">{dateRange()} · {TRIP_CITY}</p>
        </div>
        <form onSubmit={submit} className="login-form login-form-solo">
          <label className="lf-label">Trip passphrase</label>
          <input
            className="lf-input"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            autoFocus
            placeholder="say the magic word"
            value={pass}
            onChange={e => { setPass(e.target.value); setErr(null) }}
          />
          {err && <div className="lf-err">{err}</div>}
          <button className="lf-submit" type="submit" disabled={busy}>Enter</button>
          <p className="login-hint">If you’re on the trip, you know the word.</p>
        </form>
      </div>
    </div>
  )
}
