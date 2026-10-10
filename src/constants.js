// ---------------------------------------------------------------------------
// ALL THE CONTENT LIVES HERE.
//
// This is the only file most people need to edit. Replace the sample weekend
// below with your own and the whole app follows — the countdown, the day-by-day
// rail, the flights board, the weather card and the final-morning page all read
// from these constants.
//
// The sample data is a placeholder trip for four people-plus. None of it is
// real; swap it out.
// ---------------------------------------------------------------------------

// --- The trip -------------------------------------------------------------
//
// Four ISO timestamps drive every date-aware thing in the app. Keep the UTC
// offset correct for your city at that time of year (daylight saving included)
// and set TZ / TZ_OFFSET_HOURS to match.

export const TRIP_START_ISO = '2027-06-10T00:00:00-04:00'
export const TRIP_END_ISO   = '2027-06-13T23:59:59-04:00'

// The centrepiece event the headline countdown points at, once everyone has
// arrived. Before that, the countdown targets ARRIVAL_ISO instead.
export const DRAFT_ISO   = '2027-06-12T12:30:00-04:00'
// A ticketed event with seat numbers — see MATCH below.
export const KICKOFF_ISO = '2027-06-12T19:30:00-04:00'

// Arrivals begin Thursday midday — the first countdown target.
export const ARRIVAL_ISO = '2027-06-10T12:00:00-04:00'
export const ARRIVAL_WINDOW_END_ISO = '2027-06-10T18:00:00-04:00'
// Once everyone is in, the headline timer switches to the centrepiece event.
export const TIMER_FLIP_ISO = '2027-06-11T00:00:00-04:00'

export const TZ = 'America/New_York'
// Hours to ADD to local wall-clock time to get UTC. EDT = 4, EST = 5, CDT = 5,
// PDT = 7. Used to turn the "HH:MM" strings below into real instants.
export const TZ_OFFSET_HOURS = 4

export const TRIP_DATES = ['2027-06-10', '2027-06-11', '2027-06-12', '2027-06-13']

export const TRIP_NAME = 'The Weekend'
export const TRIP_YEAR = '2027'
export const TRIP_CITY = 'Asheville'

// --- The group ------------------------------------------------------------
//
// `nick` is the identity each phone picks after sign-in and the key everything
// else joins on — flights, votes, authorship. Keep them short and unique.
// `trips` feeds the Past Trips page.

export const ORGANIZER = 'Alex'
export const COMMISH = ORGANIZER // legacy alias

export const MEMBERS = [
  { nick: 'Alex',   name: 'Alex',   trips: 9, firstTrip: 2018, organizer: true },
  { nick: 'Sam',    name: 'Sam',    trips: 9, firstTrip: 2018 },
  { nick: 'Jordan', name: 'Jordan', trips: 8, firstTrip: 2018 },
  { nick: 'Riley',  name: 'Riley',  trips: 7, firstTrip: 2019 },
  { nick: 'Casey',  name: 'Casey',  trips: 7, firstTrip: 2019 },
  { nick: 'Morgan', name: 'Morgan', trips: 6, firstTrip: 2020 },
  { nick: 'Taylor', name: 'Taylor', trips: 5, firstTrip: 2021 },
  { nick: 'Jamie',  name: 'Jamie',  trips: 4, firstTrip: 2022 },
  { nick: 'Drew',   name: 'Drew',   trips: 3, firstTrip: 2023 },
  { nick: 'Quinn',  name: 'Quinn',  trips: 2, firstTrip: 2025 }
]

// --- Flights --------------------------------------------------------------
//
// Read-only in the app; maintained by hand from whatever spreadsheet the group
// already keeps. Keyed by nick. `roadtrip: true` for anyone driving.

export const ARRIVAL_DAY = 'Thursday, Jun 10'
export const DEPARTURE_DAY = 'Sunday, Jun 13'

