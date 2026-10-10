import { PHOTOS } from '../photos.js'

// One-time add-to-home-screen coach, shown right after the nick pick. The guys
// will never find "Add to Home Screen" buried in the share sheet on their own —
// walk them through it once, then get out of the way forever.
//
// Skipped automatically when already running as an installed app (standalone).
export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

// Default to the iOS steps unless the device is definitely Android. Pick the
// default from what your group actually carries.
const UA = navigator.userAgent
const ANDROID = /Android/i.test(UA)
// Real Safari (mobile or desktop) vs an app's built-in browser (WhatsApp,
// Instagram, etc. — where Add to Home Screen doesn't exist) or another iOS
// browser. Real Safari carries the Safari/ token without a browser/app marker.
const IN_SAFARI = !ANDROID && /Safari\//.test(UA)
  && !/CriOS|FxiOS|EdgiOS|GSA|FBAN|FBAV|Instagram|Messenger|Snapchat|Line\//i.test(UA)

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px' }}>
    <path d="M12 3v12" /><path d="m8 7 4-4 4 4" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
)

export default function InstallCoach({ onDone }) {
  return (
    <div className="login-wrap">
      <div className="login">
        <div className="login-header">
          <div className="coach-icon coach-icon-mark">🧭</div>
          <h1>MAKE IT AN APP</h1>
          <p className="login-sub">30 seconds now, one tap all August.</p>
        </div>

        {!ANDROID ? (
          <ol className="coach-steps">
            {!IN_SAFARI && (
              <li>Open this page in <b>Safari</b> (you're in another app's browser — tap ⋯ or the compass icon, or copy the link into Safari).</li>
            )}
            <li>Tap the <b>Share</b> button <ShareIcon /> at the bottom of the screen.</li>
            <li>Scroll down and tap <b>“Add to Home Screen.”</b></li>
            <li>Tap <b>Add</b>. The icon lands on your home screen — that's the app.</li>
          </ol>
        ) : (
          <ol className="coach-steps">
            <li>Open this page in <b>Chrome</b>.</li>
            <li>Tap the <b>⋮ menu</b> (top right).</li>
            <li>Tap <b>“Add to Home screen”</b> (or <b>“Install app”</b>).</li>
            <li>Confirm. The icon lands on your home screen — that's the app.</li>
          </ol>
        )}

        {!ANDROID && (
          <p className="coach-alt">On Android? Chrome → ⋮ menu → “Add to Home screen.”</p>
        )}

        <button className="lf-submit" onClick={onDone}>Got it</button>
        <p className="login-hint">
          The browser works too — but the app is faster to access and way cooler.
          
        </p>
      </div>
    </div>
  )
}
