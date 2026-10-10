import { useEffect, useState } from 'react'
import { HOUSE_ACCESS } from '../constants.js'
import { copyText } from '../copy.js'

// Everything you need standing at the front door. Deliberately self-contained
// and page-agnostic — it takes no props and renders its own cards, so it can be
// dropped on the House page, the Home page, or its own tab without changing.
//
// Order is the order of the actual arrival: find it, get in, get online — and
// "Finding it" leads because it continues the Directions/Uber/Waymo buttons in
// the card directly above it. That ordering only works because the code and the
// wifi were promoted to the Home card; this page no longer has to front-load
// them, so it can read as a sequence instead of a leaderboard.
//
// The door code is still the hero of its own card — six digits is exactly long
// enough to fat-finger on a lock keypad, so it's a tap-to-copy target.
export default function ArrivalInfo() {
  const a = HOUSE_ACCESS
  return (
    <>
      <div className="card">
        <div className="card-title">🚗 Finding it</div>
        <p className="ai-step">{a.finding}</p>
        <p className="ai-step">{a.parking}</p>
      </div>

      <div className="card">
        <div className="card-title">🔑 Getting in</div>
        <CopyTarget className="ai-code" value={a.doorCode} label="door code">
          {a.doorCode.split('').join(' ')}
        </CopyTarget>
        {/* Numbered, not prose. Four discrete actions in a fixed order, done
            one-handed in the dark — a list is scannable mid-task in a way a
            sentence isn't, and it makes the ✓ step impossible to skim past. */}
        <ol className="ai-steps">
          {a.enterSteps.map(step => <li key={step}>{step}</li>)}
        </ol>
        <p className="ai-step ai-exit">{a.exit}</p>
      </div>

      <div className="card">
        <div className="card-title">📶 Wi-Fi</div>
        {/* Right-aligned values, same as the flights board — one alignment
            scheme across every table in the app. */}
        <div className="ai-row">
          <span className="ai-key">Network</span>
          <CopyTarget className="ai-val" value={a.wifiSsid} label="network name">{a.wifiSsid}</CopyTarget>
        </div>
        <div className="ai-row">
          <span className="ai-key">Password</span>
          <CopyTarget className="ai-val" value={a.wifiPass} label="wifi password">{a.wifiPass}</CopyTarget>
        </div>
        <p className="ai-note">Both the same. Tap either to copy.</p>
      </div>

    </>
  )
}

// A value you can tap to copy, with a brief confirmation.
//
// The confirmation resets on visibilitychange as well as on a timer: iOS
// freezes timers in backgrounded tabs, so someone who copies the wifi password
// and switches straight to Settings to paste it would otherwise come back to a
// stale "Copied" sitting there. Clearing on return costs one listener.
function CopyTarget({ value, label, className, children }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const done = () => setCopied(false)
    const t = setTimeout(done, 1600)
    const onVis = () => { if (document.hidden) done() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearTimeout(t); document.removeEventListener('visibilitychange', onVis) }
  }, [copied])

  return (
    <button
      type="button"
      className={className + (copied ? ' is-copied' : '')}
      onClick={() => { copyText(value); setCopied(true) }}
      aria-label={`Copy ${label}`}
    >
      <span className="ai-copy-text">{children}</span>
      <span className="ai-copy-hint">{copied ? 'Copied ✓' : 'Tap to copy'}</span>
    </button>
  )
}
