import { useState } from 'react'
import { setPlaylist } from '../api.js'
import { PHOTOS } from '../photos.js'

// Turn a normal Spotify / Apple Music playlist link into its embeddable player URL.
// Returns null if it isn't a link we know how to embed.
function toEmbed(raw) {
  if (!raw) return null
  let u
  try { u = new URL(raw) } catch { return null }

  if (u.hostname === 'open.spotify.com') {
    // /playlist/<id>?si=...  ->  /embed/playlist/<id>
    const m = u.pathname.match(/^\/(playlist|album|track|artist)\/([A-Za-z0-9]+)/)
    if (!m) return null
    // 380 keeps title + open button + tab bar on one phone screen, no scrolling.
    return { provider: 'Spotify', src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, height: 380 }
  }
  if (/(^|\.)music\.apple\.com$/.test(u.hostname)) {
    return { provider: 'Apple Music', src: `https://embed.music.apple.com${u.pathname}${u.search}`, height: 380 }
  }
  return null
}

export default function Jukebox({ state, onRefresh }) {
  const url = state?.playlistUrl || ''
  const embed = toEmbed(url)

  const [value, setValue] = useState(url)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function save(next) {
    setBusy(true); setErr('')
    try {
      await setPlaylist(next)
      await onRefresh()
    } catch (e) {
      setErr(e.message || 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  // Once a playlist is saved, that's it for the weekend — the form only
  // exists while there's nothing set. (Changing it after that means editing
  // data/state.json on the Mini. Deliberate.)
  const showForm = !embed

  // The rules ARE the content while there's no playlist yet, so the disclosure
  // starts open during setup. Once the player exists, it starts closed — one
  // tap away, zero pixels in the way.
  const [showHow, setShowHow] = useState(!embed)

  return (
    <div className="jukebox">
      <h1 className="page-title">Jukebox</h1>
      <p className="page-sub">One shared playlist for the whole trip.</p>

      <button className="jb-how-toggle" onClick={() => setShowHow(s => !s)}>
        <span className="jb-how-badge">i</span>
        How the Jukebox works <span className="jb-how-caret">{showHow ? '▲' : '▼'}</span>
      </button>
      {showHow && (
        <div className="card jb-how">
          <ul className="jb-how-list">
            <li>
              <b>One playlist for the whole trip.</b> Saved here, same on every phone. Add
              songs from your own Spotify all weekend — you add it, you answer for it.
            </li>
            <li>
              <b>The app only plays 30-second previews.</b> Spotify's rules, not ours. For
              full songs, hit ▶ Open in Spotify — whichever phone is on the speaker is the
              jukebox.
            </li>
            <li>
              <b>Add songs, don't start a new playlist.</b> The party doesn't reboot
              mid-song.
            </li>
          </ul>
        </div>
      )}

      {embed && (
        <div className="jb-player">
          <iframe
            title={`${embed.provider} playlist`}
            src={embed.src}
            width="100%"
            height={embed.height}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
          <a className="btn btn-primary jb-open" href={url} target="_blank" rel="noreferrer">
            ▶ Open in {embed.provider} — full songs
          </a>
        </div>
      )}

      {showForm && (
        <div className="card jb-form">
          {!embed && (
            <div className="jb-empty">
              <div className="jb-empty-title">No playlist yet.</div>
              <p className="jb-empty-sub">
                Make a collaborative playlist in Spotify or Apple Music, turn on “everyone can
                add,” then paste its share link here. Everyone with the app can add songs to it.
              </p>
            </div>
          )}

          <label className="lf-label" htmlFor="jb-url">Playlist link</label>
          <input
            id="jb-url"
            className="lf-input"
            type="url"
            inputMode="url"
            placeholder="https://open.spotify.com/playlist/…"
            value={value}
            onChange={e => setValue(e.target.value)}
          />
          {err && <div className="lf-err">{err}</div>}

          <div className="jb-form-actions">
            <button className="btn btn-primary" disabled={busy || !value.trim()} onClick={() => save(value.trim())}>
              {busy ? 'Saving…' : 'Save playlist'}
            </button>
          </div>
          <p className="jb-hint">Spotify or Apple Music playlist links only.</p>
        </div>
      )}

    </div>
  )
}
