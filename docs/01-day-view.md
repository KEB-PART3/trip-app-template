# The Day View — Times, Images, Activities

A hand-off spec for rendering a day's activities as a scrollable list of events: the clock on the left, art in the middle, words on the right. Everything below is the reasoning and the exact numbers from a shipped phone-first app, not a generic pattern.

Written to be implemented from scratch in any framework. The code samples are React, but nothing here depends on React.

---

## 0. The one-paragraph version

Each day is a labelled section. Each activity is a card in that section. Every card carries a **time**, and optionally a **picture**, a **title**, a **one-line subtitle**, and a **paragraph of detail** — in that order of importance, and each one is allowed to be absent. Three card shapes exist: a **standard row** for most things, a **split row** when two activities share a time slot, and a **marquee** for the two or three moments the whole trip is about. The shape is chosen by the data, never by hand. The app knows what time it is and marks exactly one card **NOW** and one **NEXT**.

---

## 1. The data shape

One flat array of days, each with a flat array of events. This is the entire contract.

```js
export const ITINERARY = [
  { date: '2027-06-10', label: 'Thursday, Jun 10', events: [

    // Minimum viable event: two times and a title.
    { start: '12:00', end: '17:00', title: 'Arrivals at the house' },

    // The common case: + a one-line subtitle, a photo key, a map destination.
    { start: '18:30', end: '19:30', title: "Cocktails @ the bar",
      sub: 'Pre-dinner loosening.',
      photo: 'poster',
      map: "Downtown, Asheville, NC" },

    // + a paragraph of detail, and promoted to a full-bleed hero card.
    { start: '11:00', end: '15:00', title: 'Golf @ the course',
      sub: "President's Reserve · scramble format · play the best shot",
      photo: 'golfHole',
      marquee: true,
      avatar: 'blake',
      map: 'the course, Old Hickory, TN',
      detail: 'The big outing of the trip. A marquee event gets a full-bleed
               photo card instead of a list row.' },

    // Two activities, one slot.
    { start: '10:00', end: '12:00', title: 'Choose your own adventure',
      photo: 'golfRiver',
      choices: [
        { start: '10:00', end: '11:00', title: 'The easy option',
          sub: 'Near the house', photo: 'houseDeck',
          map: 'Asheville, NC' },
        { start: '10:00', end: '12:00', title: 'The ambitious one',
          sub: 'Worth the drive', photo: 'golfRiver',
          map: 'Blue Ridge Parkway, Asheville, NC' }
      ] }
  ]}
]
```

### Field reference

| Field | Required | What it is |
|---|---|---|
| `start` / `end` | yes | 24-hour `HH:MM` strings. See §2 for why they're strings. |
| `title` | yes | The activity. 1–5 words. |
| `sub` | no | One line. The hook, the venue, or the joke. |
| `detail` | no | One paragraph. The stuff you'd otherwise Google. |
| `photo` | no | A key into a central photo registry — never a path. |
| `map` | no | A destination string. Absent means no location pill renders. |
| `marquee` | no | Promote to a full-bleed hero card. |
| `choices` | no | Array of 2 sub-events sharing the slot. |
| `avatar` | no | A second, circular image for the marquee body. |

**Every field except `start`, `end` and `title` is optional, and the layout must hold together with any subset present.** This is the single most important rule in the document. A day where you've only had time to type in times and titles should still look deliberate — not like a page with holes in it. Every `&&` guard in the render exists to serve that.

### Which shape renders

One decision, made once, in priority order:

```js
if (ev.marquee) return <Marquee ... />   // hero
if (ev.choices) return <SplitRow ... />  // two-up
return <Row ... />                        // standard
```

No config, no `type: 'hero'` string to keep in sync with anything. The presence of the data *is* the decision.

---

## 2. Times

### Store 24-hour strings. Format at render.

`start: '18:30'`, not a `Date`, not an ISO timestamp, not a Unix number. Three reasons, and the third is the one that bites people.

The data is hand-edited by a human who is reading a schedule, so it must look like a schedule. `'18:30'` is checkable at a glance; `1755210600000` is not.

The event happens at 6:30 PM *in the city the trip is in*, regardless of where the phone is. Storing an instant means encoding a timezone into every row and getting it wrong once. Storing a wall-clock string and resolving it against one fixed timezone at render means there's exactly one place to be wrong.

And the format is chosen at display time, so the same data renders `6:30 PM` in the list and `18:30` on a 24-hour phone without touching the source.

```js
const fmtTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',   // the trip's timezone, hardcoded
  hour: 'numeric', minute: '2-digit'
})
```

