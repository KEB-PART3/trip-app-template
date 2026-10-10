# the trip app — Whole-App Handoff

A private, phone-first web app for a ten-man fantasy football draft weekend. Built for one trip, used for one trip, then archived.

This is written as **a menu, not a manual**. Read the feature list, find the three or four things worth stealing, and ignore the rest. Nothing here needs to be adopted wholesale — most of the ideas are independent, and several of the best ones are twenty lines of code.

At the end there's a ranked "steal this first" list if you'd rather skip to it.

---

## 1. What it was

Ten friends, a rented house in the city, four days, a fantasy draft in the middle of it. The app was the answer to every question someone would otherwise text the group chat: *what are we doing, when, where, how do I get there, what's the wifi, what's the door code, who's landing when, what's the playlist.*

It lived at a private URL behind a shared passphrase, installed to everyone's home screen like a real app, and ran on a Mac mini in a closet.

**It is not a fantasy football app.** There's no roster, no scoring, no player database, no league sync. It's a *trip* app that happens to have a draft in it. If your friend is building something for a league season rather than a weekend, roughly half of this transfers and the other half doesn't.

---

## 2. The stack, and why it's this small

```json
"dependencies":    { "express": "^4.21", "react": "^18.3", "react-dom": "^18.3" },
"devDependencies": { "vite": "^5.4", "@vitejs/plugin-react": "^4.3",
                     "vite-plugin-pwa": "^0.21", "sharp": "^0.33" }
```

**Three runtime dependencies.** No router, no state library, no component library, no CSS framework, no ORM, no database, no auth provider, no analytics. About 3,500 lines of JS/JSX across 29 files, of which 439 are the entire server, plus one 1,455-line stylesheet.

| Piece | Choice | Why |
|---|---|---|
| Front end | React 18 + Vite | Fast builds, and everyone knows it |
| Routing | **None** — `useState` in `App.jsx` | Six tabs. A router is more code than the thing it routes |
| Styling | **One 1,455-line `styles.css`** | No build step, no class-name indirection, greppable |
| State | `useState` + one fetch | Ten users. There is no state problem to solve |
| Backend | One Express file | Serves `dist/` and a JSON API. That's it |
| Database | **`data/state.json`** | See below |
| Auth | HMAC cookie from a shared passphrase | See §6 |
| Install | `vite-plugin-pwa` | Home-screen icon, offline images |
| Hosting | Mac mini + Tailscale Funnel | See §9 |

### The database is a JSON file

```js
const STATE_FILE = resolve(DATA_DIR, 'state.json')
function readState()  { return JSON.parse(readFileSync(STATE_FILE, 'utf8')) }
function writeState(s) { writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)) }
```

The entire persistence layer. Six top-level keys:

```json
{
  "flights": { "the organiser": { … } },
  "draftOrder": ["Morgan", "Jordan", …],
  "draftRevealedAt": 1755210600000,
  "playlistUrl": "https://open.spotify.com/playlist/…",
  "predictions": [ … ],
  "superlativesSeededAt": 1755470400000
}
```

**For ten people on one server this is not a compromise, it's the correct answer.** Read-modify-write on every request is fine at this volume; the file is human-readable so fixing bad data is a text edit; and backup is `cp`. It would be wrong for a hundred concurrent users — it was right for ten.

The honest limitation: no locking, so two writes landing in the same millisecond could lose one. At this scale that never happened. If your friend expects more traffic, swap in SQLite and change two functions — every call site goes through `readState`/`writeState`.

---

## 3. The shell

Six tabs, one sub-page, all in `App.jsx`. No router:

```js
const TABS = [
  { key: 'home',      label: 'Home',      emoji: '🐓' },
  { key: 'itinerary', label: 'Itinerary', emoji: '📅' },
  { key: 'flights',   label: 'Flights',   emoji: '✈️' },
  { key: 'jukebox',   label: 'Jukebox',   emoji: '🎸' },
  { key: 'props',     label: 'Props',     emoji: '🔮' },
  { key: 'lore',      label: 'Lore',      img: '/photos/tab-trophy.png' }
]
```

Tab state is a string in `useState`. The cost of no router is no deep links and no back button — for an installed home-screen app with six tabs, neither was missed.

### The bottom tab bar

Worth doing properly, because it's on screen 100% of the time and it's the thing that makes a web app stop feeling like a website.

#### The markup

```jsx
<div className="app">
  <header className="topbar"> … </header>
  <main className="page">{page}</main>
  <nav className="tabbar">
    {TABS.map(t => (
      <button
        key={t.key}
        className={'tab' + (tab === t.key && !subPage ? ' active' : '')}
        onClick={() => navigate(t.key)}
      >
        {t.img
          ? <img className="tab-img" src={t.img} alt={t.imgAlt} />
          : <span className="tab-emoji">{t.emoji}</span>}
        <span className="tab-label">{t.label}</span>
      </button>
    ))}
  </nav>
</div>
```

A `<nav>` of real `<button>`s, driven off the `TABS` array. Adding a tab is one object in that array plus one line in the page switch. **`&& !subPage`** in the active check matters: when you're on the House sub-page, *no* tab is lit, because you aren't on any of them. Leaving Home highlighted there is a small lie that makes the bar feel unreliable.

#### The CSS, line by line

```css
.tabbar {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 30;
  display: grid; grid-template-columns: repeat(6, 1fr);
  background: var(--shell);
  border-top: 1px solid var(--line);
  padding: 6px 6px calc(6px + env(safe-area-inset-bottom));
}
```

**`position: fixed`, not sticky.** Sticky depends on the scroll container behaving, and in a document that swaps pages under you it will eventually let go. Fixed is unconditional.

**A grid of equal fractions**, not flex. `repeat(6, 1fr)` gives every tab identical width regardless of label length, so "Home" and "Itinerary" occupy the same target. With flex you'd be fighting `flex-basis` and content width forever.

**`env(safe-area-inset-bottom)` added to the bottom padding.** This is the one people miss. On any iPhone with a home indicator, without it the bottom row of your bar sits under the indicator and the labels get clipped. Adding it inside `calc()` keeps your 6px of real padding *and* clears the inset — and it evaluates to zero on devices that don't have one, so there's no separate case to handle.

**Opaque, not translucent:**

> See-through bottom bars only work with heavy frosted blur (iOS style); a plain alpha gradient just lets page text ghost through the bar, which reads as a glitch. Material-style solid it is.

Either commit to a real `backdrop-filter` blur or go solid. The half-measure — a bit of alpha, no blur — looks broken on exactly the content-heavy screens where it matters.

```css
.tab {
  background: transparent; border: none; color: var(--muted);
  padding: 8px 4px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 2px;
  cursor: pointer; min-height: 48px;
}
.tab-emoji { font-size: 22px; line-height: 1; }
.tab-label { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
.tab.active { color: var(--gold); }
.tab.active .tab-emoji { filter: drop-shadow(0 0 8px rgba(245,197,24,0.6)); }
```

