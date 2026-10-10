# The Jukebox — Build Spec

One shared playlist for a group trip, embedded in the app, set up once by whoever gets there first. Plus a collapsible "how this works" panel that opens itself during setup and stays out of the way afterwards.

This is a spec for an agent to implement from. Code samples are React + a small Express backend, but the only real dependencies are: a way to persist one string, and an `<iframe>`.

---

## 0. What it actually is

**The Jukebox is a text field that holds one URL.** Everything else is presentation.

There is no music library, no search, no queue, no now-playing, no accounts, no OAuth, no Spotify Web API, no API key, and no per-user state. Someone makes a collaborative playlist in Spotify or Apple Music, turns on "everyone can add," and pastes the share link into the app. The app stores that string and renders the provider's own embedded player.

Resist every instinct to build more than this. The temptation is to integrate properly with the Spotify Web API so the app can show tracks, handle adds, display who queued what. That path needs OAuth per user, a registered app, token refresh, scope approval, and it still can't play full songs in a browser without Premium and the Web Playback SDK. **The share-link approach delivers 95% of the value for about 90 lines of code and zero credentials.** The remaining 5% is not worth the rest of your weekend.

---

## 1. The data model

One field. That is the whole model.

```json
{ "playlistUrl": "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M" }
```

Store it wherever the app already stores shared state — a JSON file on disk is fine for a group of ten. The empty string is meaningful: it's the "not set up yet" state, and clearing the field returns the app to setup mode.

### Why shared, not per-user

Every phone reads the same field. Nobody logs in, nobody picks a playlist for themselves. **It's a jukebox — there's one, and it's in the room.** Storing this per-user would let the group silently fragment into ten private playlists, which is the exact opposite of the point.

---

## 2. The URL → embed transform

The only real logic in the feature. Take a share link, return an embeddable player URL, or return `null` if it isn't something you can embed.

```js
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
    return {
      provider: 'Spotify',
      src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
      height: 380
    }
  }

  if (/(^|\.)music\.apple\.com$/.test(u.hostname)) {
    return {
      provider: 'Apple Music',
      src: `https://embed.music.apple.com${u.pathname}${u.search}`,
      height: 380
    }
  }

  return null
}
```

Five things to copy exactly.

**Parse with `new URL()` inside a try/catch**, never with a regex against the raw string. A user paste can be anything — a bare word, a `spotify:` URI, text with a trailing space. The constructor throws on garbage, and the catch turns that into `null`, which the UI already knows how to render.

**Match on `u.hostname`, not `raw.includes('spotify')`.** A substring check against a full URL is how you end up embedding `evil.com/?x=open.spotify.com`. The hostname is the only part of a URL that's safe to make a trust decision on.

**Accept `playlist|album|track|artist`.** Someone will paste an album link, and it embeds identically. Supporting all four costs four words in the regex and avoids a confusing rejection.

**Drop the query string on Spotify, keep it on Apple.** Spotify share links carry `?si=<tracking-token>`, which the embed doesn't need and which is personal to whoever copied it. Apple Music's embed path genuinely needs its query params, so they're preserved. Two providers, two rules — don't generalise them into one.

**Return the provider's display name**, so the UI can say "Open in Spotify" rather than "Open in the music app." The transform is the only place that knows which service this is; carrying the name out of it means nothing else has to re-detect it.

### Returning `null` is the whole error-handling strategy

There's no `isValid` boolean and no error type. `toEmbed()` returns an embed or nothing, and the component branches on truthiness:

```js
const embed = toEmbed(url)
const showForm = !embed
```

A stored-but-unembeddable URL therefore lands the user back on the setup form with their text still in the box — which is the correct recovery without writing any recovery code.

---

## 3. The server

One endpoint. `PUT`, because it replaces a single value.

```js
app.put('/api/playlist', (req, res) => {
  const url = String((req.body || {}).url || '').trim()

  if (url && !/^https:\/\/(open\.spotify\.com|([a-z-]+\.)?music\.apple\.com)\//i.test(url)) {
    return res.status(400).json({ error: 'Paste a Spotify or Apple Music playlist link.' })
  }

  const s = readState()
  s.playlistUrl = url.slice(0, 400)
  writeState(s)
  res.json(s)
})
```

**Validate on the server too, not only in `toEmbed`.** The client transform decides what to *render*; the server decides what may be *stored*. They're separate jobs, and the server can't trust that a request came from your client.

**Require `https://` and anchor the pattern with `^`.** Without the anchor, `https://evil.com/?=https://open.spotify.com/` passes. This value ends up as an iframe `src` on every member's phone, so it's the one input in the app worth being strict about.