### Hours past 24 mean "still tonight"

This is the trick that makes late-night events behave. An event ending at 1 AM is written `end: '25:00'`, not `'01:00'` on the next date.

```js
export function dayTimeToDate(dateStr, hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const addDays = h >= 24 ? 1 : 0
  const hour = h % 24
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, mo - 1, d + addDays, hour + 5, m, 0))
}
```

Why it matters: **a night out at 10 PM belongs to the day it started, not to the calendar date at its midpoint.** Nobody reading Thursday's plan wants "drinks on Broadway" to appear under Friday. Writing `22:00 → 25:00` keeps the event in Thursday's list where a human filed it, while the arithmetic still resolves to the correct instant for the NOW/NEXT calculation. One `% 24` and one `+1 day` buys the whole thing.

The `+5` is a hardcoded UTC offset for the trip's timezone during the trip. For a fixed-date event this is correct and dependency-free. If your app spans a daylight-saving boundary, swap this for a real timezone library — it is the one shortcut here that doesn't generalise.

### Render times as a vertical stack, not a range

```
 10:00 AM
    ↓
 11:00 AM
```

Not `10:00 AM – 11:00 AM`. Three reasons.

A horizontal range is a long single line that pushes the title into a narrow column or forces a wrap. The stack is three short lines in a fixed-width gutter, so the title always gets the full remaining width.

Stacked, the two times are vertically adjacent and the eye reads *duration* — the gap between them is a shape, not a subtraction problem.

And the arrow does work a dash can't: it says *this one flows into that one*, which is what a schedule is.

```css
.event-time {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  font-weight: 800; font-size: 15px;
  white-space: nowrap;
}
.event-time-sep { color: var(--muted); font-size: 10px; margin: 2px 0; }
```

The `white-space: nowrap` is not optional. Without it `10:00 AM` breaks after `10:00` at narrow widths and the whole column collapses.

### The time column is a fixed 78px, always

```css
.event       { grid-template-columns: 78px 1fr;       gap: 12px; }
.event-photo { grid-template-columns: 78px 64px 1fr;  gap: 10px; }
```

**The time column stays exactly the same width whether or not the row has a picture.** That's the whole reason the list scans: running your eye down the page, every clock sits on the same vertical line, so the day reads as a timeline rather than as a pile of cards. Rows with art simply insert a 64px column after it.

78px is sized to the widest string the formatter can produce (`12:00 AM` at 15px/800 in a system sans) plus a couple of pixels of slack for iOS font metrics. **Measure your own widest string — don't inherit this number.** If you switch to 24-hour time it should be narrower.

### The marquee inverts the time treatment

On a hero card the time is *not* the anchor — the picture is. So the stack collapses to a single small uppercase line sitting above the title, over the image:

```css
.mq-when {
  font-size: 13px; font-weight: 800;
  letter-spacing: 1px; text-transform: uppercase;
  color: var(--gold-2);
  text-shadow: 0 2px 8px rgba(0,0,0,0.9);
}
```

Same information, opposite emphasis, because the card's job changed. On a standard row the time is the index you're scanning by; on a hero the time is a caption on something you've already stopped to look at.

### NOW and NEXT

The app knows what time it is and says so. Exactly one event is NOW, and NEXT only renders when nothing is current.

```js
export function findCurrentAndNext(itinerary, now = new Date()) {
  const all = []
  for (const day of itinerary)
    for (const ev of day.events)
      all.push({ ...ev,
        startAt: dayTimeToDate(day.date, ev.start),
        endAt:   dayTimeToDate(day.date, ev.end), date: day.date })

  all.sort((a, b) => a.startAt - b.startAt)

  let current = null, next = null
  for (const ev of all) if (ev.startAt <= now && now < ev.endAt) { current = ev; break }
  for (const ev of all) if (ev.startAt > now) { next = ev; break }
  return { current, next }
}
```

Flatten across days before sorting, so "next" can cross midnight into tomorrow. Re-run it on a one-second interval — the cost is nothing and it means the highlight moves while the phone is sitting on a table.

`isNext` is deliberately suppressed while something is current (`!current && key === nextKey`). **Two highlights is no highlight.** One card is lit at a time, or the page is just striped.

The treatment escalates: NOW gets a gold border, a 2px glow ring, and a gold-tinted gradient. NEXT gets a dimmer border and a much fainter tint — visible when you're looking for it, invisible when you're not.

```css
.event-current {
  border-color: var(--gold);
  box-shadow: 0 0 0 2px rgba(245,197,24,0.15);
  background: linear-gradient(180deg, rgba(245,197,24,0.10), var(--card));
}
.event-next {
  border-color: var(--gold-3);
  background: linear-gradient(180deg, rgba(245,197,24,0.05), var(--card));
}
```