**`min-height: 48px`, content-sized and centred.** An earlier version used `min-height: 62px`, which left the content hugging the top with all the slack below it — 15px above the icons and 24px under the labels. Switching to `justify-content: center` with a smaller floor made the padding symmetric and **handed the reclaimed height back to the page**, which on a phone is real estate you can't spare. 48px is also the accessibility floor for a touch target, so it's the right number to stop at.

**Icon 22px, label 11px, 2px apart.** The label is not optional — icon-only bars force people to learn six glyphs, and half of them will guess wrong on the first day.

**The active state is colour plus a glow**, not a background pill or an underline. `color: var(--gold)` on the whole button (so icon and label light together) and a `drop-shadow` on the glyph. A filled pill behind the active tab eats the little vertical space the bar has; a glow costs nothing.

#### Reserving space for it

```css
.app { min-height: 100dvh; display: flex; flex-direction: column;
       padding-bottom: 74px; }  /* room for the tabbar */
```

A fixed bar is out of flow, so the last card on every page would otherwise sit underneath it. One `padding-bottom` on the app shell — measured against the real bar height plus a little slack — fixes it globally. **Re-measure this whenever the bar changes**; it silently drifts, and the symptom is a button you can't quite tap at the bottom of one page.

`100dvh` rather than `100vh`, so the shell tracks the mobile URL bar collapsing.

#### The top bar

```css
.topbar {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px 12px;
  background: linear-gradient(180deg, var(--top), var(--top-2));
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(6px);
}
```

Sticky rather than fixed, because it *should* participate in the flow — and it carries a real `backdrop-filter`, which is exactly the commitment the bottom bar declined to make. Brand on the left, the theme toggle on the right (Home only). `z-index: 20` against the tab bar's `30`, so if they ever overlap the bottom bar wins.

The page itself is `max-width: 720px` centred, so on a desktop browser it reads as a phone-shaped column rather than a stretched-out mess.

#### Number of tabs

Six was the ceiling. At 390px wide, six tabs give each one 65px — enough for a 22px glyph and an 11px label without truncation. **Seven starts clipping words, and past five most people stop scanning and start hunting.** If you need more destinations, put the extras behind one of the six rather than widening the bar — which is exactly what the House sub-page does.

### Scroll restoration — worth stealing

Without a router, `window.scrollY` survives a page swap. Opening the House page from a scrolled-down Home dropped you into the middle of it. The policy that fixed it:

> **Going somewhere new starts at the top. Coming back returns you to where you were standing.**

```js
useLayoutEffect(() => {
  const target = restoreTo.current
  restoreTo.current = null
  if (target == null) { window.scrollTo(0, 0); return }

  window.scrollTo(0, target)
  // The page may still be growing underneath us — the weather card renders
  // taller once the forecast resolves, so a restore issued before that
  // clamps against a short document and lands ~60px high. Re-apply until it sticks.
  let tries = 0
  let raf = requestAnimationFrame(function settle() {
    if (Math.abs(window.scrollY - target) <= 2 || tries++ > 20) return
    window.scrollTo(0, target)
    raf = requestAnimationFrame(settle)
  })
  // If they start scrolling themselves, stop immediately — never fight a thumb.
  const stop = () => { cancelAnimationFrame(raf); tries = 99 }
  window.addEventListener('wheel', stop, { passive: true, once: true })
  window.addEventListener('touchstart', stop, { passive: true, once: true })
  return () => { /* cleanup */ }
}, [tab, subPage, navSeq])
```

Three things make it work. `useLayoutEffect` rather than `useEffect`, so it lands before paint and before any page's own scroll effect. The `requestAnimationFrame` settle loop, because async content growing below you makes a single `scrollTo` land short. And the bail-out on the first wheel or touch — **never fight a thumb.**

`navSeq` is a nonce bumped on every navigation, so tapping the *same* day twice still re-scrolls. Without it the target prop wouldn't change and the effect wouldn't re-fire.

### Dark / light mode

The whole thing is one attribute on `<html>` and two blocks of CSS variables. No theme context, no provider, no per-component branching.

```js
const [theme, setThemeState] = useState(() => {
  const saved = localStorage.getItem('ff-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
})

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme)
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'light' ? '#f6f1e2' : '#0a0a0a')
}, [theme])

const setTheme = t => { localStorage.setItem('ff-theme', t); setThemeState(t) }
```

**The precedence is: saved choice → device preference → dark.** The device setting is only ever a *first-run default*. Once someone taps the toggle, their choice wins permanently and the OS setting stops mattering — because a user who deliberately picked light mode does not want it flipping back when their phone hits sunset. This is the part most implementations get wrong by binding live to `prefers-color-scheme` forever.

**Update the `theme-color` meta tag too.** Without it, the iOS status bar and the Android address bar stay the other theme's colour, and you get a black bar over a cream app. Two lines, and it's the difference between a theme that looks finished and one that doesn't.

**Set `color-scheme` on each theme block** (`color-scheme: dark` / `light`). That's what makes form controls, scrollbars and the native focus ring match — otherwise you get a white scrollbar on a black page.

```css
:root {
  --gold:#f5c518; --gold-2:#ffd84a; --gold-3:#b8860b;
  --bg:#0a0a0a; --bg-2:#14110a; --card:#1d1a12; --card-2:#272214; --line:#4d4227;
  --text:#f2f0e6; --text-2:#d8d3c2; --muted:#928a72;
  --red:#ff4d4d; --green:#6dd57a; --err-text:#ff8080;
  --btn-hi:#ffd84a; --btn-lo:#b8860b;   /* CONSTANT across themes */
  --shell:#060606; --top:rgba(10,10,10,0.98);
  color-scheme: dark;
}
html[data-theme='light'] {
  --bg:#f6f1e2; --bg-2:#ede5cf; --card:#fffdf4; --card-2:#f5eeda; --line:#dcd2b6;
  --text:#251e0d; --text-2:#4a4331; --muted:#6b6149;
  --gold:#7f5e05; --gold-2:#7c5c07; --gold-3:#5f4605;
  --red:#c22f22; --green:#1a6e34; --err-text:#b3261e;
  --shell:#efe8d4; --top:rgba(246,241,226,0.98);
  color-scheme: light;
}
```

#### Light mode is re-inked, not inverted

This is the rule the whole treatment rests on. The two palettes share variable *names* and almost no *values*. Dark mode's brand gold is a bright `#f5c518`; on cream that same yellow has roughly 1.9:1 contrast and is unreadable, so light mode substitutes a deep antique gold `#7f5e05` that still reads as gold rather than brown. Same semantic role, completely different hex.