**Cap the length** (`.slice(0, 400)`). Share links are well under 200 characters; the cap stops the state file from being used as free storage.

**An empty string is valid and clears the playlist.** That's the admin reset, and it needs no separate endpoint.

**Return the whole state object**, so the client can refresh from one response rather than making a second call.

On the client:

```js
export async function setPlaylist(url) {
  const r = await fetch('/api/playlist', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url })
  })
  if (!r.ok) await fail(r, 'save failed')
  return r.json()
}
```

### On authorisation

This endpoint has none. Anyone who can reach the app can set the playlist.

That was a deliberate call: the app already sat behind a shared passphrase, the group was ten friends, and a playlist is a shared tab rather than a permissioned resource. **If your app is bigger or the group is less trusted, gate it** — but gate it with whatever identity you already have, and don't build an identity system for this one field.

---

## 4. The two states

The page has exactly two modes, and it picks by asking whether there's an embeddable URL.

```js
const url = state?.playlistUrl || ''
const embed = toEmbed(url)
const showForm = !embed
```

### State A — empty

Mascot or illustration, a headline, one paragraph of instruction, a URL field, a save button.

```jsx
<div className="jb-empty">
  <img className="jb-empty-art" src={PHOTOS.mascot.src} alt={PHOTOS.mascot.alt} />
  <div className="jb-empty-title">No playlist yet.</div>
  <p className="jb-empty-sub">
    Make a collaborative playlist in Spotify or Apple Music, turn on "everyone can
    add," then paste its share link here. Everyone with the app can add songs to it.
  </p>
</div>
```

**The empty state carries the setup instructions**, because the person seeing it is by definition the person who has to do the setup. Don't put this in a help page. The two steps they might not know — *make it collaborative* and *turn on "everyone can add"* — are named explicitly, because a playlist that isn't collaborative looks identical until someone tries to add a song and quietly fails.

### State B — set

Player, then a full-width button to open the real app.

```jsx
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
```

The `allow` list is required. Without `encrypted-media` the player won't play at all (DRM), and without `autoplay` the first tap does nothing on some browsers. Copy the string.

### Set once, then the form disappears

```js
const showForm = !embed
```

Once a playlist is saved, the form is gone. Changing it means editing the state file on the server.

This is deliberate and worth keeping. **A visible "change playlist" button on a shared screen is an invitation**, and swapping the playlist mid-weekend wipes what everyone has added. Making it slightly annoying for one admin is a much better trade than making it one tap for ten people. There is a `.jb-change` style in the codebase from an earlier version — it's unused, and it should stay unused.

---

## 5. The disclosure panel

The part worth reading twice.

### The interaction

```jsx
const [showHow, setShowHow] = useState(!embed)

<button className="jb-how-toggle" onClick={() => setShowHow(s => !s)}>
  <span className="jb-how-badge">i</span>
  How the Jukebox works <span className="jb-how-caret">{showHow ? '▲' : '▼'}</span>
</button>

{showHow && (
  <div className="card jb-how">
    <ul className="jb-how-list"> … </ul>
  </div>
)}
```

Tap the header to open. Tap it again to close. The caret flips `▼` → `▲`. The panel mounts and unmounts rather than hiding with CSS, so it occupies zero pixels when closed. One piece of boolean state, one handler.

### The initial state is computed, not constant

```js
const [showHow, setShowHow] = useState(!embed)
```

**This is the idea to steal from the whole document.** The panel starts *open* when there's no playlist yet, and *closed* once the player exists.

The reasoning: during setup, the rules **are** the content — there's nothing else on the page worth looking at, and the person standing there is the one who needs to know that the playlist has to be collaborative. After setup, the player is the content, and a permanently-expanded explainer pushes it down the screen for everyone who already read it on day one.

