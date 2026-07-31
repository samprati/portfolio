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
    kicker: 'THE PHILOSOPHY',
    quote:
      '12+ years turning “this screen is confusing” into “oh, that’s easy.” Design-systems-first and obsessed with reuse — build the component once, use it everywhere. I bring 3–4 directions instead of one “final” answer, treat every stakeholder meeting as free research, and talk to engineers in their own language — HTML, SCSS, JavaScript.',
  },
  {
    key: 'kl',
    label: 'KUALA LUMPUR',
    pos: [4, 68.0, -56],
    look: [4, 67.7, -86],
    no: '02',
    hero: '2012 — 2017',
    title: 'Where it started',
    kicker: 'THE EARLY YEARS · KUALA LUMPUR',
    quote:
      'Five roles across Kuala Lumpur — UI Designer & System Engineer at CTI, Senior UI at Optimizer HQ, then Product Designer at Wiedu. Streamlined delivery by 20%, lifted engagement 15%, cut support tickets 25% with clearer navigation, and wrote the first shared UI components and design guidelines.',
  },
  {
    key: 'servedeck',
    label: 'SERVEDECK',
    pos: [-4, 70.0, -86],
    look: [-4, 69.6, -116],
    no: '03',
    hero: '2017 — 2020',
    title: 'ServeDeck',
    kicker: 'SENIOR UI · MANDRILL TECH',
    quote:
      'Senior UI Designer at Mandrill Tech, leading UX/UI and interaction design for ServeDeck — a smart facility-operations platform across web and mobile. Owned the full cycle from personas and journeys to high-fidelity specs, turned dense operational data into layouts teams read in seconds, and built shared patterns. Downloads +15%, satisfaction +10%.',
  },
  {
    key: 'teleport',
    label: 'TELEPORT',
    pos: [3, 71.0, -116],
    look: [3, 70.6, -146],
    no: '04',
    hero: '2020 — 2021',
    title: 'Teleport App',
    kicker: 'PRODUCT DESIGN · AIRASIA GROUP',
    quote:
      'Product Designer for Teleport, AirAsia’s logistics arm, through its rapid pandemic-era expansion. Designed the order-placement experience, mapped the full order journey end to end and rebuilt the drop-off points first — all within a shared design-system framework. Efficiency +25%, drop-off −30%, mockup delivery time −20%.',
  },
  {
    key: 'hitachi',
    label: 'HITACHI VANTARA',
    pos: [-3, 68.0, -146],
    look: [-3, 67.6, -176],
    no: '05',
    hero: '2021 — NOW',
    title: 'Lead Product Designer',
    kicker: 'LEADING DESIGN · HITACHI VANTARA',
    quote:
      'From Senior UX Designer to Team Lead of five. As design authority I redesigned the web channel — conversion +20%, retention +20% — then took the lead across five worldwide presales tools: storage sizing, TCO calculation and infrastructure monitoring. Built and maintain the shared design system and tokens that tie them together — UI inconsistency −35%.',
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
      'MSc Computer Software Engineering — Staffordshire University, UK (2014–2016). BSc (Hons) Computer Games Development — Asia Pacific University, Malaysia, CGPA 3.1 (2009–2012). A build-first foundation sitting under the design.',
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
      'Design systems & component libraries · enterprise UX · B2B SaaS · interaction design · information architecture · wireframing, prototyping, usability & A/B testing · user research · WCAG 2.2. Figma, Adobe XD, Sketch, After Effects, Miro, Jira and generative-AI workflows. HTML5, CSS/SCSS, JavaScript. Leading & mentoring 5 designers, design ops and Scrum delivery.',
  },
  {
    key: 'work',
    label: 'SELECTED WORK',
    pos: [3, 69.0, -236],
    look: [3, 68.7, -266],
    no: '08',
    hero: 'WORK',
    title: 'Selected Work',
    kicker: 'THINGS I’VE BUILT ON THE SIDE',
    quote: 'Three projects beyond the day job — keep scrolling to open them up.',
  },
  {
    // Showcase leg — the SkyType text is suppressed for this one (showcase:true);
    // the HUD renders the three big, clickable project cards instead.
    key: 'work-showcase',
    label: 'PROJECT SHOWCASE',
    pos: [-3, 70.0, -266],
    look: [-3, 69.7, -296],
    no: '08',
    showcase: true,
    hero: '',
    title: '',
    kicker: '',
    quote: '',
  },
  {
    key: 'achievements',
    label: 'ACHIEVEMENTS',
    pos: [2, 68.0, -296],
    look: [2, 67.7, -326],
    no: '09',
    hero: 'PLATINUM',
    title: 'Kaitakusha Seishin',
    kicker: 'ACHIEVEMENTS · HITACHI AWARD',
    quote:
      'Hitachi’s Platinum Award — Kaitakusha Seishin — for outstanding contribution to large-scale web UX, the highest individual recognition. Next Design System collaborator across multiple platforms, and certified in generative AI for design (Growth School). English (fluent) · Hindi (native).',
  },
]

// The three side projects. Shown as a preview gallery on the SELECTED WORK leg
// and as big, clickable cards on the PROJECT SHOWCASE leg — clicking opens the
// detail modal (see FlightHUD). PLACEHOLDER content: swap `href` for the real
// links, drop images at /work/*.webp (set `img: '/work/xxx.webp'`), and edit
// year / role / summary / highlights to match the real projects.
export const WORKS = [
  {
    title: 'Design System Kit',
    tag: 'Components · Tokens',
    year: '2023',
    role: 'Design Systems',
    href: '#',
    accent: ['#0b5fb8', '#4fd6ff'],
    img: null,
    summary:
      'A reusable component and token library built to end the redraw-the-same-button-twice problem — one source of truth for UI across products.',
    highlights: ['80+ documented components', 'Light / dark theming via design tokens', 'Faster, cleaner developer handoff'],
  },
  {
    title: 'Logistics Flow Study',
    tag: 'UX Case Study',
    year: '2021',
    role: 'UX Research & Design',
    href: '#',
    accent: ['#6a3df0', '#c9a9ff'],
    img: null,
    summary:
      'An end-to-end study of a logistics order journey — mapping where users struggle and reworking the highest-friction steps first.',
    highlights: ['Full journey map, persona-driven', 'Rebuilt the drop-off screens first', 'Prototype tested with real users'],
  },
  {
    title: 'Facility Ops Dashboard',
    tag: 'Product Design',
    year: '2019',
    role: 'Product & UI Design',
    href: '#',
    accent: ['#e8663d', '#ffc38a'],
    img: null,
    summary:
      'A dashboard concept turning dense operational data into calm, scannable layouts a facility team can read and act on in seconds.',
    highlights: ['Data-dense yet readable layouts', 'Web + mobile shared patterns', 'Clear states, alerts and hierarchy'],
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
const FLARE = { pos: [0, 22, -328], look: [0, 5, -354] } // descending back down through the deck
const LANDING = { pos: [0, 1.3, -354], look: [0, -1.4, -382] } // flaring onto the arrival runway

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
export const ARRIVAL_Z = -352 // arrival airport centre

// Z extent of the world, used to scatter clouds and lay the ground.
export const ROAD_START_Z = 72
export const ROAD_END_Z = -396