Every light value was picked against the surfaces it actually lands on, not by flipping lightness. From the comment in the source:

> `#8f6a06` was a shade too light against the warmer surfaces: gold text on the tab bar landed at 4.06 and the Lore year column at 4.28, both under the 4.5 AA line for small text. Nothing looked broken indoors, but these are the first things to wash out **on a phone in August sun, which is the entire context this app gets used in.**

That's the test worth copying: not "does it pass in the browser," but "does it survive the place it'll be used."

#### The exceptions

Two things deliberately do **not** change with the theme.

**Button fills.** `--btn-hi` / `--btn-lo` stay bright gold in both modes, because they're a *surface* with dark text on top, not ink. Darkening them for light mode would have made the primary button muddy in the one place it needs to be loud.

**Anywhere gold becomes a background.** The `NOW` chip is the one place `--gold` is a fill rather than text — so darkening the token worked against it, dropping near-black-on-gold to 3.1:1. The fix was flipping the *label* to white in light mode only:

```css
html[data-theme='light'] .chip-live { color: #fff; }
```

Dark mode keeps the near-black, where gold is bright and the pairing is correct. **When you re-ink a token, audit every place it's used as a background separately** — those invert rather than follow.

#### The toggle

A 30px borderless emoji button in the header, shown only on Home. `🌙` when you're in light mode, `☀️` when you're in dark — **the icon shows what you'd get, not what you have**, which is the convention people expect.

```css
.theme-btn {
  background: transparent; border: none; border-radius: 999px;
  width: 30px; height: 30px; font-size: 14px; line-height: 1;
  cursor: pointer; padding: 0; opacity: 0.6;
}
.theme-btn:hover  { background: rgba(245,197,24,0.08); }
.theme-btn:active { transform: scale(0.94); }
```

`opacity: 0.6` at rest, because it's a preference, not a feature — present for anyone looking for it, invisible to everyone else. It carries an `aria-label` that says which direction it goes.

There's a separate colour and type document with the full palette, contrast table and component styles if he wants to lift the look wholesale.

---

## 4. The features, one by one

### Home — the "what now" screen

A countdown to kickoff, a swipeable photo rail of today's events, the weather card, and the house card. The rail **auto-scrolls to whatever is live right now**:

```js
const el = railRef.current.querySelector('[data-live="1"]')
if (el) railRef.current.scrollTo({ left: Math.max(0, el.offsetLeft - 24), behavior: 'smooth' })
```

Before the trip the card is titled *"🔮 Sneak peek"*; during it, *"Today"*; after the last event, *"That's a wrap"*. Same component, three headers, driven by the clock.

### Itinerary — the day view

The most reusable page in the app: time in a fixed left gutter, optional art, then title / subtitle / detail. Three card shapes (standard row, split row for two activities sharing a slot, full-bleed marquee for the big moments), chosen by the data. Exactly one event is marked **NOW** and one **NEXT**, recomputed every second.

*Covered in full in the separate day-view handoff — that one has all the numbers.*

### Flights — the arrivals board

Read-only. Flight data is hand-maintained in a constants file from the group's spreadsheet; nobody edits it in the app. One chronological list with an arrivals/departures toggle.

> On a phone that beats a wide two-sided table, and **the sorted order IS the pickup / Uber-share plan.**

That's the insight worth taking: the sort order was the feature. Nobody needed a "who can share a ride" screen once the list was chronological.

The grid lives on the `<ol>`, not on each `<li>`, with rows as `display: contents` — so every row shares one time column and the clocks line up like a real table.

### Jukebox — one shared playlist

A text field holding one URL. Paste a Spotify or Apple Music share link, the app renders the provider's embed. No API key, no OAuth, no Web API. Plus a disclosure panel that starts open during setup and closed afterwards.

*Covered in full in the separate Jukebox handoff.*

### Props — party prop bets

The only genuinely social feature in the app, and the most-used one. Anyone writes a prop, everyone votes, votes stay changeable, **nothing is ever scored or resolved.**

> The picks ARE the product; the arguing happens in person.

**Not scoring it was the design decision**, and it's the one to think hardest about before copying. Scoring means resolution; resolution means adjudication; adjudication means someone has to be the referee on the weekend they most wanted off. Having the prop on the record — with names attached — turned out to be the entire point. Nobody once asked who won.

#### How a prop is recorded

One object appended to an array in the state file. That's the whole schema.

```json
{
  "id": "pm2k8fq3x7be",
  "question": "Does Jordan nap before 9 PM on Friday?",
  "type": "yesno",
  "createdBy": "the organiser",
  "createdAt": 1755210600000,
  "votes": { "Morgan": "yes", "Jamie": "no", "Jordan": "no" }
}
```

**Votes are an object keyed by nickname, not an array of vote records.** This is the choice that makes everything else simple. One key per person means changing a vote is `p.votes[nick] = answer` — an overwrite, so there's no dedupe, no "find my existing vote and update it," and no way to accidentally vote twice. The uniqueness constraint is the data structure rather than logic you have to remember to write.

It also makes every read trivial. Who voted yes is one `filter` over `Object.entries`. Whether *you've* voted is `p.votes[nick] !== undefined`. The count is `entries.length`.

The ID is `'p' + Date.now().toString(36) + Math.random().toString(36).slice(2,6)` — sortable-ish, short, and collision-proof enough for ten people.

#### Adding one

```jsx
<button className="btn btn-primary props-add" onClick={() => setAdding(true)}>
  ➕ Add a prop
</button>
```

Tapping it reveals an inline card — not a modal, not a separate page. A text field capped at 140 characters, two type buttons, Post and Cancel.

```jsx
<input id="prop-q" className="lf-input" maxLength={140}
       placeholder="e.g. Does Jordan nap before 9 PM on Friday?"
       value={q} onChange={e => setQ(e.target.value)} />

<div className="props-type">
  <button className={'btn props-type-btn' + (type==='yesno' ? ' selected' : '')}
          onClick={() => setType('yesno')}>Yes / No</button>
  <button className={'btn props-type-btn' + (type==='number' ? ' selected' : '')}
          onClick={() => setType('number')}>Number</button>
</div>

<button className="btn btn-primary" disabled={busy || q.trim().length < 8}
        onClick={submit}>{busy ? 'Posting…' : 'Post it'}</button>
```

Four details worth copying.

**The placeholder is a real example, not a description.** `"e.g. Does Jordan nap before 9 PM on Friday?"` teaches the format, the tone and the length in one line. "Enter your prediction" teaches nothing. This is the single highest-leverage piece of copy in the feature — it's what stops the first three props being bad ones.

**The submit button is disabled until the question is at least 8 characters**, mirroring the server's own minimum, so the failure is prevented rather than reported.

**Two types only.** Yes/No and Number. The server *also* supports `person` and `text` types used by the Morning After superlatives, but those are deliberately not offered in the add form — more choices at the point of writing would have slowed everyone down for two types nobody asked for.

