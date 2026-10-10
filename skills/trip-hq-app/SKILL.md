---
name: trip-hq-app
description: Build a phone-first web app for a group trip, weekend or event — itinerary, weather, arrival info, shared playlist, group predictions — and ship it on Cloudflare. Use when someone wants an app for a trip, draft weekend, bachelor party, reunion or similar.
---

# Group trip HQ app

> **Reading this as a human?** Go ahead — it's plain prose. The `---` block above is
> metadata for AI coding tools; ignore it. The longer write-ups behind every claim
> here are in [`docs/`](../../docs/).

A private, phone-first web app that answers every question a group would otherwise text the group chat: what are we doing, when, where, how do I get there, what's the door code, who lands when, what's the playlist.

**Reference implementation: this repo.** Read `src/constants.js` first — nearly everything is data, not code. It ships with a placeholder weekend in it; replacing that file replaces the trip.

## Before writing any code

Ask for: the dates, the city, the roster (nicknames beat real names), and the day-by-day plan. **The plan is the product.** If the itinerary is thin, the app is thin, and styling won't fix that.

Then confirm scope. Default to Home, Itinerary, plus two or three of Flights / Playlist / Predictions / Past trips. Six tabs is the ceiling.

## Stack — keep it small

React + Vite, one `styles.css`. **No router** (tab state is `useState`), **no state library**, **no CSS framework**.

For persistence, ask one question: *does anything need to be the same on everyone's phone?*

- **No** → pure static build. Ship to Cloudflare Pages, done.
- **Yes** → Cloudflare Pages Functions (or a Worker) plus **Workers KV** holding a single JSON blob, read-modify-write per request. For a group under ~20 people that is genuinely correct, not a compromise. Reach for **D1** only if you actually need queries across rows.

Everything goes through two helpers (`readState` / `writeState`) so the storage layer can be swapped without touching a call site.

## The five things that make it feel good

### 1. The day view

Time in a **fixed-width left gutter** (measure the widest formatted time), optional art, then title → subtitle → detail. The gutter must not change width when a row has no photo — that alignment is what makes the list scan as a timeline.

Render times as a vertical stack (start, ↓, end), not `9:00 AM – 11:00 AM`.

Store times as `HH:MM` strings, format at render against one hardcoded timezone. **Hours past 24 mean "still tonight"** — an event written `22:00 → 25:00` stays filed under the day it started, which is where a human put it.

Three card shapes, chosen by the data and never by hand: standard row, split row (`choices`) when two activities share a slot, full-bleed marquee (`marquee`) for the two or three moments the trip is about.

Every field except start, end and title is optional, and the layout must hold with any subset present.

*Full spec, with every number: [`docs/01-day-view.md`](../../docs/01-day-view.md)*

### 2. Let the clock drive everything

No admin toggles — the person who'd flip them is busy. Compare against the current time:

- Exactly one event is **NOW**, one is **NEXT**; suppress NEXT while something is current. Two highlights is no highlight.
- Home's header changes: "Sneak peek" before → "Today" during → "That's a wrap" after.
- On the last morning, **replace Home entirely** with a getaway board and awards, assembled from data you already have. Use `>=`, not `===`, so the pre-trip countdown never returns. Then let it degrade into a yearbook rather than going stale. Highest delight-per-line feature in the app.

### 3. Locations are buttons, not text

One tap starts turn-by-turn navigation. Plain URLs only — no maps SDK, no API key, no embedded tiles.

```js
'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(dest)
```

Store the street address for **display** and coordinates for **navigation** — addresses often geocode to the wrong side of a building. Gold pill + 📍 means go; a quiet grey tag means you're already here.

*Rendered examples: [`docs/04-location-and-maps.html`](../../docs/04-location-and-maps.html)*

### 4. Weather with an opinion

Open-Meteo: free, no key. Proxy it through a Pages Function with a TTL cache (or bake a payload for a static build) so a room full of phones doesn't hammer it, and serve stale on error.