Plus a chip in the title line — 10px, weight 900, uppercase, pill-shaped, `margin-left: 8px`. NOW is a solid gold fill; NEXT is a 20% gold wash with a gold border. Solid outranks outlined, which is the same grammar as the card treatment, one size down.

---

## 3. Images

### Three roles, three sizes, and that's all

| Role | Size | Where |
|---|---|---|
| Thumbnail | 64 × 64, `border-radius: 12px` | Standard row, between time and text |
| Half-card | full width, `aspect-ratio: 16/9` | Split row |
| Hero | full-bleed, `height: 190px` | Marquee |
| Avatar | 52 × 52 circle | Marquee body, for a person |

Four is already the ceiling. A fifth image size makes a list of cards feel like a scrapbook.

### Lock the aspect ratio, never the height

```css
.split-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  height: auto;
  object-fit: cover;
  display: block;
}
```

A fixed pixel height means the crop tightens as the phone gets wider — the same art shows a different slice on a Mini than on a Pro Max, and a composed image loses its subject. A locked ratio crops identically on every device. **Pick one source ratio, state it in the spec, and let width do the work.**

The art spec that goes to whoever makes the images: *1600 × 900 (any 16:9), subject inside the middle 90%.* Stating the safe area is what stops a beautiful image arriving with its subject on the edge that gets cut.

`object-fit: cover` on everything, so a source that doesn't match gets cropped rather than squashed.

### The hero is 190px and wears a scrim

```css
.mq-media  { position: relative; height: 190px; }
.mq-bg     { position: absolute; inset: 0; }
.mq-scrim  {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(5,5,5,0.15) 25%, rgba(5,5,5,0.92) 100%);
}
.mq-head   { position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 14px; }
```

190px is the number that earns its place on a phone: tall enough to be a picture rather than a banner, short enough that two hero cards can't fill the screen and flatten the hierarchy they exist to create.

The scrim is the load-bearing part. **Text over an uncontrolled photo is a coin flip** — a bright sky and white type is unreadable, and you don't find out until someone swaps the image. A gradient that's nearly transparent at the top (15%) and nearly opaque at the bottom (92%) guarantees a dark bed under the text while leaving the top two-thirds of the picture alone. Belt and braces: every text layer over the image also carries its own `text-shadow`.

The 25% stop matters — starting the ramp a quarter of the way down keeps the scrim off the subject's face in a portrait-composed image.

### Photos live in a registry, keyed by meaning

Events reference `photo: 'golfHole'`, never `photo: '/photos/golf-2.jpg'`.

```js
const P = '/photos/'
export const PHOTOS = {
  mascot: { src: P + 'mascot.png',
             alt: 'The The Weekend mascot in a red-striped jersey, chasing a soccer ball' },
  skyline: { src: P + 'city-2.jpg',
             alt: 'A city skyline at sunset across the river' },
  venueLogo: { src: P + 'venue-logo.png', fit: 'contain', tile: 'light',
             alt: "a venue logo" }
}
```

Swapping an image is a one-line edit in one file. Alt text lives next to the source, so it can't drift. And you get a natural home for per-image rendering flags.

**Write alt text by opening the file, not by reading the filename.** In this app `soccer-1.jpg` was a portrait of a player, and the `food-*.jpg` files were venue logos, not food. The registry carries a comment saying to trust the descriptions over the names. Filenames lie; the only fix is to look.

The registry is also where you record what you *didn't* use and why — one file was an unidentified headshot, and captioning a real person on a guess is not something to do on a whim. Writing that down stops the next person rediscovering it.

### Logos are not photographs

```css
.photo-contain { object-fit: contain; }
.photo-tile-light { background: #fff; }
```

A logo drawn for print, cropped with `cover` and dropped on a dark card, looks broken. `fit: 'contain'` plus a light tile surface is a per-image flag in the registry, so the component stays dumb and the exception lives with the asset that needs it.

### Loading

```jsx
<img src={photo.src} alt={photo.alt}
     loading={eager ? 'eager' : 'lazy'}
     decoding={eager ? 'sync' : 'async'}
     fetchpriority={eager ? 'high' : 'auto'}
     draggable={false} />
```

**Lazy by default, eager for the one hero at the top.** That image is the largest contentful paint — lazy-loading it delays the only thing anyone sees before they've scrolled. Everything below the fold stays lazy.

`draggable={false}` is a small thing that matters on touch: without it, a long-press-and-move on an image starts a drag instead of scrolling the page.