**It goes live instantly.** No moderation, no approval, no draft state. The hint under the form says so plainly: *"Goes live instantly. 3 per day each — make them count. the organiser can delete slop."*

#### The rate limit, and why it's a feature

```js
const PROPS_PER_DAY = 3
const ctDay = ts => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year:'numeric', month:'2-digit', day:'2-digit'
}).format(ts)

if (nick !== ORGANIZER) {
  const today = ctDay(Date.now())
  const mine = s.predictions.filter(
    p => p.createdBy === nick && ctDay(p.createdAt) === today
  )
  if (mine.length >= PROPS_PER_DAY) {
    return res.status(429).json({
      error: `Easy, champ — ${PROPS_PER_DAY} props a day. Try again tomorrow.`
    })
  }
}
```

Three per person per day, **counted in the trip's timezone, not UTC or the phone's** — `en-CA` formats as `YYYY-MM-DD`, which makes the day key a string comparison. Everyone's day rolls over at the same moment, wherever they're standing.

**The cap is scarcity, not abuse prevention.** Ten friends were never going to spam it. Limiting everyone to three forces them to be good, and the page leads with the rule rather than burying it:

> **Three props a day** — choose wisely. Lock your picks, argue in person.

> A rule you knew going in feels like a game.

The the organiser is exempt, because someone has to be able to seed the board. The error message is in the app's voice — *"Easy, champ"* — which costs nothing and keeps a rejection from feeling like an error.

#### Voting

One endpoint, one write, validated per type:

```js
app.post('/api/predictions/:id/vote', (req, res) => {
  if (!MEMBERS.includes(nick)) return res.status(400).json({ error:'pick your name first' })
  const p = s.predictions.find(x => x.id === req.params.id)
  if (!p) return res.status(404).json({ error:'prop not found' })

  if (p.type === 'yesno') {
    if (!['yes','no'].includes(b.answer)) return res.status(400).json({ error:'yes or no' })
    p.votes[nick] = b.answer
  } else if (p.type === 'person') {
    if (!MEMBERS.includes(String(b.answer))) return res.status(400).json({ error:'pick a member' })
    p.votes[nick] = b.answer
  } else if (p.type === 'text') {
    const v = String(b.answer||'').trim().replace(/\s+/g,' ').slice(0, 60)
    if (v.length < 1) return res.status(400).json({ error:'give an answer' })
    p.votes[nick] = v
  } else {
    const n = Number(b.answer)
    if (!Number.isFinite(n) || Math.abs(n) > 1e6) return res.status(400).json({ error:'give a number' })
    p.votes[nick] = Math.round(n * 100) / 100
  }
  writeState(s); res.json(s)
})
```

**Every answer is validated against a closed set where one exists** — yes/no against a literal pair, a person against the member list — so nothing arbitrary reaches the state file. Free text is trimmed, whitespace-collapsed and capped at 60. Numbers are range-checked and rounded to two decimals, because `Number.isFinite` alone still lets `1e308` through.

**Votes are changeable forever.** There's no lock, no deadline, no "are you sure." Re-voting is the same overwrite as voting.

**Every response returns the whole state object**, so the client refreshes from one round trip instead of patching locally and hoping.

#### Showing the votes

The part that made people care: **every vote is public and attributed.**

Yes/No renders two big buttons with live counts, your own pick highlighted, and underneath, the actual names:

```jsx
<div className="prop-voters">
  {['yes','no'].map(a => {
    const voters = entries.filter(([, v]) => v === a).map(([n]) => n)
    return voters.length ? (
      <div key={a} className="prop-voters-row">
        <b>{a === 'yes' ? 'Yes' : 'No'}:</b> {voters.join(', ')}
      </div>
    ) : null
  })}
</div>
```

Number props render everyone's guess sorted high to low, with yours marked:

```jsx
{entries.sort((a,b) => b[1]-a[1]).map(([n, v]) => (
  <span className={'prop-guess' + (n === nick ? ' prop-guess-mine' : '')}>
    {n} <b>{v}</b>
  </span>
))}
```

**Anonymous voting would have killed it.** The names are the content — the whole feature is a machine for generating "wait, *you* said no?"

Every prop also wears its author (`by {createdBy}`), including your own. That was checked deliberately: the author posted a test prop and expected to see his own name on it. The one exception is the Morning After's awards, which hide bylines via a `showBy` prop — *awards belong to the league.*

#### Filtering

Three views behind one native `<select>`, with live counts in the option labels:

```jsx
<option value="all">All props ({props.length})</option>
<option value="todo">To vote ({todo.length})</option>
<option value="mine">My props ({mine.length})</option>
```

`todo` is `props.filter(p => p.votes[nick] === undefined)` — so **a card leaves the list the instant you vote on it**, which turns catching up into a satisfying countdown to zero. It has its own empty state: *"🐓 All caught up — every prop has your pick."*

> Three views made a dropdown the right control — three pills plus Add wouldn't breathe on a phone. Native select so each platform brings its own picker UI.

Props are listed newest first (`[...predictions].reverse()`).

#### Deleting

The the organiser **or the author** can delete, enforced on both ends:

```js
if (nick !== ORGANIZER && nick !== p.createdBy) {
  return res.status(403).json({ error: 'only the the organiser or the author can delete' })
}
```

The UI is a small `✕` that swaps into an inline `delete / keep` pair rather than firing a browser `confirm()`. Two taps, no modal, no dialog that blocks the page.

Letting authors delete their own is what makes instant publishing safe — someone who posts a dud can take it back without finding an admin.

#### Polling

The whole app re-fetches state every five seconds while unlocked:

```js
useEffect(() => {
  if (unlocked !== true) return
  const iv = setInterval(refresh, 5000)
  return () => clearInterval(iv)
}, [unlocked, refresh])
```

No websockets, no subscriptions, no optimistic updates. A room full of phones on a 5-second poll against a JSON file is nothing, and in practice it felt live — someone votes, and it shows up on the other side of the room before anyone notices a delay. **Reach for websockets when polling actually fails**, not before.

### Past trips — the group's own history

The group's history on one page. Entirely static — no API, no state, no server round-trip. Every byte ships in the bundle.

It's the page nobody asks for and everybody reads. **The lesson is that a group's history is content, and most apps throw it away.** If the thing you're building has a past — previous years, previous hosts, who has been to what — putting it on a page costs an afternoon and buys more affection than most features.

#### The data

Two arrays. That's it.

