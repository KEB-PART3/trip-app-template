# Design and build notes

Six write-ups covering how this app was built and why. Each stands alone — read whichever matches what you're working on.

**Open the `.html` ones in a browser.** They render live, interactive specimens of the components rather than describing them in prose. Viewing them on GitHub shows raw source, which is useless.

| File | What it covers |
|---|---|
| [`00-whole-app.md`](00-whole-app.md) | The tour. Every feature, the stack and why it's small, the tab bar, dark/light mode, the PWA install flow, auth, and a ranked "steal this first" list. **Start here.** |
| [`01-day-view.md`](01-day-view.md) | The itinerary: how times are stored and rendered, image rules, the three copy tiers, and the complete spacing system. The most reusable piece. |
| [`02-jukebox.md`](02-jukebox.md) | The shared playlist — one URL, no API key — plus the expand/collapse panel that opens itself during setup. |
| [`03-weather.html`](03-weather.html) | The forecast card. Two display states, tap-to-expand hourly, and the verdict colour system. Tappable. |
| [`04-location-and-maps.html`](04-location-and-maps.html) | How venues become one tap to navigation. Rendered with the real components. |
| [`05-colour-and-type.html`](05-colour-and-type.html) | Palette and type, as a standalone spec. The page is built with the palette, so you're looking at the thing itself. Copy-paste token block at the end. |

The condensed version of all of it — the rules without the reasoning — is in [`../skills/trip-hq-app/SKILL.md`](../skills/trip-hq-app/SKILL.md).

## A note on what's real here

This repo ships with a placeholder weekend in it — invented people, invented events. Nothing in the sample data is real.

Where the docs describe a backend, a passphrase gate or a service worker, those existed in the original and are **not** in this repo — see *What's different* in the root [`README.md`](../README.md). Where they describe hosting on a Mac mini behind a Tailscale tunnel, treat that as history; new builds should go to Cloudflare Pages.
