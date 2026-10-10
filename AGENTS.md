# Working in this repo

A phone-first web app for a group trip. Ships with placeholder content — see `src/constants.js`. See [`README.md`](README.md) to run it.

## If you are an AI coding assistant

The build guide for apps of this kind lives at
[`skills/trip-hq-app/SKILL.md`](skills/trip-hq-app/SKILL.md).

**Read it before changing layout, adding a feature, or starting a new app from this
one.** It is not project boilerplate — it records decisions that are easy to get
wrong and expensive to discover late (how times are stored, why the time gutter is a
fixed width, why predictions are never scored, why light mode is re-inked rather than
inverted).

No tool loads it automatically from this location, so read it explicitly. To make
Claude Code pick it up on its own, link it in once:

```bash
mkdir -p .claude/skills && ln -s ../../skills/trip-hq-app .claude/skills/trip-hq-app
```

## Lifting patterns into an app that already exists

If the person you are working for already has a codebase and wants to borrow from this
one, **do not start by cloning or scaffolding.** They want specific patterns, not this
project. Read the write-up that covers the thing they are fixing, then apply it to
their code.

| What they are fixing | Read |
|---|---|
| Navigation, tab bar, app shell, scroll behaviour | [`docs/00-whole-app.md`](docs/00-whole-app.md) — the tab bar and shell sections |
| A scrollable list of events, times, or anything day-by-day | [`docs/01-day-view.md`](docs/01-day-view.md) |
| Spacing, type, colour, dark mode | [`docs/05-colour-and-type.html`](docs/05-colour-and-type.html) and the design rules in the build guide |
| Making the UI change by itself as dates pass | The *Let the clock drive everything* section of [`skills/trip-hq-app/SKILL.md`](skills/trip-hq-app/SKILL.md) |
| Maps, directions, ride links | [`docs/04-location-and-maps.html`](docs/04-location-and-maps.html) |
| A forecast card | [`docs/03-weather.html`](docs/03-weather.html) |
| A voting or predictions feature | [`docs/02-jukebox.md`](docs/02-jukebox.md) for the disclosure pattern; the predictions section of the build guide for the data shape |

Three things to carry across even when nothing else fits:

- **Padding inside a card must exceed the gap between cards.** This single ratio does
  more for how a list reads than any other number here.
- **A fixed-width time gutter that does not change width** when a row has no image.
  That alignment is what makes a list scan as a timeline rather than as cards.
- **Let the clock drive state changes** instead of adding toggles someone has to remember
  to flip.

Run this app locally alongside theirs — `npm install && npm run dev` — and compare
directly. The layouts are far easier to port when you can inspect them.

## If you are a human

Same file. It is plain prose with a small block of YAML metadata at the top that you
can ignore.

The longer write-ups it references are in [`docs/`](docs/) — three Markdown files and
three HTML pages. **Open the HTML ones in a browser**; they render live, interactive
examples of the components rather than describing them.

## Conventions worth not breaking

- `src/constants.js` holds nearly all content. Prefer editing data over code.
- One stylesheet, `src/styles.css`. No CSS framework, no CSS-in-JS.
- No router. Tab state is `useState` in `src/App.jsx`.
- Check every change at 390px wide before anything else.