So the same component is a tutorial on first run and a footnote forever after, with no flag, no "seen it" tracking, and no persistence. **The state it derives from is already there.** That's what makes it free: `!embed` is the same expression that drives `showForm`.

Generalise it as: *when a disclosure's default should differ between a first-run and a steady state, derive the default from whatever already distinguishes those two states.* Don't reach for `localStorage` — a "have they seen this" flag is per-device, gets wiped, doesn't survive a reinstall, and is invisible in a code review.

### Why it's not `<details>`

The native element gives you this for free, and it's a reasonable choice. It was rejected here for three reasons: styling the marker consistently across browsers is more CSS than the JS it replaces; you can't put a custom badge and a flipping caret in the summary without fighting `::marker`/`::-webkit-details-marker`; and the open/closed state isn't in React state where the rest of the component can reason about it.

If you don't need the custom chrome, use `<details>`. If you do, the two-line `useState` is cheaper than it looks.

### The toggle is a real `<button>`

```css
.jb-how-toggle {
  background: none; border: none; cursor: pointer; padding: 4px 0;
  color: var(--gold-2); font-weight: 800; font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px;
}
```

Not a `<div onClick>`. It's keyboard-focusable, it fires on Enter and Space, and screen readers announce it as a control, all for free. Style the button down to look like text — never style text up to act like a button.

For full correctness add `aria-expanded={showHow}` to the button. The shipped version omits it; if you're writing this fresh, put it in.

### The badge

```css
.jb-how-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 17px; height: 17px; border-radius: 50%;
  border: 1.5px solid var(--gold-2); color: var(--gold-2);
  font-size: 11px; font-weight: 900; font-style: italic;
  font-family: Georgia, 'Times New Roman', serif; flex: none;
  padding-right: 1px;   /* italic 'i' leans right; optically recenter */
}
```

A drawn circle with a serif italic `i`, not the ℹ️ emoji. The emoji renders as a blue square on iOS, a different blue square on Android, and it drags a platform's design language into the middle of yours. A 17px circle in your own accent colour costs eight lines and always matches.

The `padding-right: 1px` is not a typo. An italic glyph leans right, so centring it geometrically makes it look left-of-centre; a pixel of right padding pulls it back optically. This is the kind of thing that's invisible when right and slightly wrong-feeling when absent.

### The content

Three bullets. Not five, not a paragraph.

> **One playlist for the whole trip.** Saved here, same on every phone. Add songs from your own Spotify all weekend — you add it, you answer for it.
>
> **The app only plays 30-second previews.** Spotify's rules, not ours. For full songs, hit ▶ Open in Spotify — whichever phone is on the speaker is the jukebox.
>
> **Add songs, don't start a new playlist.** The party doesn't reboot mid-song.

Each bullet leads with a bolded claim and follows with one sentence of consequence, so the panel is skimmable at a glance and readable in full if you care.

The middle bullet is the one that has to exist. **Without it, the feature reads as broken** — a user taps play, gets thirty seconds, and concludes the app is busted. Naming the limitation as the platform's rule and immediately pointing at the fix turns a bug report into a shrug. Find the equivalent limitation in whatever you're building and say it out loud in the same place.

```css
.jb-how-list {
  margin: 0; padding-left: 18px;
  display: flex; flex-direction: column; gap: 10px;
  font-size: 14px; line-height: 1.45;
}
.jb-how-list li::marker { color: var(--gold); }
```

Tinting `::marker` to the accent colour is one line and it's the difference between a styled list and a default one.

---

## 6. Sizing the player

The single hardest bit of CSS in the feature, and worth getting right — a player that forces a scroll on a phone feels broken in a way that's hard to name.

```css
.jb-player iframe {
  display: block; width: 100%;
  border: 1px solid var(--line); border-radius: 16px;
  background: var(--card);
  box-shadow: 0 6px 24px rgba(0,0,0,0.35);
  height: clamp(300px, calc(100dvh - 343px), 640px);
}
```

Read the height right to left. **Everything that isn't the player adds up to about 343px** — top bar, page title, subtitle, the disclosure toggle, the Open button, the tab bar, and the margins between them. Subtract that from the viewport and the player takes exactly the rest. A tall phone shows more songs; a short phone still doesn't scroll.