export const FLIGHTS = {
  Alex:   { arrivalTime: '1:20 PM',  arrivalAirline: 'Southwest', arrivalFlight: '1076', departureTime: '12:05 PM', departureAirline: 'Southwest', departureFlight: '3579' },
  Sam:    { arrivalTime: '2:15 PM',  arrivalAirline: 'Southwest', arrivalFlight: '2571', departureTime: '8:05 AM',  departureAirline: 'United',    departureFlight: '4482' },
  Jordan: { roadtrip: true },
  Riley:  { roadtrip: true },
  Casey:  { arrivalTime: '5:00 PM',  arrivalAirline: 'Alaska',    arrivalFlight: '1732', departureTime: '4:43 PM',  departureAirline: 'Alaska',    departureFlight: '1550' },
  Morgan: { arrivalDay: 'Wed, Jun 9', arrivalTime: '9:33 PM', arrivalAirline: 'Delta', arrivalFlight: '5241', departureTime: '9:25 AM', departureAirline: 'Alaska', departureFlight: '4461' },
  Taylor: { arrivalTime: '12:00 PM', arrivalAirline: 'Delta',     arrivalFlight: '6166', departureTime: '11:40 AM', departureAirline: 'Delta',     departureFlight: '7391' },
  Jamie:  { arrivalTime: '3:53 PM',  arrivalAirline: 'Delta',     arrivalFlight: '4070', departureTime: '3:52 PM',  departureAirline: 'Delta',     departureFlight: '4001' },
  Drew:   { arrivalTime: '3:05 PM',  arrivalAirline: 'United',    arrivalFlight: '3593', departureTime: '8:05 AM',  departureAirline: 'United',    departureFlight: '4482' },
  Quinn:  { arrivalTime: '1:00 PM',  arrivalAirline: 'Southwest', arrivalFlight: '956',  departureTime: '8:05 AM',  departureAirline: 'United',    departureFlight: '4482' }
}

// Display-only. Long carrier names push flight rows onto a second line on a
// phone, so the UI shows a short code; FLIGHTS keeps the spreadsheet's wording.
const AIRLINE_SHORT = { Southwest: 'SWA', United: 'UAL' }
export const shortAirline = a => AIRLINE_SHORT[a] || a

// --- Voice ----------------------------------------------------------------
//
// One of these rotates under the title on Home. This is where the app's
// personality lives — write them in your group's voice.

export const TAGLINES = [
  'Nine years running.',
  'Same people, new postcode.',
  'The annual reset.',
  'Out of office. Properly.',
  'Everyone made it. Again.',
  'Four days, no agenda but this one.'
]

// --- Past trips -----------------------------------------------------------
//
// Fills the Past Trips tab. Oldest first.

export const PAST_TRIPS = [
  { year: 2018, place: 'The first one',   host: 'Alex',   note: 'Nobody knew it would become a thing.' },
  { year: 2019, place: 'The lake house',  host: 'Sam',    note: 'The year of the broken canoe.' },
  { year: 2020, place: 'Postponed',       host: '—',      note: 'For obvious reasons.' },
  { year: 2021, place: 'The cabin',       host: 'Jordan', note: 'Snowed in for a day. Nobody minded.' },
  { year: 2022, place: 'The coast',       host: 'Riley',  note: 'First year all ten made it.' },
  { year: 2023, place: 'The mountains',   host: 'Casey',  note: 'The hike nobody finished.' },
  { year: 2024, place: 'The city trip',   host: 'Morgan', note: 'Too many stairs, great food.' },
  { year: 2025, place: 'The farmhouse',   host: 'Taylor', note: 'Rained the whole time. Best one yet.' },
  { year: 2026, place: 'The island',      host: 'Alex',   note: 'The ferry story.' }
]

export const LAST_TRIP = { year: 2026, place: 'The island', host: 'Alex' }

// --- Where everyone is staying --------------------------------------------

export const HOUSE_ADDRESS = '1 Sample Street, Asheville, NC 28801'

// Arrival and access, distilled to what you actually need standing at the door
// with a bag: the code, how the lock works, the wifi, and how to find it.
export const HOUSE_ACCESS = {
  doorCode: '••••••',
  enterSteps: [
    'Press the keypad to wake it',
    'Enter the passcode',
    'Press the ✓ button',
    'Turn the handle'
  ],
  enterShort: 'Wake the keypad, code, ✓, then turn the handle.',
  exit: 'Leaving: pull the door shut and press the lock button.',
  wifiSsid: 'TheWeekend-Guest',
  wifiPass: '••••••••',
  finding: 'Last building on the left, up the short drive. We are the unit over the garage.',
  parking: 'Park in the garage or out front.'
}

