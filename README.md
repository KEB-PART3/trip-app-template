# Trip HQ — a template

A phone-first web app for a group trip: itinerary, weather, shared playlist, group predictions, arrival info and a page of past trips. One stylesheet, no router, no database, three runtime dependencies.

**It ships with a placeholder weekend in it.** Ten people, four days, invented names and events. Replace `src/constants.js` with your own trip and the whole app follows — the countdown, the day rail, the flights board and the final-morning page all read from that one file.

The photography is placeholder too: real photos of a real place, standing in for yours.

## Run it

```bash
npm install
npm run dev
```

Then open the URL it prints. `npm run build` produces a static `dist/` folder — no server needed.

## How it is wired

1. **No backend.** `src/api.js` is an in-memory stand-in. Voting, adding props, deleting and setting the playlist all work; everything resets on reload. Swap it for real calls when you want state shared across phones — the function signatures are the contract.
2. **No live weather.** `src/demo-weather.json` is a baked Open-Meteo-shaped payload. In a live build, proxy and cache the real API server-side — it is free and needs no key.
3. **No service worker.** The PWA plugin is removed — a cached service worker on a demo site serves a stale build forever.
4. **Onboarding is skipped.** The passphrase screen, name picker and install coach all exist in `src/pages/` but are bypassed so it opens straight on Home. Set `SKIP_ONBOARDING = false` in `index.html` to see them.

Nothing in the sample data is real.

## Where things live

| Path | What |
|---|---|
| `src/App.jsx` | The shell: six tabs, no router, theme, scroll policy |
| `src/constants.js` | **Start here.** Itinerary, roster, flights, league history — all the content |
| `src/pages/Itinerary.jsx` | The day view: time gutter, three card shapes, NOW/NEXT |
| `src/pages/Props.jsx` | Prop bets: add, vote, filter, delete |
| `src/pages/Lore.jsx` | Past trips, static |
| `src/pages/MorningAfter.jsx` | Final-day takeover — replaces Home on the last morning |
| `src/pages/Jukebox.jsx` | One shared playlist link + embed |
| `src/components/Weather.jsx` | Forecast card with the tap-to-expand hourly strip |
| `src/styles.css` | Everything. One file, no framework |

## Changing the moment in time

`index.html` sets the fake clock. Change this line to land somewhere else:

```js
var FAKE = new Date('2026-08-03T16:20:00-05:00').getTime();
```

| Set it to | You get |
|---|---|
| `2026-07-25T10:00:00-05:00` | Three weeks out — weather shows the rolling "next week" strip |
| `2026-08-03T16:20:00-05:00` | Ten days out (current) — countdown, Sneak peek |
| `2026-08-15T13:00:00-05:00` | Draft day — NOW/NEXT lit, Today rail live |
| `2026-08-16T08:00:00-05:00` | The final morning — getaway board, superlative voting |
| `2026-08-20T08:00:00-05:00` | After — the yearbook mode |

## Already have an app?

Then don't clone this — you want the patterns, not the project.

Point your coding assistant at [`AGENTS.md`](AGENTS.md), which says which write-ups
cover what. The short version: navigation and the tab bar are in
[`docs/00-whole-app.md`](docs/00-whole-app.md), the scrollable day-by-day list is
[`docs/01-day-view.md`](docs/01-day-view.md), and the look is
[`docs/05-colour-and-type.html`](docs/05-colour-and-type.html) (open that one in a
browser).

Run this app once alongside yours anyway — `npm install && npm run dev` — because the
layouts are much easier to copy when you can poke at them.

## Making it yours

Nearly everything is data, not code. Edit `src/constants.js`:

- `ITINERARY` — days and events. Only `start`, `end` and `title` are required; `sub`, `detail`, `photo`, `map`, `marquee` and `choices` are all optional and the layout holds without them.
- `MEMBERS` — the roster.
- `FLIGHTS` — arrivals and departures.
- `PAST_TRIPS` — the history page.
- The ISO date constants at the top — trip start, end, and the two countdown targets.

Photos are keyed by meaning in `src/photos.js` and live in `public/photos/`. Alt text sits next to the source so it can't drift.

## Design notes

The reasoning behind the layout, the colours, the time handling and each feature is written up separately — see `docs/`. The short version:

- Padding inside a card (12px) is larger than the gap between cards (8px).
- Radii tighten about 2px per nesting level; only tappable things are fully round.
- Small type is either uppercase-tracked-800 or muted-normal — never small and loud.
- Light mode is re-inked, not inverted. The two palettes share names and almost no values.
- Hours past 24 in the itinerary data mean "still tonight", so a 10pm–1am night stays on the day it started.