### The picture is always optional

```jsx
{photo && <Photo photo={photo} className="event-thumb" />}
```

And the row's grid template changes with it, rather than leaving a 64px hole:

```css
.event       { grid-template-columns: 78px 1fr; }
.event-photo { grid-template-columns: 78px 64px 1fr; }
```

A day you've half-filled in should look intentional, not unfinished. This is what makes the whole thing usable while you're still building the schedule.

---

## 4. Activities and descriptions

### Three tiers, and they do different jobs

| Tier | Size / colour | Budget | Job |
|---|---|---|---|
| `title` | 15px, weight 800, full-strength ink | 1–5 words | What is it |
| `sub` | 14px, `--text-2` | one line | Why you care |
| `detail` | 13px, `--text-2`, line-height 1.45 | one paragraph | What you'd otherwise look up |

The steps are small on purpose — 15 / 14 / 13 — because **the hierarchy is carried by weight and colour, not size.** The title is weight 800 in the primary ink; everything under it is normal weight in the secondary. Making the detail 11px to signal "less important" just makes it unreadable, and it's the tier people actually read once they've stopped on a card.

### Write the subtitle as the hook

The `sub` is one line and it is the personality of the whole app. It is not a description — the title already described it.

> `'Coffee, eggs, regret.'`
> `'Land in AVL, pile in.'`
> `'Honky-tonk mode.'`
> `"Blake Shelton's spot. Loud, twangy, expensive."`

Three to six words, written like a person talking. When there's genuinely useful information it goes here instead, and the tone flexes:

> `'Long table, shared plates, nobody splits the bill.'`

**If you can't write a good one, leave it out.** An absent `sub` renders nothing; a filler `sub` costs a line of screen and a little credibility. This is the tier most likely to be padded, and padding it is how an app starts feeling generated.

### The detail paragraph is where the research goes

`detail` is the paragraph that answers the question someone would otherwise open a browser for. Course architect, yardage, ranking. What the venue is known for. Who the person is.

> *"A 1920s course running through 300 acres of wetland along the river. Plays up to 7,200 yards. Book tee times a month out."*

Two to four sentences. No heading, no label, no "About this venue" — it sits directly under the subtitle and its placement says what it is.

It only renders when present (`{ev.detail && ...}`), and most events don't have one. **Reserve it for the things worth stopping on.** If every card has a paragraph, the list stops being scannable and becomes a document, which defeats the point of a day view.

### The order is fixed and it's the reading order

```
time → picture → title → subtitle → detail → location pill
```

Every card shape uses this order, including the hero, where it runs top-to-bottom over the image instead of left-to-right. **What, when, and where, in the order a person asks them.** Don't reorder per card type — the consistency is what lets someone learn the layout once on card one and read the rest at a glance.

### The location pill is pinned to the bottom

```css
.split-body .map-link { margin-top: auto; align-self: flex-start; }
```

In the split row the two half-cards have different amounts of text, so without this the two Directions buttons land at different heights and the row looks broken. `margin-top: auto` in a flex column pushes the pill to the bottom of whichever card it's in, and they line up. One declaration, and it's the difference between looking designed and looking generated.

---

## 5. Spacing and padding

Every number in the system, and the ladders they come from. **The specific values matter less than the fact that there are only a few of them.**

### Gaps — the rhythm

| Gap | Value | Where |
|---|---|---|
| Between day sections | 14px | `.day { margin-bottom: 14px }` |
| Between events | 8px | `.events { display: flex; flex-direction: column; gap: 8px }` |
| Row columns (no photo) | 12px | `.event { gap: 12px }` |
| Row columns (with photo) | 10px | `.event-photo { gap: 10px }` |
| Split halves | 10px | `.split-grid { gap: 10px }` |
| Inside a split body | 3px | `.split-body { gap: 3px }` |
| Marquee body columns | 12px | `.mq-body { gap: 12px }` |

The important relationship: **events are 8px apart, but a card's internal padding is 12px.** Inside-the-card space is *larger* than between-card space. That inversion is what makes each card read as one object instead of the list reading as evenly-spaced text. Get this backwards and everything turns to soup.

The 12 → 10 drop when a photo is present is deliberate: three columns need slightly tighter gutters to leave the text column usable at 390px.

### Padding — the ladder

| Element | Padding |
|---|---|
| Standard event card | `12px` |
| Split half-card body | `10px 10px 12px` |
| Marquee text over image | `12px 14px` |
| Marquee body below image | `14px` |
| Chip | `3px 8px` |
| Location pill | `5px 10px`, `min-height: 32px` |