// The house as a PIN rather than a street address. A street address often
// geocodes to the front of a building, which can be the wrong side; a dropped
// pin is exact. HOUSE_ADDRESS stays as the human-readable label.
export const HOUSE_LATLNG = { lat: 35.6000, lng: -82.5500 }
export const HOUSE_DEST = '35.6000,-82.5500'

// --- The itinerary --------------------------------------------------------
//
// One object per day, one per event. Only `start`, `end` and `title` are
// required — `sub`, `detail`, `photo`, `map`, `marquee` and `choices` are all
// optional and the layout holds without any of them.
//
// Times are 24-hour "HH:MM" strings. An hour past 24 means "still tonight", so
// 22:00 → 25:00 keeps a late night filed under the day it started.

export const ITINERARY = [
  { date: '2027-06-10', label: 'Thursday, Jun 10', events: [
    { start: '12:00', end: '17:00', title: 'Arrivals', sub: 'Land, drop bags, regroup.', photo: 'houseLiving', map: HOUSE_ADDRESS },
    { start: '18:30', end: '19:30', title: 'Drinks before dinner', sub: 'Somewhere walkable.', photo: 'skyline', map: 'Downtown, Asheville, NC' },
    { start: '19:30', end: '21:30', title: 'Group dinner', photo: 'houseKitchen',
      map: 'Downtown, Asheville, NC',
      sub: 'Long table, shared plates, nobody splits the bill.' },
    { start: '22:00', end: '25:00', title: 'Out, or not', sub: 'Optional. Nobody is counted.', photo: 'broadway', map: 'Downtown, Asheville, NC' }
  ]},
  { date: '2027-06-11', label: 'Friday, Jun 11', events: [
    { start: '08:30', end: '10:00', title: 'Breakfast at the house', sub: 'Coffee and a slow start.', photo: 'houseKitchen', map: HOUSE_ADDRESS },
    { start: '11:00', end: '15:00', title: 'The long activity', sub: 'The one that takes most of a day',
      photo: 'golfHole', marquee: true, map: 'Asheville, NC',
      detail: 'Put the big outing here. A marquee event gets a full-bleed photo card instead of a list row — use it two or three times across a trip, no more, or nothing stands out.' },
    { start: '18:30', end: '20:00', title: 'Dinner in', sub: 'Delivered. Nobody cooks.', photo: 'houseSofa', map: HOUSE_ADDRESS,
      detail: 'An event can carry a paragraph of detail like this one. Use it for the things people would otherwise look up — what a venue is known for, who someone is, what to bring.' },
    { start: '21:00', end: '25:00', title: 'Live music', sub: 'Loud, late, worth it.',
      photo: 'venueRoom', marquee: true, map: 'Downtown, Asheville, NC',
      detail: 'Somewhere with a band on at the back.' }
  ]},
  { date: '2027-06-12', label: 'Saturday, Jun 12 — THE BIG DAY', events: [
    { start: '08:00', end: '09:30', title: 'Breakfast', sub: 'Eat properly. Long day ahead.', photo: 'houseKitchen', map: HOUSE_ADDRESS },
    // Two activities, one slot. The split IS the information — it renders as
    // one card with two halves rather than two rows.
    { start: '10:00', end: '12:00', title: 'Choose your own adventure', photo: 'golfRiver', choices: [
      { start: '10:00', end: '11:00', title: 'The easy option', sub: 'Near the house',
        photo: 'houseDeck', map: 'Asheville, NC' },
      { start: '10:00', end: '12:00', title: 'The ambitious one', sub: 'Worth the drive',
        photo: 'golfRiver', map: 'Blue Ridge Parkway, Asheville, NC' }
    ]},
    { start: '11:30', end: '12:30', title: 'Lunch', photo: 'houseBalc',
      map: 'Downtown, Asheville, NC',
      sub: 'Quick one. The afternoon is the point.' },
    { start: '12:30', end: '15:30', title: 'THE MAIN EVENT', sub: 'The reason the dates were picked.', draft: true, marquee: true, map: HOUSE_ADDRESS },
    { start: '16:00', end: '19:00', title: 'Afternoon at a friend of a friend’s', photo: 'houseDeck',
      map: 'Asheville, NC',
      sub: 'Not at the house. A real address, so this row gets Directions rather than the house tag.' },
    { start: '19:30', end: '22:00', title: 'The game', sub: 'Section 112, Row L', match: true, marquee: true, map: 'McCormick Field, Asheville, NC' },
    { start: '22:30', end: '25:59', title: 'Out again', sub: 'Last big night.', photo: 'venueStage', map: 'Downtown, Asheville, NC' }
  ]},
  { date: '2027-06-13', label: 'Sunday, Jun 13', events: [
    { start: '09:00', end: '14:00', title: 'Goodbyes', sub: 'Same time next year.', photo: 'houseRoof',
      map: 'Asheville Regional Airport (AVL)', mapLabel: 'Directions to the airport' }
  ]}
]

