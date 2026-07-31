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
export const CRUISE_Y = 68 // high above the deck — the "sea of clouds" cruise

// The cruise sections, shown as floating 3D typography as the camera flies
// through each cluster. A proper portfolio arc: philosophy → experience →
// education → skills → achievements. `pos`/`look` fly the camera; `no`/`hero`/
// `title`/`kicker`/`quote` drive the typography. Boarding & arrival live on the
// runway instead (see BOARDING / ARRIVAL below).
//
// `label` is the HUD section name; `hero` is the big outlined word/years;
// `kicker` is the small tracked label; `quote` is the floating body line.
export const TIMELINE = [
  {
    key: 'philosophy',
    label: 'PHILOSOPHY',
    pos: [0, 66.0, -26],
    look: [1, 67.6, -56],
    no: '01',
    hero: 'CALM',
    title: 'How I work',
    kicker: 'PHILOSOPHY',
    quote:
      'Design-systems-first and mildly obsessed with reuse — build the component once, use it everywhere. I bring 3–4 directions instead of one "final" answer, and I speak to engineers in their own language.',
  },
  {
    key: 'kl',
    label: 'KUALA LUMPUR',
    pos: [4, 68.0, -56],
    look: [4, 67.7, -86],
    no: '02',
    hero: '2012 — 2017',
    title: 'Where it started',
    kicker: 'EXPERIENCE · KUALA LUMPUR',
    quote:
      'From UI and systems work to owning product design across KL — CTI, Optimizer HQ and Wiedu. Cut support tickets 25% and wrote the first design guidelines.',
  },
  {
    key: 'servedeck',
    label: 'SERVEDECK',
    pos: [-4, 70.0, -86],
    look: [-4, 69.6, -116],
    no: '03',
    hero: '2017 — 2020',
    title: 'ServeDeck',
    kicker: 'EXPERIENCE · MANDRILL TECH',
    quote:
      'Senior UI Designer on a smart facility-operations platform, web and mobile. Dense operational data turned into layouts a team can read in seconds. +15% downloads.',
  },
  {
    key: 'teleport',
    label: 'TELEPORT',
    pos: [3, 71.0, -116],
    look: [3, 70.6, -146],
    no: '04',
    hero: '2020 — 2021',
    title: 'Teleport App',
    kicker: 'EXPERIENCE · AIRASIA GROUP',
    quote:
      "Product Designer for AirAsia's logistics arm, mid-pandemic. Mapped the order journey end to end and rebuilt the drop-off points first — drop-off down 30%.",
  },
  {
    key: 'hitachi',
    label: 'HITACHI VANTARA',
    pos: [-3, 68.0, -146],
    look: [-3, 67.6, -176],
    no: '05',
    hero: '2021 — NOW',
    title: 'Lead Product Designer',
    kicker: 'EXPERIENCE · HITACHI VANTARA',
    quote:
      'Senior UX to Team Lead of five, shaping five presales tools worldwide. Built the shared design system that ties them together — UI inconsistency down 35%.',
  },
  {
    key: 'education',
    label: 'EDUCATION',
    pos: [3, 69.0, -176],
    look: [3, 68.7, -206],
    no: '06',
    hero: 'MSc',
    title: 'Software Engineering',
    kicker: 'EDUCATION · 2009 — 2016',
    quote:
      'MSc Computer Software Engineering — Staffordshire University, UK. BSc (Hons) Computer Games Development — Asia Pacific University, Malaysia. A build-first foundation under the design.',
  },
  {
    key: 'skills',
    label: 'SKILLS',
    pos: [-3, 70.0, -206],
    look: [-3, 69.6, -236],
    no: '07',
    hero: 'TOOLKIT',
    title: 'On the flight deck',
    kicker: 'SKILLS · THE TOOLKIT',
    quote:
      'Design systems & component libraries · enterprise UX and B2B SaaS · Figma, prototyping, research · HTML · SCSS · JavaScript · WCAG 2.2 · leading and mentoring designers.',
  },
  {
    key: 'achievements',
    label: 'ACHIEVEMENTS',
    pos: [2, 68.0, -236],
    look: [2, 67.7, -266],
    no: '08',
    hero: 'PLATINUM',
    title: 'Kaitakusha Seishin',
    kicker: 'ACHIEVEMENTS · HITACHI AWARD',
    quote:
      "Hitachi's Platinum Award for outstanding contribution to large-scale web UX. A design system that cut inconsistency 35% and lifted conversion 20%; Teleport drop-off down 30%.",
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
const FLARE = { pos: [0, 22, -268], look: [0, 5, -294] } // descending back down through the deck
const LANDING = { pos: [0, 1.3, -294], look: [0, -1.4, -322] } // flaring onto the arrival runway

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
export const ARRIVAL_Z = -292 // arrival airport centre

// Z extent of the world, used to scatter clouds and lay the ground.
export const ROAD_START_Z = 72
export const ROAD_END_Z = -336