Classify each day by a priority cascade — storm > hot > rain > warm > nice > meh — and give it a plain-language verdict instead of a condition label. Pick the phrase deterministically by hashing the date; **never `Math.random()`**, or it reshuffles on every re-render and reads as a bug. One classification drives both the text colour and the card trim.

*Live specimens: [`docs/03-weather.html`](../../docs/03-weather.html)*

### 5. Predictions, never scored

Anyone posts a prediction, everyone votes, votes stay changeable, **nothing is ever resolved**. Scoring means adjudication, and nobody wants to referee on their own holiday.

Store votes as an object keyed by name (`votes[nick] = answer`) — changing a vote is an overwrite, so uniqueness is the data shape rather than logic you must remember. **Show who voted for what**; anonymous voting kills it. Cap submissions (3/day works) as scarcity, not abuse control, and lead the page with the rule.

## Design rules that carry the look

- System font stack. Personality comes from weights: headings 800–900, never 600.
- **Padding inside a card (12px) must exceed the gap between cards (8px)**, or the list reads as soup.
- Radii tighten ~2px per nesting level; only tappable things are fully round.
- Small type is either uppercase-tracked-800 or muted-normal — never small and loud.
- Numbers that update get `font-variant-numeric: tabular-nums`.
- Bottom tab bar: `position: fixed`, a grid of equal fractions, `min-height: 48px`, and `env(safe-area-inset-bottom)` inside the padding or labels clip on iPhones. Either commit to a real `backdrop-filter` blur or go fully opaque.
- Light mode is **re-inked, not inverted** — same token names, different values, each checked for contrast against the surface it lands on. Saved choice beats device preference permanently; update the `theme-color` meta tag with it.
- Images: `aspect-ratio` + `object-fit: cover`, never a fixed height. Text over a photo needs a scrim *and* its own text-shadow.
- Emoji used as icons have per-platform metrics and will sit wrong somewhere — draw an SVG instead.

*Palette and type tokens: [`docs/05-colour-and-type.html`](../../docs/05-colour-and-type.html)*

## Ship it — Cloudflare

**Cloudflare Pages, connected to the GitHub repo.** Every push to `main` builds and deploys; pull requests get preview URLs. Build command `npm run build`, output directory `dist`. Set `base: './'` in the Vite config.

This replaces the Mac-mini-plus-Tailscale-Funnel setup the original used — **do not propose Tailscale for new builds.** No machine to keep awake, no tunnel, no launchd jobs, and the repo can stay private while the site is public (which GitHub Pages won't do on a free plan).

If the app needs a backend, put it in `functions/` in the same repo — Pages Functions deploy with the site, no separate service. Bind a KV namespace in the Pages project settings and read it from the function's `env`.

**For access control, use Cloudflare Access (Zero Trust) rather than a homemade passphrase gate.** Put the whole site behind a policy that allows a list of email addresses; members get a one-time code by email. That removes hand-rolled auth, cookies and HMAC entirely, and it's free for a group this size — check current limits. Only build a passphrase gate if the group won't tolerate entering an email.

Secrets go in Pages environment variables, never in the bundle.

**Add an install coach** — a one-time Add-to-Home-Screen walkthrough after onboarding, skipped when already standalone. Detect in-app browsers (WhatsApp, Instagram), where Add to Home Screen doesn't exist at all. Without it, most people never install the app.

If it ships a service worker, remember a cached one makes a dead site look alive.

## Checklist

- [ ] Itinerary reads well as plain text before any styling
- [ ] Time gutter fixed-width, identical with and without photos
- [ ] Exactly one NOW; NEXT suppressed while something is current
- [ ] Late-night events stay on the day they started
- [ ] Every location is one tap to navigation, coordinates not addresses
- [ ] Verdict phrases deterministic, not random
- [ ] Votes public and attributed; nothing scored
- [ ] Card padding > inter-card gap
- [ ] Checked at 390px wide before anything else
- [ ] Install coach present; in-app browser detected
- [ ] Deployed from Pages on push; secrets in env vars, not the bundle