**`dvh`, not `vh`.** Dynamic viewport height tracks the mobile browser's collapsing URL bar. With `vh` the player is sized for the *largest* possible viewport, so the bottom of it sits under the chrome until you scroll.

**`clamp()` for the floor and ceiling.** Below 300px the player's own internal layout collapses; above 640px on a tablet it sprawls into a wall of album art.

**Keep `height={380}` on the iframe attribute** as well as the CSS. It's the fallback if the stylesheet hasn't applied yet, and it's the size the provider uses to pick its compact-vs-full layout on first paint.

**Measure your own 343.** Build the page, put the player at a fixed height, measure what's left, put the number in with a comment explaining what's in it. Re-measure when you add a row of chrome — it's the one magic number here and it will silently drift.

---

## 7. Everything else, as numbers

```css
.jukebox .page-sub { margin-bottom: 8px; }     /* tighter than other pages */
.jb-player  { margin: 8px 0; }
.jb-open    { display: block; width: 100%; text-align: center;
              margin: 12px 0 0; text-decoration: none; }
.jb-form    { margin-top: 12px; }
.jb-empty   { text-align: center; margin-bottom: 16px; }
.jb-empty-art   { width: 120px; height: auto; opacity: 0.9; margin-bottom: 6px; }
.jb-empty-title { font-size: 18px; font-weight: 900; color: var(--gold-2); }
.jb-empty-sub   { color: var(--muted); font-size: 13px; line-height: 1.5;
                  margin: 6px auto 0; max-width: 40ch; }
.jb-form-actions { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
.jb-hint    { color: var(--muted); font-size: 11px; margin: 10px 0 0; }
.jb-how-caret { font-size: 9px; margin-left: 2px; color: var(--muted); }
```

Three things in there worth noticing.

The Jukebox page runs a **tighter vertical rhythm than the rest of the app** (`.page-sub` at 8px rather than the default). It's the one page where everything has to fit above the tab bar without scrolling, so it gets its own spacing rather than inheriting.

**`max-width: 40ch` on the empty-state paragraph.** Centred text over about 45 characters per line gets hard to track back to the start of the next line. `ch` units tie the measure to the font rather than to a guessed pixel width.

**The Open button is full-width and centred.** After watching a 30-second preview cut off, this is the thing the user wants; a normal inline button would make them look for it.

---

## 8. Build order

1. Add one string field to your shared state, defaulting to `''`.
2. Write `toEmbed()` and unit-test it against a real Spotify link, a real Apple link, an album link, a bare word, and an empty string.
3. Add the `PUT` endpoint with the anchored `https://` validation and the length cap.
4. Render State A: illustration, headline, instructions, input, save. Confirm saving round-trips.
5. Render State B: iframe with the `allow` list, then the full-width Open button.
6. Add the disclosure panel with `useState(!embed)` and check that it starts open before setup and closed after.
7. Size the player: fixed height first, measure the surrounding chrome, then swap in the `clamp()`.
8. Test on a real phone in both orientations, and with the URL bar both expanded and collapsed.

---

## 9. Checklist

- [ ] One shared URL string. No per-user state, no OAuth, no API key.
- [ ] `toEmbed()` parses with `new URL()` in a try/catch and matches on `hostname`.
- [ ] Spotify: strip the query string. Apple: keep it.
- [ ] `toEmbed()` returns `null` for anything unknown; that `null` is the entire error path.
- [ ] Server validates independently, anchored with `^https://`, with a length cap.
- [ ] An empty string is valid and resets the feature to setup mode.
- [ ] The iframe carries `allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"`.
- [ ] The setup form disappears once a playlist is set. No "change playlist" button.
- [ ] The empty state carries the setup instructions, including *make it collaborative*.
- [ ] The disclosure's initial state is `useState(!embed)` — derived, not stored, not `localStorage`.
- [ ] The toggle is a `<button>` with `aria-expanded`, and the caret flips with the state.
- [ ] The panel unmounts when closed rather than hiding with CSS.
- [ ] Three bullets, and one of them names the 30-second-preview limitation.
- [ ] The info badge is drawn in CSS, not an emoji.
- [ ] Player height uses `clamp()` and `dvh`, with the chrome offset measured and commented.
- [ ] Keep the iframe `height` attribute as the no-CSS fallback.
- [ ] Full-width Open button directly under the player.