```js
export const MEMBERS = [
  { nick: 'Alex',   name: 'Alex',   trips: 9, firstTrip: 2018, organizer: true },
  { nick: 'Sam',    name: 'Sam',    trips: 9, firstTrip: 2018 },
  …
]

export const PAST_TRIPS = [
  { year: 2018, place: 'The first one',  host: 'Alex',   note: 'Nobody knew it would become a thing.' },
  { year: 2020, place: 'Postponed',      host: '—',      note: 'For obvious reasons.' },
  …
  { year: 2026, place: 'The island',     host: 'Alex',   note: 'The ferry story.' }
]
```

`MEMBERS` is the same array the rest of the app uses for identity, so the history page adds no new roster — it just reads two extra fields off it. `PAST_TRIPS` is a flat list transcribed by hand once.

**Record each year as it was, not as it is now.** A place that has since been renamed, a year that got cancelled, the one nobody wants to talk about — leave them in. The gaps and the oddities are what make it read like a record rather than a database view.

#### Everything is derived at module scope

```js
// Ranked by trips attended, then by who started earliest.
const wall = [...MEMBERS].sort((a, b) => {
  if (b.trips !== a.trips) return b.trips - a.trips
  return a.firstTrip - b.firstTrip
})
```

Computed **outside the component**, at module load, because the inputs never change. No `useMemo`, no state, no effect. Several views of the same roster — ranked by attendance, ordered by first year, cross-referenced against the timeline — and each is four lines.

#### Four sections, escalating

**1. Last year**, as a banner: the place, the year, who hosted. Not a card — a wider full-bleed block, because there's one of these and it shouldn't look like a list item. Note that this block stays dark in *both* themes, so any gradient inside it must use constant colour values rather than theme tokens; a token that goes near-black in light mode will quietly kill the contrast.

**2. The regulars** — a ranked `<ol>` of rank | name-over-detail | count. The top row gets a highlight.

One copy note worth repeating: **state the unit once in the card header, not on every row.** The header reads `The regulars · trips` and each row shows a bare number. It's a small thing that quiets a list dramatically.

**3. Every year** — a grid of year cells, the most recent highlighted.

**4. The record and the notes** — a plain table, then a list of one-line memories per year. Deliberately the plainest things on the page: by this point you've had a banner and a ranked wall, and the reference material should just be legible.

### Morning After — the final-day takeover

On the last morning the Home tab stops being Home. It's replaced entirely by a different page — and the pre-trip Home never comes back.

> Assembles itself from data the app already has: flights → getaway board, props → weekend by the numbers, the Sunday superlative pack → live awards voting. **Zero the organiser work on the one morning he's least capable of it.**

The most-liked feature in the app, and it added almost no new data. **It's a re-arrangement of what was already there, on a date trigger.** If your friend builds one thing from this document, consider this one.

#### The switch

```js
// Home.jsx
if (ymdCT(now) >= TRIP_END_ISO.slice(0, 10)) {
  return <MorningAfter now={now} state={state} nick={nick} onRefresh={onRefresh} />
}
```

One comparison at the top of Home. No flag, no admin toggle, nothing to remember to flip — which matters, because the person who'd have to flip it is hungover in a rental house.

`ymdCT` formats the current time as `YYYY-MM-DD` **in the trip's timezone**, so it's a string comparison and it rolls over at local midnight for everyone at once.

> The pre-trip Home never returns; **a countdown to a trip that already happened is worse than a memory of it.**

That's the rule. `>=`, not `===`. Most people would write an equality check for "the last day" and quietly ship a page that reverts to a countdown-to-zero on Monday.

#### Two modes inside the takeover

```js
const postTrip = now.getTime() > new Date(TRIP_END_ISO).getTime()
```

**Sunday is live mode**: the getaway board runs, superlative voting is open, the closer counts down to wheels-up.

**Monday onward is the yearbook**: the board retires, the results lock, the numbers are preserved, and the header changes from *"The Morning After"* to *"That Was The Weekend"*. The subtitle goes from *"one more airport run"* to *"the city, Jun 10–13 · in the books."*

Same component, same data, one boolean. **The app degrades into a souvenir instead of going stale.** That transition is free and almost nobody builds it.

#### The getaway board

Departure flights, grouped, sorted, counting down.

```js
const groups = new Map()
for (const m of MEMBERS) {
  const f = FLIGHTS[m.nick]
  if (!f)                { unknown.push(m.nick); continue }
  if (f.roadtrip)        { roadtrip.push(m.nick); continue }
  if (!f.departureTime)  { unknown.push(m.nick); continue }
  const key = `${f.departureAirline} ${f.departureFlight}`
  if (!groups.has(key)) groups.set(key, { key, time: f.departureTime, …, who: [] })
  groups.get(key).who.push(m.nick)
}
```

**Grouped by identical flight**, so four guys on the same plane are one row reading `Morgan · Jamie · Jordan · Taylor` rather than four rows you have to notice are the same. That grouping *is* the ride-share plan — the same trick the Flights page uses, where the sort order was the feature.

**Everyone appears on the board**, including people with no flight on file (`❓ No flight on file`) and the drivers (a hand-drawn car icon, `Roadtrip · driving home`). A board that silently omits people is one someone has to ask about.

Each row counts down and then retires itself:

```js
const fmtLeft = at => {
  const ms = at - now
  if (ms <= 0) return { text: 'wheels up ✈️', urgent: false, gone: true }
  const h = Math.floor(ms / 3600000)
  const mm = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0')
  return { text: `leaves in ${h}:${mm}`, urgent: ms < 2.5 * 3600000, gone: false }
}
```

Three states: normal, **urgent under 2.5 hours** (about when you should be leaving for the airport), and gone — which dims the whole row via `.getaway-gone`. The board empties itself over the course of the morning, which is exactly what the morning feels like.

The nicest bit of reasoning in the file is about the drivers:

> The drivers have no departure time on file, so the board had no way to retire them and they sat at full brightness while everyone else greyed out. Proxy: **they're gone once the FIRST plane is.** It's a long haul home and nobody driving it leaves after the 8:05 crowd — no invented clock times, and the row dims on its own the same way the flights do.

That's the move worth copying: when a row has no real timestamp, **find a proxy already in the data rather than inventing a fake one.**

The countdown rides the meta line under the names rather than taking a third column, so every row is exactly two lines and the names keep the width.

The board ends with two links: `🚗 Uber to AVL` (pre-filled destination and coordinates) and `📍 Back to HQ one last time`.

#### The Sunday superlatives

Six awards that appear by themselves on the final morning:

```js
function seedSuperlatives() {
  const mk = (question, type) => ({
    id: 'sup-' + Math.random().toString(36).slice(2, 8),
    question, type, superlative: true, createdBy: ORGANIZER, createdAt: Date.now(), votes: {}
  })
  return [
    mk('🏆 MVP of the Fest', 'person'),
    mk('💣 Biggest Liability', 'person'),
    mk('⛳ Best Golf Meltdown', 'person'),
    mk('😴 First Asleep Award', 'person'),
    mk('🎵 Song of the Fest', 'text'),
    mk('🤔 Worst Decision of the Weekend (any category)', 'text')
  ]
}

function itIsSunday() {
  return process.env.FF_SUNDAY === '1' || ctDay(Date.now()) >= SUNDAY_CT
}

// inside readState()
if (itIsSunday() && !s.superlativesSeededAt) {
  s.predictions.push(...seedSuperlatives())
  s.superlativesSeededAt = Date.now()
  writeState(s)
}
```