Two patterns worth copying. The split body's extra bottom padding (`10px 10px 12px`) gives the pinned Directions pill a little more room underneath than beside it, which it needs because it's a rounded shape against a corner. And the marquee's horizontal padding is 14px against 12px vertical — text over an image needs a slightly wider side margin to clear the rounded corner and not look pinched.

### Radii — nesting is signalled by getting tighter

| Element | Radius |
|---|---|
| Marquee (outermost) | 16px |
| Standard event card | 14px |
| Split half-card, thumbnail | 12px |
| Chips, location pills | 999px |

**Each level of nesting drops ~2px.** A 12px card inside a 14px card reads as contained; the same radius on both reads as a mistake. Fully-round is reserved for interactive pills, so roundness itself becomes a signal that something is tappable.

### Type scale

| px | Weight | Used for |
|---|---|---|
| 24 | 900 | Marquee title |
| 15 | 800 | Event time, split title |
| 14 | 800 | Day label (uppercase, +1px tracking) |
| 14 | 400 | Event subtitle, marquee detail |
| 13 | 800 | Marquee time (uppercase, +1px tracking) |
| 13 | 400 | Event detail, marquee subtitle |
| 12 | 400 | Split subtitle |
| 11 | 800 | Split header (uppercase, +1px tracking) |
| 10 | 800 | Time separator arrow, chips |

Nine steps sounds like a lot until you notice the pattern: **everything small is either weight 800 and uppercase with letter-spacing, or normal weight and muted.** Small type is either a label or it's quiet; there is no small-and-loud. That single rule is most of what makes the density readable.

Line height: 1.45 for the detail paragraph, 1.5 for the marquee's (slightly wider measure), 1.15 for the 24px hero title. **Big type gets tight leading, small type gets loose.** The default 1.6 on a 24px heading looks like it's falling apart.

### Touch targets

Location pills carry `min-height: 32px` even though their content is ~22px tall. Anything tappable gets padded to a real target regardless of how small its text is. Form inputs in the same app sit at `min-height: 44px`, which is the proper floor — 32 is the pragmatic minimum for a secondary pill inside dense content.

### The fixed widths, and where they came from

| Width | What |
|---|---|
| 78px | Time column — widest formatted time + slack |
| 64px | Row thumbnail |
| 52px | Marquee avatar |
| 190px | Hero image height |

All four were measured, not chosen. **Re-measure the time column for your locale and font before shipping** — it's the one number here that will be wrong for you if your times format differently.

---

## 6. Build order

A sequence that produces something presentable at every step.

1. **Data first.** Type the real schedule in with only `start`, `end`, `title`. Look at it. If the plain list doesn't read well, no amount of styling fixes it.
2. **The time column.** Vertical stack, arrow, fixed width. Confirm the clocks line up down the page.
3. **Subtitles.** Write them properly — this is where the voice comes from. Leave out the ones you can't make good.
4. **The standard row.** Card, border, 12px padding, 8px gaps. Check it at 390px wide.
5. **NOW / NEXT.** One-second tick, one highlight at a time.
6. **Photos.** Registry with alt text, 64px thumbnails, the two-vs-three-column grid switch.
7. **Marquee.** Promote two or three events, no more.
8. **Split rows.** Only if you actually have a shared slot.
9. **Detail paragraphs.** Last, and only on the events that earn one.

---

## 7. Checklist

- [ ] Times are `HH:MM` strings in the data, formatted at render against one hardcoded timezone
- [ ] Hours ≥ 24 mean "later tonight" and keep late events on the day they started
- [ ] Times render as a vertical stack with an arrow, not a dash-separated range
- [ ] The time column is a fixed width and does not change when a photo is present
- [ ] `white-space: nowrap` on the time
- [ ] Exactly one NOW; NEXT is suppressed while something is current
- [ ] Every image is `aspect-ratio` + `object-fit: cover`, never a fixed height
- [ ] Text over a photo has both a scrim and its own `text-shadow`
- [ ] Photos are keyed in a registry; alt text written from the file, not the filename
- [ ] The hero image is `eager`; everything else is `lazy`
- [ ] Title / subtitle / detail step down in weight and colour, barely in size
- [ ] Every field except time and title is optional, and the layout holds without it
- [ ] Padding inside a card (12px) exceeds the gap between cards (8px)
- [ ] Radii tighten by ~2px per nesting level; only tappable things are fully round
- [ ] Small type is either uppercase-tracked-800 or muted-normal — never small and loud
- [ ] Pills pinned with `margin-top: auto` so they align across uneven cards
- [ ] Everything checked at 390px wide before anything else
