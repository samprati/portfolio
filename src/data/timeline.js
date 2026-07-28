// The whole site is "Flight SD-2026", flying the real arc of Samprati's
// career: Kuala Lumpur → Hyderabad → Berlin / Amsterdam. You take off from a
// runway, climb above a sea of clouds, cruise past each role (a leg of the
// journey), then descend and land at the destination.
//
// `pos` is the camera, `look` is where it's aimed. look.y vs pos.y is the
// pitch: look above the camera = nose-up (climbing), below = nose-down.

// Key altitudes on the Y axis (world units).
export const GROUND_Y = 0 // runway surface
export const CLOUD_DECK_Y = 30 // middle of the cloud layer you climb through
export const CRUISE_Y = 54 // high above the deck — the "sea of clouds" cruise

// The in-cloud sections — one per career leg, shown while cruising as story
// cards that fade in and out with the flight. `pos`/`look` still fly the
// camera; the rest is content for the card. The "boarding" and "arrival"
// sections live on the runway instead (see BOARDING / ARRIVAL below).
export const TIMELINE = [
  {
    key: 'origin',
    label: 'KUALA LUMPUR',
    pos: [4, 54, -30],
    look: [4, 53.7, -60],
    no: '01',
    code: 'KUL · Kuala Lumpur',
    years: '2012 — 2017',
    title: 'Where it started',
    story:
      'Three roles, one city. I went from drawing interfaces and wiring up the systems behind them to owning product design end to end — across the Centre of Technology & Innovation, Optimizer HQ and Wiedu. This is where I learned the thing I still believe: the fastest way to make software feel calm is to design the component once and reuse it everywhere.',
    chips: ['−25% support tickets', '+20% satisfaction', 'First design guidelines'],
  },
  {
    key: 'servedeck',
    label: 'SERVEDECK',
    pos: [-4, 56, -62],
    look: [-4, 55.6, -92],
    no: '02',
    code: 'KUL · Mandrill Tech',
    years: '2017 — 2020',
    title: 'ServeDeck',
    story:
      'Senior UI Designer on a smart facility-operations platform, spanning web and mobile. My job was to take dense operational data — work orders, assets, schedules — and turn it into layouts a facility team could read and act on in seconds, not minutes.',
    chips: ['+15% app downloads', '+10% satisfaction', 'Web + mobile system'],
  },
  {
    key: 'teleport',
    label: 'TELEPORT',
    pos: [3, 57, -94],
    look: [3, 56.6, -124],
    no: '03',
    code: 'KUL · AirAsia Group',
    years: '2020 — 2021',
    title: 'Teleport App',
    story:
      "Product Designer for AirAsia's logistics arm, mid-pandemic, while the business scaled fast. I mapped the whole order journey end to end, found exactly where people were dropping off, and rebuilt those screens first — inside a shared design-system framework so the team could move quicker.",
    chips: ['−30% drop-off', '+25% efficiency', '−20% mockup time'],
  },
  {
    key: 'hitachi',
    label: 'HITACHI VANTARA',
    pos: [-3, 54, -126],
    look: [-3, 53.6, -156],
    no: '04',
    code: 'HYD · Hitachi Vantara',
    years: '2021 — Now',
    title: 'Lead Product Designer',
    story:
      "Senior UX Designer to Team Lead of five, shaping five presales engineering tools used by Hitachi's sales engineers worldwide. I built the shared design system that ties them together — build once, use everywhere — and set the review rhythm that keeps the quality bar even across the whole portfolio.",
    chips: ['−35% UI inconsistency', '+20% web conversion', 'Platinum Award'],
  },
  {
    key: 'skills',
    label: 'FLIGHT DECK',
    pos: [3, 55, -158],
    look: [3, 54.7, -188],
    no: '05',
    code: 'The toolkit',
    years: '12+ years',
    title: 'On the flight deck',
    story:
      'Twelve years of instruments: design systems and component libraries, enterprise UX and B2B SaaS, research and prototyping — plus enough HTML, SCSS and JavaScript to talk to engineers in their own language and protect the design through to the last pixel that ships.',
    chips: ['Design systems', 'Enterprise UX', 'Figma', 'Prototyping', 'HTML · SCSS · JS', 'WCAG 2.2', 'Team leadership'],
  },
]

// Shown as a card on the departure runway, before takeoff.
export const BOARDING = {
  flight: 'SD-2026',
  name: 'SAMPRATI DASH',
  role: 'LEAD PRODUCT DESIGNER · 12+ YEARS',
  route: [
    { code: 'KUL', city: 'Kuala Lumpur' },
    { code: 'HYD', city: 'Hyderabad' },
    { code: 'BER', city: 'Berlin / Amsterdam' },
  ],
  tagline: 'Turning "this screen is confusing" into "oh, that\'s easy."',
}

// Shown as a card on the arrival runway, after landing.
export const ARRIVAL = {
  sub: 'NOW ARRIVING · 2026',
  title: 'Berlin / Amsterdam',
  note: 'Open to Lead / Senior Product Design roles',
  email: 'sampratid@gmail.com',
  phone: '+91 95560 95441',
  linkedin: 'linkedin.com/in/sampratidash',
  visa: 'EU Blue Card · NL Highly Skilled Migrant eligible',
  name: 'SAMPRATI DASH',
}

// Camera-only waypoints (no text). The three leading ones (ROLL, TAKEOFF,
// CLIMB) play as an automatic takeoff on first scroll; the trailing FLARE and
// LANDING play as the automatic landing — see App.jsx.
const ROLL = { pos: [0, 1.5, 66], look: [0, 2.6, 40] } // accelerating down the runway, near level
const TAKEOFF = { pos: [0, 1.7, 46], look: [0, 11, 12] } // rotation — nose lifts off
const CLIMB = { pos: [0, 26, 24], look: [0, 45, -2] } // steep climb up through the deck
const FLARE = { pos: [0, 22, -220], look: [0, 5, -246] } // descending back down through the deck
const LANDING = { pos: [0, 1.3, -246], look: [0, -1.4, -274] } // flaring onto the arrival runway

const LEAD = [ROLL, TAKEOFF, CLIMB]
const TAIL = [FLARE, LANDING]

// The full path the camera flies.
export const FLIGHT_PATH = [
  ...LEAD,
  ...TIMELINE.map((s) => ({ pos: s.pos, look: s.look })),
  ...TAIL,
]

// Where each content stop falls along the flight (0..1), so the HUD can name
// the current section as the camera passes it.
export const CONTENT_PROGRESS = TIMELINE.map(
  (_, i) => (LEAD.length + i) / (FLIGHT_PATH.length - 1),
)

// Airport / runway anchor points, shared by the runway, airport and scenery.
export const DEPARTURE_Z = 50 // departure airport centre
export const ARRIVAL_Z = -246 // arrival airport centre

// Z extent of the world, used to scatter clouds and lay the ground.
export const ROAD_START_Z = 72
export const ROAD_END_Z = -284