Four things here are worth taking.

**They're seeded lazily inside `readState`, not by a cron job or a migration.** The first request on Sunday creates them. No scheduler, no deploy, nothing to run.

**`superlativesSeededAt` is the idempotency guard.** A timestamp rather than a boolean, so you can also see *when* it happened. Without it, every read would append six more.

**They reuse the Props machinery entirely.** A superlative is just a prediction with `superlative: true` — same table, same vote endpoint, same `PropCard` component. The two extra vote types (`person`, tap a roster name; `text`, write-in) exist on the server for exactly this, and are deliberately not offered in the normal add-a-prop form. **One system, one flag, two products.**

**`FF_SUNDAY=1` forces the unlock for testing**, because otherwise the only way to check a date-triggered feature is to wait for the date or mangle the clock.

On the day they render as ordinary prop cards with `showBy={false}` — **bylines hidden, because awards belong to the league** — under the heading *"🏅 Sunday Superlatives — vote before wheels up"* and a footnote: *"One vote each · results read aloud at the house · appeals denied."*

#### Tallying the winners

Once it's post-trip, the same six become locked results:

```js
const tally = new Map()
for (const v of Object.values(p.votes)) {
  const k = String(v).trim().toLowerCase()
  if (!k) continue
  const e = tally.get(k) || { label: String(v).trim(), n: 0 }
  e.n++; tally.set(k, e)
}
const top = Math.max(...[...tally.values()].map(e => e.n))
const winners = [...tally.values()].filter(e => e.n === top).map(e => pretty(e.label))
```

**Tally case-insensitively, display the casing that was typed first.** "Chattahoochee" and "chattahoochee" are one song, and lowercasing the *display* would have printed the winner in lowercase — which happened in an earlier version and looked like a bug. Key the map on the normalised string, keep the original as the label.

**Ties share the award.** `filter(e => e.n === top)` returns every top-scorer and they're joined with `·`. No tiebreak, no runoff — in a ten-person vote ties are common and a shared award is funnier anyway.

This is also the only place in the app where votes are ever resolved, and it's automatic. Props themselves are never scored (see above); the awards are counted because counting them *is* the ceremony.

#### The weekend by the numbers

Six stat tiles, mined out of the props data — each one guarded so it simply doesn't render if the data isn't there.

```js
const totalVotes = predictions.reduce((n, p) => n + Object.keys(p.votes).length, 0)
if (totalVotes) stats.push([String(totalVotes), 'prop votes cast this weekend'])
```

The interesting ones:

**The great debate** — the most evenly split yes/no prop with at least four votes:

```js
const contested = regular
  .filter(p => p.type === 'yesno' && Object.keys(p.votes).length >= 4)
  .map(p => {
    const vs  = Object.values(p.votes)
    const yes = vs.filter(v => v === 'yes').length
    return { p, yes, no: vs.length - yes, gap: Math.abs(2*yes - vs.length) }
  })
  .sort((a, b) => a.gap - b.gap || (b.yes + b.no) - (a.yes + a.no))[0]
```

`Math.abs(2*yes - total)` is the distance from a perfect split — zero when it's dead even. Sort ascending, break ties by turnout, and you've found the argument of the weekend.

**The boldest guess** on a number prop (highest value, with the name attached), alongside the average presented as the *"official league beer estimate."*

**Most engaged prophet** and, if anyone cast zero votes, **"the ghost 👻"**. Both are a single tally over `votes` keyed by nick.

Two patterns worth lifting. **Every stat is `push`ed conditionally into an array, then `slice(0, 6)`** — so the section self-assembles from whatever data exists and renders nothing at all if nothing qualifies. And **the captions are jokes, not labels**: *"boldest beer guess (Morgan, obviously)"* rather than "maximum value." The numbers are trivial; the captions are the feature.

#### The golf leaderboard

Worth mentioning as a reuse note:

> Reuses the Wall of Champions row shape (rank | name over sub | number) rather than inventing a second board — **it's the same job, and the app already has one answer for it.**

Ties share a rank and get a `T` prefix, the way a real leaderboard reads. The format qualifier lives in the footnote rather than the title, because *"Scramble · three teams of three"* pushed the header to two lines on a phone.

#### The closer

Both modes end with a card counting down to next year — *"The coop reopens in ~356 days.  forever. 🐓"* The app's last word is an invitation to the next one.

### Draft order reveal

A the organiser-only endpoint that shuffles the members and writes the result, plus a reset. Guarded by an `x-identity` header — honor-system identity, not real auth (see §6).

### Weather

Open-Meteo, proxied and cached server-side, no API key. Two display states depending on whether the trip is inside the 16-day forecast window, and a tap-to-expand hourly strip. Every day gets a plain-language verdict ("Properly hot", "Ark weather") whose category drives the colour.

*Covered in full in the separate weather handoff.*

### Install coach

A one-time walkthrough of Add to Home Screen, shown right after the nick pick. **If you ship a PWA and don't do this, most people will never install it.** Full implementation in §7.

---

## 5. Small things that punched above their weight

These are the twenty-line ideas. Several are worth more than the features they sit in.

**A synthesised chicken cluck.** WebAudio, two bandpass-filtered chirps with a sharp pitch drop — no audio file, no asset, no loading. ~50 lines in `audio.js` and it became the app's signature.

**An SVG car instead of 🚗.** Emoji are font glyphs with per-platform vertical metrics; the car sat high on desktop Chrome and low on Android, and no pixel nudge fixes both. An SVG has no font metrics, so a flex-centred box centres it identically everywhere. The same logic applies to any emoji you're using as an icon in a layout.

**A CSS-drawn info badge instead of ℹ️**, for the same reason — the emoji renders as a platform-blue square that drags someone else's design language into yours.

**Coordinates, not street addresses, for navigation.** The house address geocoded to the wrong side of the building, ~30m from the door. The app stores both: the address for display, the pin for every Directions / Uber / Waymo link. Invisible in testing, very obvious at 1am.

**Tap-to-copy with a moving confirmation.** One `hit` state value rather than a flag per cell, so a second tap *moves* the "Copied ✓" instead of lighting two. It clears on a timer **and** on `visibilitychange` — because iOS freezes timers in backgrounded tabs, so someone who copies the wifi password and switches to Settings would come back to a stale confirmation that never expired.