// --- Map and ride links ---------------------------------------------------

export function mapsUrl(query) {
  return 'https://maps.google.com/?q=' + encodeURIComponent(query)
}

// Turn-by-turn directions FROM the phone's current location TO a destination.
// Google's universal URL opens the app if installed, else the web.
export function directionsUrl(destination) {
  return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(destination)
}

export function appleDirectionsUrl(destination) {
  return 'https://maps.apple.com/?daddr=' + encodeURIComponent(destination)
}

// Uber universal deep link: opens the app signed in as the rider, pickup at
// their current location, destination pre-filled.
export function uberUrl(destination, latlng, nickname) {
  const p = new URLSearchParams({ action: 'setPickup', pickup: 'my_location' })
  p.set('dropoff[formatted_address]', destination)
  if (latlng) {
    p.set('dropoff[latitude]', String(latlng.lat))
    p.set('dropoff[longitude]', String(latlng.lng))
  }
  if (nickname) p.set('dropoff[nickname]', nickname)
  return 'https://m.uber.com/ul/?' + p.toString()
}

// A second ride option, if one operates where you are going. Some apps cannot
// accept a destination from a link — this one opens the app and the UI copies
// the coordinates to the clipboard so the rider pastes instead of types.
export const WAYMO_URL = 'https://waymo.com/'

// --- A scored side activity ------------------------------------------------
//
// Optional. Feeds a leaderboard on the final-morning page. Delete it and the
// card simply does not render.

export const GOLF = {
  venue: 'The Saturday scramble',
  format: 'Teams of three',
  roster: 'Nine played',
  teams: [
    { name: 'Team One',   score: 78, players: ['Morgan', 'Drew', 'Sam'] },
    { name: 'Team Two',   score: 79, players: ['Jordan', 'Taylor', 'Casey'] },
    { name: 'Team Three', score: 79, players: ['Alex', 'Jamie', 'Quinn'] }
  ],
  note: 'Called before the round: someone would break 80. All three teams did.'
}

// --- A ticketed event ------------------------------------------------------
//
// Section and row are the thing people open the app to check, so they live here
// rather than buried in a `sub` string.

export const MATCH = {
  home: 'The Home Team',
  away: 'The Visitors',
  when: 'Saturday, Jun 12 · 7:30 PM',
  venue: 'McCormick Field',
  section: '112',
  row: 'L',
  note: 'Put the context people will want here — who is playing, why this fixture matters, anything worth knowing before you are standing in the queue.'
}

// --- Weather ---------------------------------------------------------------
//
// WMO weather codes → a label and an emoji. Open-Meteo returns these numbers.

export const WEATHER_CODES = {
  0: ['Clear', '☀️'], 1: ['Mostly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'], 48: ['Fog', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌦️'],
  61: ['Light rain', '🌧️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  66: ['Freezing rain', '🌧️'], 67: ['Freezing rain', '🌧️'],
  71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '🌨️'], 77: ['Snow grains', '🌨️'],
  80: ['Showers', '🌦️'], 81: ['Showers', '🌦️'], 82: ['Heavy showers', '⛈️'],
  85: ['Snow showers', '🌨️'], 86: ['Snow showers', '🌨️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Storm + hail', '⛈️'], 99: ['Storm + hail', '⛈️']
}

export function describeWeather(code) {
  return WEATHER_CODES[code] || ['—', '🌡️']
}
