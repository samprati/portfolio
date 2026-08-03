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
      'For 12+ years I’ve turned “this screen is confusing” into “oh, that’s easy.” I refuse the obvious answer and design for the real cause, never the symptom. Systems-first and obsessed with reuse — I build a component once and use it everywhere, so consistency is structural, not manual. I bring three or four directions instead of one “final” answer, treat every stakeholder meeting as free research, and speak engineers’ language — HTML, SCSS, JavaScript — so what I design actually ships.',
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
    hero: 'BSc (Hons)',
    title: 'Computer Games Development',
    kicker: 'EDUCATION · 2009 — 2016',
    quote:
      'BSc (Hons) Computer Games Development — Asia Pacific University, Malaysia (CGPA 3.1), 2009–2012 — where the build-first foundation under my design began.',
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
      'CRAFT — design systems & component libraries · enterprise & B2B SaaS product design · interaction design · information architecture · wireframing & user flows · prototyping · usability & A/B testing · user research (personas, journey mapping) · responsive & mobile-first · accessibility (WCAG 2.2, European Accessibility Act).\nTOOLS — Figma (advanced), FigJam, Adobe XD, Sketch, After Effects, Miro, Notion, Jira, and generative-AI workflows.\nENGINEERING — HTML5, CSS/SCSS, JavaScript, design tokens and developer handoff.\nLEADERSHIP — mentoring a team of 5, design ops & review processes, stakeholder management, agile/Scrum delivery.',
  },
  {
    // Work leg — SkyType text suppressed (hudOnly); the HUD renders the three
    // project cards that grow on hover and open a detail modal on click.
    key: 'work',
    label: 'SELECTED WORK',
    pos: [3, 69.0, -236],
    look: [3, 68.7, -266],
    no: '08',
    hudOnly: true,
    hero: '',
    title: '',
    kicker: '',
    quote: '',
  },
  {
    // Process leg — SkyType suppressed (hudOnly); the HUD renders a panel styled
    // like the loading screen (checklist cards) — see PROCESS / FlightHUD.
    key: 'process',
    label: 'HOW I WORK',
    pos: [-3, 70.0, -266],
    look: [-3, 69.7, -296],
    no: '09',
    hudOnly: true,
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
    no: '10',
    hero: 'PLATINUM',
    title: 'Kaitakusha Seishin',
    kicker: 'ACHIEVEMENTS · HITACHI AWARD',
    quote:
      'Hitachi’s Platinum Award — Kaitakusha Seishin — for outstanding contribution to large-scale web UX, the highest individual recognition. Next Design System collaborator across multiple platforms, and certified in generative AI for design (Growth School). English (fluent) · Hindi (native).',
  },
]

// Selected side projects — shown on the SELECTED WORK leg as cards that grow on
// hover; clicking opens the detail modal (see FlightHUD). The first is real (the
// Pet-Med case study, linked to the doc); swap the others for real links/images
// (drop images at /work/*.webp and set `img: '/work/xxx.webp'`).
export const WORKS = [
  {
    title: 'The Missed Dose',
    tag: 'Product Case Study',
    year: '2025',
    role: 'Sole Designer',
    href: '/case_study/Pet_Med_Case_Study_Samprati.docx',
    accent: ['#0b5fb8', '#4fd6ff'],
    img: null,
    summary:
      'Rethinking pet-medication management by designing for friction, not forgetting — a shared, quiet, refill-aware care tool. Built to be scrutinised: reasoning, research and assumptions kept honestly apart.',
    highlights: ['Reframed the core problem, not the symptom', 'Coordination without surveillance', 'Design-system-first, WCAG 2.2'],
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

// "How I work" — my philosophy + the steps I run to get work done. Distilled
// from the way I approached the Pet-Med case study. Rendered on the HOW I WORK
// leg (see FlightHUD).
export const PROCESS = {
  philosophy:
    'I refuse the obvious answer. Before designing anything I ask why the problem really happens — then design for the real cause, for the real person, and stay honest about what I know versus what I’m still assuming.',
  steps: [
    ['Reframe the problem', 'Challenge the default assumption and diagnose where the experience actually breaks — not the symptom everyone’s already solving.'],
    ['Design for the real user', 'Decide who it’s truly for. That one choice rewrites every decision downstream.'],
    ['Separate fact from assumption', 'Keep reasoning, research and flagged assumptions visibly apart — each with how I’d validate it.'],
    ['Decide with trade-offs', 'Weigh the options, choose, and own the cost. Why over what.'],
    ['Build the system, not screens', 'Tokens, reusable components and accessibility (WCAG 2.2) so the calm is structural, not styling.'],
    ['Validate honestly', 'Say what I’d test and what’s still a hypothesis — knowing the difference is the job.'],
  ],
  caseStudy: { label: 'READ THE FULL CASE STUDY', href: '/case_study/Pet_Med_Case_Study_Samprati.docx' },
}

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
  bio:
    'I lead a team of five product designers at Hitachi Vantara, shaping B2B SaaS and enterprise tools used by sales engineers worldwide. Design-systems-first and obsessed with reuse, I turn complex, data-heavy products into calm, usable experiences — and I speak engineers’ language (HTML, SCSS, JavaScript).',
  meta: [
    ['LOCATION', 'Hyderabad, India → Berlin / Amsterdam'],
    ['OPEN TO', 'Lead / Senior Product Design roles'],
    ['VISA', 'EU Blue Card · NL Highly Skilled Migrant eligible'],
  ],
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