**Alt text written by opening the file.** In this app `soccer-1.jpg` was a portrait of a player and the `food-*.jpg` files were venue logos. The photo registry carries a comment telling you to trust the descriptions over the filenames.

**`robots.txt` instead of an `X-Robots-Tag: noindex` header.** This one is genuinely non-obvious. Meta's crawler — which builds the WhatsApp link preview — treats `noindex` as "do not touch this page" and silently declines to generate a card. The header and the preview cannot coexist. A `robots.txt` that allows the named preview bots and disallows everything else says the two different things you actually mean.

**The login gate returns 200, not 401.** Link-preview crawlers skip non-2xx responses, so a 401 pastes into a group chat as a bare grey URL. The response body is unchanged — still just the passphrase page, no app bundle, no names, no data — and `/api/` routes still return a real 401.

---

## 6. Auth — a secret knock, done properly

```js
const PASSPHRASE = normalizePass(process.env.PASSPHRASE || '…')
const SECRET = /* 32 random bytes, generated on first run, gitignored */
const AUTH_TOKEN = createHmac('sha256', SECRET).update('v1:' + PASSPHRASE).digest('hex')
```

One shared passphrase for the group. The session cookie is `HMAC(secret, passphrase)` — **stateless**, so it survives server restarts, and deleting the secret file instantly invalidates every device. `HttpOnly`, `SameSite=Lax`, `Secure` only when the request arrived over HTTPS (so plain-http on the home LAN keeps working). 200-day expiry.

Comparison is `timingSafeEqual`, with a length check first. There's a per-IP failed-attempt brake: 20 tries per 10 minutes, in memory.

### Normalise the passphrase

```js
function normalizePass(s) {
  return String(s || '').trim().toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
}
```

Phones autocapitalise, people add punctuation, and at least one guy was certain the word had an exclamation point. `""`, `"."`, `""` and `" !!"` all reduce to the same six letters.

> **None of that should decide whether someone gets in.**

Both the stored word and the typed word go through the same normaliser. Six lines, and it eliminates the entire category of "it says wrong password but I typed it right."

### Identity is separate from auth, and it's the honour system

After the passphrase, each phone picks a nickname from the member list, stored in `localStorage` and sent as an `x-identity` header. That's what gates the the organiser-only endpoints and attributes props.

**This is not security and isn't pretending to be.** Anyone who's through the door could claim to be the the organiser by editing localStorage. For ten friends that's a non-problem, and the alternative — real per-user accounts — would have been more code than the entire rest of the app. Know which one you're building.

---

## 7. Installing the app — the PWA layer

### The manifest and service worker

```js
VitePWA({
  registerType: 'autoUpdate',
  workbox: { runtimeCaching: [
    { urlPattern: ({url}) => url.pathname.startsWith('/photos/'),
      handler: 'CacheFirst',
      options: { cacheName: 'images',
                 expiration: { maxEntries: 60, maxAgeSeconds: 60*60*24*90 } } },
    { urlPattern: ({url}) => url.pathname === '/api/weather',
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'weather',
                 expiration: { maxEntries: 4, maxAgeSeconds: 60*60 } } }
  ]},
  manifest: { display: 'standalone', orientation: 'portrait',
              theme_color: '#f5c518', background_color: '#0a0a0a', icons: [ … ] }
})
```

Two caching strategies, chosen by what the data is. **Photos cache-first** — they never change, and after one view they load instantly from the device with no round-trip. **Weather stale-while-revalidate** — paint the last answer immediately, refresh in the background, so the card is never blank.

One warning learned the hard way: **a cached service worker makes a dead site look alive.** When the server was taken down, installed phones still rendered a blank app shell from cache rather than failing visibly. If you take something offline, expect this and tell people.

### The install coach

A manifest makes an app *installable*. It does not make anyone install it.

> The guys will never find "Add to Home Screen" buried in the share sheet on their own — **walk them through it once, then get out of the way forever.**

The coach is a full-screen page shown once, immediately after the nickname pick, before the app itself. It's the same visual shell as the login screen: the app icon at 84px, a headline, four numbered steps, one dismiss button.

#### Where it sits in the boot sequence

```js
const [coached, setCoached] = useState(
  () => !!localStorage.getItem('ff-a2hs') || isStandalone()
)
const dismissCoach = () => { localStorage.setItem('ff-a2hs','1'); setCoached(true) }

if (unlocked === null) return <div className="login-wrap" />  // checking the cookie
if (!unlocked)         return <Login onUnlock={onUnlock} />
if (!nick)             return <NickPicker onPick={pickNick} />
if (!coached)          return <InstallCoach onDone={dismissCoach} />
// …the app
```

Four early returns in priority order. Each gate is one boolean and the app renders when all of them pass — no wizard framework, no step counter, no routing.

**It's skipped entirely when the app is already installed**, which is the check people forget:

```js
export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}
```

Two checks, because iOS Safari predates the standard: `display-mode: standalone` is the modern media query, and `navigator.standalone` is Apple's legacy flag. Miss the second and every iPhone user who already installed the app gets told to install it again.

#### Platform detection

```js
const UA = navigator.userAgent
const ANDROID = /Android/i.test(UA)

// Real Safari (mobile or desktop) vs an app's built-in browser (WhatsApp,
// Instagram, etc. — where Add to Home Screen doesn't exist) or another iOS browser.
const IN_SAFARI = !ANDROID && /Safari\//.test(UA)
  && !/CriOS|FxiOS|EdgiOS|GSA|FBAN|FBAV|Instagram|Messenger|Snapchat|Line\//i.test(UA)
```

Two decisions, and the second is the one worth stealing.

**Default to iOS unless the device is definitely Android.** Nine of the ten members carried iPhones, and desktop or unknown also gets the iOS steps because that's what they'd be holding on the trip. Pick the default from who your users actually are rather than trying to be exhaustive.

**Detect the in-app browser.** This is the failure nobody anticipates: the link gets shared in WhatsApp, someone taps it, and it opens in WhatsApp's embedded browser — **where Add to Home Screen does not exist at all**. They follow the instructions, find no such option, and conclude the app is broken. Real Safari carries the `Safari/` token *without* a browser-or-app marker; the negative lookahead list catches Chrome-on-iOS, Firefox-on-iOS, Edge, the Google app, Facebook, Instagram, Messenger, Snapchat and Line.

When that fires, an extra step is prepended:

> *Open this page in **Safari** (you're in another app's browser — tap ⋯ or the compass icon, or copy the link into Safari).*

#### The steps

iOS:

1. Tap the **Share** button (with an inline SVG share glyph, not the emoji)
2. Scroll down and tap **"Add to Home Screen."**
3. Tap **Add**. The gold mascot lands on your home screen — that's the app.

Android:

1. Open this page in **Chrome**
2. Tap the **⋮ menu** (top right)
3. Tap **"Add to Home screen"** (or **"Install app"**)
4. Confirm.

Three things about the copy. The share icon is **an inline SVG**, for the same reason the car is — an emoji share glyph renders differently on every platform and this one has to match what's actually on the button they're looking for. The last step names the outcome (*"the gold mascot lands on your home screen — that's the app"*) so they know when they've succeeded. And iOS users get a one-line footnote for Android anyway, because someone always has the odd phone.

The headline is *"MAKE IT AN APP"* and the subtitle *"30 seconds now, one tap all August"* — **name the cost and the payoff**, because you're asking for effort before anyone has seen the thing.

The dismiss button says "Got it 🐓" and under it:

> *The browser works too — but the app is faster to access and way cooler.*

**The coach is never mandatory.** One button, no "remind me later," no second prompt, no nag on the next launch. It sets a `localStorage` flag and never appears again.

```css
.coach-icon  { width:84px; height:84px; border-radius:19px; margin-bottom:12px;
               box-shadow:0 8px 24px rgba(245,197,24,0.25); }
.coach-steps { margin:4px 0 18px; padding-left:22px;
               display:flex; flex-direction:column; gap:12px;
               font-size:15px; line-height:1.45; text-align:left; }
.coach-steps li::marker { color: var(--gold); font-weight:800; }
.coach-alt   { color: var(--muted); font-size:12px; text-align:center; margin:0 0 14px; }
```

Steps are **left-aligned inside a centred card** — centred instructions are much harder to follow down a list. 15px with 12px between them, which is larger and looser than body copy elsewhere, because someone is reading this while holding the phone in the other hand and looking for a button.

The 19px radius on an 84px icon approximates iOS's squircle closely enough that it reads as the app icon rather than a rounded picture of one.

---

## 8. Photo pipeline

`scripts/prepare-photos.js` + `sharp`. Resize, strip EXIF, generate cutout PNGs from source JPEGs. `scripts/generate-icons.js` produces the PWA icon set from one source image.

Photos are keyed by meaning in a registry (`photo: 'golfHole'`, never a path), with alt text stored alongside the source. The registry also records **what wasn't used and why** — one file was an unidentified headshot, and captioning a real person on a guess isn't something to do casually. Writing that down stops the next person rediscovering it.

Per-image flags live in the registry too (`fit: 'contain'`, `tile: 'light'`) so logos don't get cropped like photographs and the component stays dumb.

---

## 9. Hosting and deploy

Honest summary: **this part is the least transferable, and probably not worth copying.**

It ran on a Mac mini in a closet, exposed via a Tailscale Funnel sidecar — a private HTTPS URL with a real certificate, no port forwarding, no cloud bill. Three launchd jobs: the app server, the tunnel, and an auto-deploy watcher.

The auto-deploy watcher fires on file changes, waits 20 seconds for a batch of writes to settle, takes a lock, hashes the source tree, skips if the hash matches the last successful deploy, **builds to a staging directory and only swaps if the build succeeds.** A broken build leaves the live app untouched.

Two things from it are worth generalising regardless of where you host:

**Build to a staging dir and swap on success.** Never build in place. A failed build should be a no-op, not an outage.

**Hash the source and skip unchanged deploys.** File watchers fire on touches, metadata, editor saves. The hash check is what turns a noisy trigger into a meaningful one.

The known flaw, documented so your friend doesn't rediscover it: a change landing *mid-build* hits the lock, gets skipped, and no further trigger fires — leaving a stale build with no error anywhere. The fix is to re-check the hash after releasing the lock and re-run if it moved.

**For most people: deploy this to any small VPS or a container host instead.** It's a single Express process serving static files and a JSON API. The exotic bit was solving "no cloud bill and no port forwarding," which is a constraint your friend may not share.

---

## 10. What worked, and what to skip

### Worked

**Writing everything down in the code.** This codebase is unusually heavily commented — not *what* the code does, but *why it is the way it is*, including the failed approaches. Months later, that's the difference between a codebase you can pick back up and one you rewrite. It's also what made these handoff documents possible to write at all.

**Building it for a date, and letting the date drive behaviour.** Sneak peek → Today → That's a wrap. Weather's next-week strip → trip strip. Home → Morning After. None of those needed a switch thrown; they're all comparisons against the clock. It makes the app feel attentive for about ten lines of code each.

**Shipping small and often, with real people using it.** Nearly every good detail in here came from someone complaining, not from planning.

**Refusing to build the complicated version.** No Spotify API. No real accounts. No database. No router. Each of those was considered and rejected, and none was missed.

### Skip

**The Tailscale Funnel setup**, unless you share the specific constraint.

**The identity model**, if your group is bigger than a dozen or isn't all friends.

**The JSON-file database**, if you expect real concurrency.

**The no-router decision**, if you want shareable links to specific pages. It was right for six tabs in an installed app and would be wrong for a site people link into.

---

## 11. Steal this first

Ranked by value-per-line, for someone building a comparable group-trip app:

1. **The itinerary day view.** Fixed time gutter, art, three copy tiers, NOW/NEXT from the clock. The backbone of the whole app.
2. **The final-day takeover.** A different home screen on the last morning, assembled from data you already have — then degrading into a yearbook rather than going stale. Highest delight-to-effort ratio in the codebase.
3. **Passphrase normalisation.** Six lines. Eliminates an entire class of support request.
4. **The install coach.** Without it, most of your users never install the PWA — and the in-app-browser detection is the part that saves you a support thread.

5. **The theme model.** Saved choice beats device preference forever; light mode re-inked rather than inverted; `theme-color` meta updated with it.
6. **Props, exactly as built.** Votes keyed by name, public and attributed, changeable forever, never scored. The 3-a-day cap as scarcity rather than abuse control.
7. **The disclosure that opens itself during setup** (`useState(!configured)`) and closes forever after. Two lines; turns one component into both a tutorial and a footnote.
8. **Coordinates, not addresses, behind navigation links.**
9. **Scroll policy**: new destination → top; going back → where you were; stop the moment a thumb moves.
10. **Cache-first photos, stale-while-revalidate for live data.**
11. **`robots.txt` over `noindex`**, if the link will ever be pasted into a group chat.
12. **A history page**, if your group has a past worth putting on one. Static, no API, an afternoon's work.
13. **Comment the *why*, including what you tried that didn't work.**

---

## 12. If you want the code

The repo is archived and the site is offline. Nothing in it is subtle enough to need the original — the companion documents cover everything worth copying, in more detail than reading the source would give you:

- **Day view** — times, images, activity copy, and the full spacing system
- **Weather module** — the two display states, the tap-to-expand hourly, the verdict colours
- **Jukebox** — data model, URL transform, and the disclosure interaction
- **Location & maps** — the three link types and the ride stack
- **Colour and type** — the palette and font rules, as a standalone spec

If a specific file would help, ask and it can be pulled out of the archive.
