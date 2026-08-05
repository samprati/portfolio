import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  TIMELINE,
  CONTENT_PROGRESS,
  FLIGHT_PATH,
  CRUISE_Y,
  BOARDING,
  ARRIVAL,
  WORKS,
  PROCESS,
} from '../data/timeline.js'
import useIsMobile from '../hooks/useIsMobile.js'
import PassCard, { pp } from './PassCard.jsx'
import { getDestination } from '../data/destination.js'
import './glass.css'

// placement + content styles for the boarding / arrival passes
const hudCard = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', transition: 'opacity 0.5s ease' }
const route = { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 26, margin: '4px 0 18px' }
const routeItem = { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }
const routeCode = { fontFamily: "'SF Mono', ui-monospace, monospace", fontSize: 28, fontWeight: 700, color: '#0b5fb8', letterSpacing: 1 }
const routeCity = { fontSize: 10.5, letterSpacing: 1.2, color: '#6a7788', textTransform: 'uppercase' }
const routeArrow = { position: 'absolute', right: -19, top: 8, color: '#0b5fb8', fontSize: 13 }
const tagline = { fontSize: 16, fontStyle: 'italic', color: '#39485a', lineHeight: 1.5, textAlign: 'center' }
const arriveContact = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, fontSize: 17 }
const flyAgainBtn = {
  fontFamily: "'PP Gosha Sans', sans-serif",
  fontWeight: 700,
  fontSize: 14,
  letterSpacing: 2,
  color: '#fff',
  background: '#0b5fb8',
  border: 0,
  borderRadius: 10,
  padding: '12px 22px',
  cursor: 'pointer',
}

// --- tuning ---------------------------------------------------------------
const FEET_PER_UNIT = 640 // world Y units → altitude in feet (cruise ≈ 33k ft)
const GROUND_EYE_Y = 1.5 // camera height when parked, so the runway reads 0 ft
const TAPE_H = 300 // visible height of each vertical tape, px
const ALT_PPF = 300 / 40000 // px per foot  (0..40,000 ft spans the tape)
const SPD_PPK = 300 / 560 // px per knot  (0..560 kt spans the tape)
const N = FLIGHT_PATH.length
const START_T = CONTENT_PROGRESS[0] // first cloud leg
const END_T = CONTENT_PROGRESS[CONTENT_PROGRESS.length - 1] // last cloud leg
// where the SELECTED WORK leg sits along the flight, and one leg's spacing —
// used to fly the work cards past the camera (grow → pass → fade)
const WORK_P = CONTENT_PROGRESS[TIMELINE.findIndex((l) => l.key === 'work')]
const SEG_W = 1 / (N - 1)

const clamp01 = (v) => Math.min(1, Math.max(0, v))

// linear-interpolate the camera Y along the flight path at scroll progress p
function altYAt(p) {
  const seg = Math.min(N - 1, Math.max(0, p)) * (N - 1)
  const i = Math.min(N - 2, Math.floor(seg))
  const f = seg - i
  return FLIGHT_PATH[i].pos[1] + (FLIGHT_PATH[i + 1].pos[1] - FLIGHT_PATH[i].pos[1]) * f
}

const fmt = (n) => Math.round(n).toLocaleString('en-US')

// small stroke icons for the ticket fields (site-blue), matching the reference
const TK_ICONS = {
  date: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  exp: 'M4 8h16v11H4zM9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2',
  team: 'M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M21 20v-2a4 4 0 0 0-3-3.87',
  gate: 'M3 21V5a2 2 0 0 1 2-2h9v18M14 9h6v12M8 12h.01',
  seat: 'M5 11V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5M4 11h12a2 2 0 0 1 2 2v5H6a2 2 0 0 1-2-2zM6 18v2M18 18v2',
  from: 'M2 22h20M4 16l16-4M6 11l3-1 1-6 2-.5 1 5 5-1.5',
  to: 'M2 22h20M20 16L4 12M18 11l-3-1-1-6-2-.5-1 5-5-1.5',
}
function TkIcon({ name, color = '#0b5fb8', size = 14 }) {
  const d = TK_ICONS[name]
  if (!d) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 auto' }}>
      <path d={d} />
    </svg>
  )
}

// a dotted world map (rough continents) behind the route — echoes the reference
function TicketMap({ tint = '#2f8fef' }) {
  return (
    <svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" style={s.tkMapSvg} aria-hidden="true">
      <defs>
        <pattern id="tk-dots" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="2.4" cy="2.4" r="2" fill={tint} />
        </pattern>
      </defs>
      <g fill="url(#tk-dots)">
        {/* North America */}
        <path d="M150 70 L270 78 L300 120 L275 155 L305 175 L250 205 L200 235 L168 212 L150 172 L120 150 L142 108 Z" />
        {/* Greenland */}
        <path d="M320 58 L366 70 L352 112 L320 100 Z" />
        {/* South America */}
        <path d="M255 268 L308 258 L326 305 L300 385 L272 432 L250 398 L242 338 Z" />
        {/* Europe */}
        <path d="M470 108 L548 104 L566 142 L520 162 L480 150 L462 128 Z" />
        {/* Africa */}
        <path d="M482 182 L566 180 L588 244 L560 322 L520 362 L500 320 L480 250 Z" />
        {/* Asia */}
        <path d="M560 80 L826 92 L864 142 L822 182 L742 192 L682 182 L622 202 L582 162 L560 120 Z" />
        {/* India */}
        <path d="M642 190 L684 186 L672 232 L650 238 Z" />
        {/* SE Asia + Indonesia */}
        <path d="M744 200 L794 210 L784 242 L752 236 Z" />
        <path d="M762 256 L856 262 L846 288 L772 282 Z" />
        {/* Australia */}
        <path d="M782 322 L864 326 L874 378 L812 392 L772 362 Z" />
        {/* Japan */}
        <path d="M866 150 L882 162 L876 188 L858 176 Z" />
      </g>
    </svg>
  )
}

const STUB_W = 250 // ticket stub width (also used to punch the perforation notches)

// the "S" brand mark (public/logo.svg) inlined so it can take a brand color
function BrandLogo({ size = 22, color = '#4fd6ff' }) {
  return (
    <svg width={(size * 251) / 226} height={size} viewBox="0 0 251 226" fill="none" style={{ filter: 'drop-shadow(0 1px 6px rgba(0,0,0,0.4))' }} aria-hidden="true">
      <path
        d="M233.149 101.592H35.7158V35.459H166.89C193.575 35.459 215.27 57.0122 215.27 83.4906H250.986C251 37.4655 213.277 0 166.89 0H17.865C7.99966 0 0 7.94213 0 17.7365V119.328C0 129.123 7.99966 137.065 17.865 137.065H215.284V142.509C215.284 169.002 193.575 190.541 166.905 190.541H35.7158V153.258H0V208.278C0 218.072 7.99966 226.014 17.865 226.014H166.905C213.277 226.014 251.014 188.548 251.014 142.509V119.328C251.014 109.534 243.015 101.592 233.149 101.592Z"
        fill={color}
      />
    </svg>
  )
}

export default function FlightHUD({ progressRef, navRef, uiLockRef, onFlyAgain }) {
  const isMobile = useIsMobile()
  const [section, setSection] = useState('BOARDING')
  const [hint, setHint] = useState('takeoff') // 'takeoff' | 'land' | null
  const [nav, setNav] = useState({ label: '', turn: false }) // "turning to leg —" note
  const [openWork, setOpenWork] = useState(null) // index of the project in the detail modal
  const [hoveredWork, setHoveredWork] = useState(null) // hovered project card (grows)
  const [showHelp, setShowHelp] = useState(false) // "how to fly" guide
  const openWorkRef = useRef(null)
  useEffect(() => { openWorkRef.current = openWork }, [openWork])

  // lock scroll-navigation while any modal is open
  useEffect(() => {
    if (uiLockRef) uiLockRef.current = openWork !== null || showHelp
  }, [openWork, showHelp, uiLockRef])

  // personalise the final leg to the visitor's region: KUL → HYD → <you>.
  // India visitors already end at Hyderabad, so the route stays KUL → HYD.
  const dest = useMemo(getDestination, [])
  const routeStops = useMemo(
    () =>
      dest.code === 'IND'
        ? BOARDING.route.slice(0, 2)
        : [...BOARDING.route.slice(0, -1), { code: dest.code, city: dest.city }],
    [dest],
  )
  const lastLeg = routeStops[routeStops.length - 1]

  // DOM refs updated every frame (kept out of React state for smoothness)
  const altStrip = useRef(null)
  const altVal = useRef(null)
  const spdStrip = useRef(null)
  const spdVal = useRef(null)
  const vsVal = useRef(null)
  const vsArrow = useRef(null)
  const fpv = useRef(null)
  const fillRef = useRef(null)
  const boardingRef = useRef(null)
  const arrivalRef = useRef(null)
  const workWrapRef = useRef(null)

  // pre-render the static tape scales once
  const altTicks = useMemo(() => {
    const t = []
    for (let ft = 0; ft <= 40000; ft += 2000) t.push(ft)
    return t
  }, [])
  const spdTicks = useMemo(() => {
    const t = []
    for (let kt = 0; kt <= 560; kt += 40) t.push(kt)
    return t
  }, [])

  // pointer, for the 3D parallax tilt on the boarding / arrival pass
  const mouse = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    let raf
    const state = { t: performance.now(), p: 0, altFt: 0, kts: 135, vs: 0 }

    const tick = (now) => {
      const dt = Math.min(0.1, Math.max(0.0001, (now - state.t) / 1000))
      state.t = now

      const p = Math.min(1, Math.max(0, progressRef.current))
      const dp = (p - state.p) / dt // scroll velocity (progress/sec)
      state.p = p

      const y = altYAt(p)
      const altFt = Math.max(0, (y - GROUND_EYE_Y) * FEET_PER_UNIT)

      // vertical speed (ft/min), smoothed
      const vsRaw = ((altFt - state.altFt) / dt) * 60
      state.vs += (vsRaw - state.vs) * (1 - Math.exp(-dt * 4))
      state.altFt = altFt

      // airspeed: a cruise value that rises with altitude, plus a boost from
      // how fast you're scrolling — so it always feels alive, faster in motion
      const normAlt = Math.min(1.12, Math.max(0, y / CRUISE_Y))
      const target = 135 + normAlt * 370 + Math.min(120, Math.abs(dp) * 260)
      state.kts += (target - state.kts) * (1 - Math.exp(-dt * 2.2))

      // drive the DOM
      // numbers increase up the tape; as the value rises the strip slides
      // DOWN so the current value stays on the center line
      if (altStrip.current) altStrip.current.style.transform = `translateY(${altFt * ALT_PPF - TAPE_H / 2}px)`
      if (altVal.current) altVal.current.textContent = fmt(altFt)
      if (spdStrip.current) spdStrip.current.style.transform = `translateY(${state.kts * SPD_PPK - TAPE_H / 2}px)`
      if (spdVal.current) spdVal.current.textContent = fmt(state.kts)
      if (vsVal.current) vsVal.current.textContent = `${state.vs >= 0 ? '+' : '−'}${fmt(Math.abs(state.vs))}`
      if (vsArrow.current) {
        vsArrow.current.textContent = state.vs > 60 ? '▲' : state.vs < -60 ? '▼' : '■'
        vsArrow.current.style.color = state.vs > 60 ? '#6bffb0' : state.vs < -60 ? '#ff9d6b' : '#9fb3c8'
      }
      if (fpv.current) {
        // flight-path marker rises when climbing, drops when descending
        const shift = Math.max(-46, Math.min(46, -state.vs * 0.006))
        fpv.current.style.transform = `translate(-50%, calc(-50% + ${shift}px))`
      }
      if (fillRef.current) fillRef.current.style.width = `${p * 100}%`

      // ground cards: boarding fades out as we take off, arrival fades in as
      // we touch down
      const boardO = clamp01((0.06 - p) / 0.05)
      const arriveO = clamp01((p - 0.965) / 0.03)
      // 3D parallax tilt driven by the mouse — gives the pass real depth
      const rx = (-mouse.current.y * 7).toFixed(2)
      const ry = (mouse.current.x * 10).toFixed(2)
      const tf = `translate(-50%, -50%) perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg)`
      // moving specular highlight position (for the glossy 3D glare)
      const mx = (50 + mouse.current.x * 42).toFixed(1) + '%'
      const my = (38 + mouse.current.y * 42).toFixed(1) + '%'
      if (boardingRef.current) {
        boardingRef.current.style.opacity = boardO
        boardingRef.current.style.transform = tf
        boardingRef.current.style.setProperty('--mx', mx)
        boardingRef.current.style.setProperty('--my', my)
        boardingRef.current.style.pointerEvents = boardO > 0.5 ? 'auto' : 'none'
      }
      if (arrivalRef.current) {
        arrivalRef.current.style.opacity = arriveO
        arrivalRef.current.style.transform = tf
        arrivalRef.current.style.setProperty('--mx', mx)
        arrivalRef.current.style.setProperty('--my', my)
        arrivalRef.current.style.pointerEvents = arriveO > 0.5 ? 'auto' : 'none'
      }

      // section label: BOARDING on the runway, DESTINATION once we're down,
      // otherwise the nearest cloud leg
      let label
      if (p < START_T - 0.06) label = 'BOARDING'
      else if (p > END_T + 0.02) label = 'DESTINATION'
      else {
        let best = 0
        let bd = Infinity
        for (let i = 0; i < CONTENT_PROGRESS.length; i++) {
          const d = Math.abs(CONTENT_PROGRESS[i] - p)
          if (d < bd) {
            bd = d
            best = i
          }
        }
        label = TIMELINE[best].label
      }
      setSection((prev) => (prev !== label ? label : prev))
      const nextHint = p < 0.05 ? 'takeoff' : p > END_T - 0.03 && p < END_T + 0.015 ? 'land' : null
      setHint((prev) => (prev !== nextHint ? nextHint : prev))

      // fly the SELECTED WORK cards past the camera, like a real 3D leg: as the
      // flight nears WORK_P they scale up from far and fade in; as it passes,
      // they keep growing (through the camera) and blur/fade out.
      if (workWrapRef.current) {
        const d = p - WORK_P // signed progress distance from the leg
        const W = SEG_W * 0.92
        const near = Math.max(0, 1 - Math.abs(d) / W)
        const op = near * near // sharper falloff so they're only "here" at the leg
        const scale = 1 + (d / W) * 0.6 // <1 approaching, >1 passing through
        const el = workWrapRef.current
        el.style.opacity = op
        el.style.transform = `translate(-50%, -50%) scale(${Math.max(0.3, scale).toFixed(3)})`
        el.style.filter = op < 0.92 ? `blur(${((1 - op) * 6).toFixed(1)}px)` : 'none'
        el.style.pointerEvents = op > 0.85 && openWorkRef.current === null ? 'auto' : 'none'
      }

      // "turning to leg —" note while a transition is in progress
      const nv = navRef && navRef.current
      const nl = nv && nv.moving ? nv.label : ''
      const nt = nv && nv.moving ? nv.turn : false
      setNav((prev) => (prev.label !== nl || prev.turn !== nt ? { label: nl, turn: nt } : prev))

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progressRef])

  return (
    <div style={s.wrap}>
      {/* BOARDING — airline-ticket, before takeoff */}
      <div
        ref={boardingRef}
        className="glass-anim"
        style={{
          ...s.ticket,
          ...(isMobile ? s.ticketMobile : { ...s.ticketNotch }),
          opacity: 1,
        }}
      >
        {/* main panel */}
        <div style={{ ...s.tkMain, ...(isMobile ? { padding: '22px 22px' } : null) }}>
          <TicketMap />
          <div style={s.tkBrandRow}>
            <span style={s.tkBrand}>FLIGHT {BOARDING.flight}</span>
            <span style={s.tkBrandSub}>PRODUCT DESIGN</span>
          </div>
          <div style={{ ...s.tkRoute, ...(isMobile ? { fontSize: 'clamp(26px, 9vw, 40px)', gap: 12 } : null) }}>
            <span>{routeStops[0].city}</span>
            <span style={s.tkRoutePlane}>✈</span>
            <span>{lastLeg.city}</span>
          </div>
          <div style={s.tkPax}>
            <img src="/profile_samprati.jpeg" alt="Samprati Dash" style={s.tkAvatar} />
            <div style={{ minWidth: 0 }}>
              <div style={s.tkPaxName}>{BOARDING.name}</div>
              <div style={s.tkPaxSub}>{BOARDING.role}</div>
            </div>
          </div>
          <div style={s.tkTagline}>“{BOARDING.tagline}”</div>
          <div style={s.tkFields}>
            {[
              ['date', 'DATE', '01 JAN'],
              ['exp', 'EXPERIENCE', '12+ YRS'],
              ['team', 'TEAM', '5 DESIGNERS'],
              ['gate', 'GATE', 'A12'],
              ['seat', 'SEAT', '1A'],
            ].map(([icon, k, v]) => (
              <div key={k} style={s.tkField}>
                <TkIcon name={icon} size={12} />
                <span style={s.tkFieldCol}>
                  <span style={s.tkFieldKey}>{k}</span>
                  <span style={s.tkFieldVal}>{v}</span>
                </span>
              </div>
            ))}
            <div style={s.tkStatus}>
              <span style={s.tkStatusIcon}>!</span>
              <span>
                <span style={s.tkStatusKey}>STATUS</span>
                <span style={s.tkStatusVal}>OPEN TO WORK</span>
              </span>
            </div>
          </div>
        </div>

        {/* perforation line */}
        <div style={{ ...s.tkPerf, ...(isMobile ? s.tkPerfMobile : null) }} />

        {/* tear-off stub */}
        <div style={{ ...s.tkStub, ...(isMobile ? s.tkStubMobile : null) }}>
          <div style={s.tkStubHead}>
            <div style={s.tkStubName}>{BOARDING.name}</div>
            <div style={s.tkStubNo}>BOARDING PASS · {BOARDING.flight}</div>
          </div>
          <div style={s.tkStubBody}>
            <div style={s.tkStubRow}>
              <span style={s.tkStubKeyRow}><TkIcon name="from" size={13} /> FROM</span>
              <span style={s.tkStubVal}>{routeStops[0].city}, Malaysia</span>
            </div>
            <div style={s.tkStubRow}>
              <span style={s.tkStubKeyRow}><TkIcon name="to" size={13} /> TO</span>
              <span style={s.tkStubVal}>{dest.isHome ? 'Hyderabad, India' : lastLeg.city}</span>
            </div>
            <div style={s.tkStubRow}>
              <span style={s.tkStubKeyRow}>{dest.visaLabel}</span>
              <span style={s.tkStubVal}>{dest.visa}</span>
            </div>
            <div style={s.tkStubGrid}>
              <div style={s.tkField}><TkIcon name="gate" /><span style={s.tkFieldCol}><span style={s.tkFieldKey}>GATE</span><span style={s.tkFieldVal}>A12</span></span></div>
              <div style={s.tkField}><TkIcon name="seat" /><span style={s.tkFieldCol}><span style={s.tkFieldKey}>SEAT</span><span style={s.tkFieldVal}>1A</span></span></div>
            </div>
            <div style={s.tkBarcode} />
          </div>
        </div>
      </div>

      {/* ARRIVAL — glass card, after landing */}
      <div ref={arrivalRef} className="glass-anim" style={{ ...s.glassCard, ...(isMobile ? s.glassCardMobile : null), opacity: 0 }}>
        <div style={s.glare} />
        <div style={{ ...s.glassInner, ...(isMobile ? s.glassInnerMobile : null) }}>
          <div style={s.gcTop}>
            <span style={s.gcTag}>ARRIVAL</span>
            <span style={s.gcFlight}>{ARRIVAL.sub}</span>
          </div>
          <div style={{ ...s.gcName, fontSize: isMobile ? 30 : 44, marginTop: 8 }}>{dest.city}</div>
          <div style={s.gcRole}>{ARRIVAL.note}</div>
          <div style={s.gcContact}>
            <a href={`mailto:${ARRIVAL.email}`} style={s.gcLink}>{ARRIVAL.email}</a>
            <span style={s.gcDot}>·</span>
            <a href={`tel:${ARRIVAL.phone.replace(/\s/g, '')}`} style={s.gcLink}>{ARRIVAL.phone}</a>
          </div>
          <a href={`https://${ARRIVAL.linkedin}`} target="_blank" rel="noreferrer" style={{ ...s.gcLink, display: 'inline-block', marginTop: 10 }}>
            {ARRIVAL.linkedin}
          </a>
          <div style={s.gcVisa}>{dest.visa}</div>
          <div style={s.gcActions}>
            <button type="button" style={s.gcGhost} onClick={onFlyAgain}>✈ FLY AGAIN TO READ</button>
          </div>
        </div>
      </div>

      {/* top bar */}
      <div style={s.topRow}>
        <span style={s.logoWrap}>
          <BrandLogo size={22} />
          <span style={s.logo}>SAMPRATI DASH</span>
        </span>
        <span style={{ ...s.tail, display: isMobile ? 'none' : 'inline' }}>SD·2026 · KUL → {lastLeg.code}</span>
      </div>

      {/* top-centre controls — how to fly + download CV */}
      <div style={s.topCenter}>
        <button type="button" style={s.pillBtn} onClick={() => setShowHelp(true)}>
          <span style={s.helpDot}>i</span> HOW TO FLY
        </button>
        <a href="/Samprati_Dash_Resume.pdf" download style={{ ...s.pillBtn, ...s.pillBtnAccent }}>
          ↓ DOWNLOAD CV
        </a>
      </div>

      {/* left — ALTITUDE tape (desktop only) */}
      <div style={{ ...s.tape, left: 28, display: isMobile ? 'none' : 'flex' }}>
        <span style={s.tapeLabel}>ALT · FT</span>
        <div style={s.tapeWindow}>
          <div ref={altStrip} style={s.tapeStrip}>
            {altTicks.map((ft) => (
              <div key={ft} style={{ ...s.tick, bottom: ft * ALT_PPF }}>
                <span style={s.tickNum}>{ft / 1000}k</span>
                <span style={s.tickMark} />
              </div>
            ))}
          </div>
          <div style={{ ...s.readout, borderColor: '#6bffb0' }}>
            <span ref={altVal} style={{ ...s.readoutVal, color: '#6bffb0' }}>0</span>
          </div>
          <div style={s.centerLine} />
        </div>
        <div style={s.vsBox}>
          <span style={s.vsLabel}>V/S</span>
          <span ref={vsArrow} style={s.vsArrow}>■</span>
          <span ref={vsVal} style={s.vsVal}>+0</span>
        </div>
      </div>

      {/* right — AIRSPEED tape (desktop only) */}
      <div style={{ ...s.tape, right: 28, alignItems: 'flex-end', display: isMobile ? 'none' : 'flex' }}>
        <span style={s.tapeLabel}>SPD · KTS</span>
        <div style={s.tapeWindow}>
          <div ref={spdStrip} style={s.tapeStrip}>
            {spdTicks.map((kt) => (
              <div key={kt} style={{ ...s.tick, bottom: kt * SPD_PPK, flexDirection: 'row-reverse' }}>
                <span style={s.tickNum}>{kt}</span>
                <span style={s.tickMark} />
              </div>
            ))}
          </div>
          <div style={{ ...s.readout, borderColor: '#ffc24b' }}>
            <span ref={spdVal} style={{ ...s.readoutVal, color: '#ffc24b' }}>135</span>
          </div>
          <div style={s.centerLine} />
        </div>
      </div>

      {/* center — flight-path reticle (hidden on the ground so it doesn't sit over the card) */}
      <div style={{ ...s.reticleWrap, display: section === 'BOARDING' || section === 'DESTINATION' ? 'none' : 'block' }}>
        {/* fixed aircraft waterline */}
        <svg width="220" height="26" style={s.waterline} viewBox="0 0 220 26">
          <path d="M40 13 L92 13 M110 5 L110 21 M128 13 L180 13" stroke="rgba(235,245,255,0.7)" strokeWidth="2" fill="none" />
        </svg>
        {/* moving flight-path vector */}
        <div ref={fpv} style={s.fpv}>
          <svg width="34" height="34" viewBox="0 0 34 34">
            <circle cx="17" cy="17" r="8" stroke="#6bffb0" strokeWidth="2" fill="none" />
            <path d="M17 9 V4 M9 17 H4 M25 17 H30" stroke="#6bffb0" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* transition note — "turning to leg —" while flying between legs */}
      {nav.label && (
        <div style={s.navNote}>
          {nav.turn ? '↰ TURNING TO' : '✈ FLYING TO'} — {nav.label}
        </div>
      )}

      {/* SELECTED WORK — three cards flown past the camera each frame (see the
          workWrapRef logic in the tick): grow in on approach, pass through and
          fade on exit, exactly like the 3D legs. Hover grows a card, click opens. */}
      <div ref={workWrapRef} style={{ ...s.showWrap, ...(isMobile ? s.showWrapMobile : null), opacity: 0 }}>
        <span style={s.showHead}>SELECTED WORK — HOVER, THEN CLICK A PROJECT</span>
        <div style={{ ...s.showRow, ...(isMobile ? { gap: 10 } : null) }}>
          {WORKS.map((w, i) => {
            const hovered = hoveredWork === i
            return (
              <button
                key={w.title}
                type="button"
                onClick={() => setOpenWork(i)}
                onMouseEnter={() => setHoveredWork(i)}
                onMouseLeave={() => setHoveredWork((h) => (h === i ? null : h))}
                style={{
                  ...s.showCard,
                  ...(isMobile ? { width: 'calc((100vw - 44px) / 3)' } : null),
                  transform: hovered ? 'translateY(-8px) scale(1.06)' : 'none',
                  boxShadow: hovered ? '0 30px 70px rgba(3,10,24,0.6)' : s.showCard.boxShadow,
                  borderColor: hovered ? w.accent[1] : BORDER,
                  zIndex: hovered ? 2 : 1,
                }}
              >
                <div
                  style={{
                    ...s.showThumb,
                    ...(isMobile ? { height: 96 } : null),
                    background: w.img
                      ? `center/cover url(${w.img})`
                      : `linear-gradient(135deg, ${w.accent[0]}, ${w.accent[1]})`,
                  }}
                >
                  {!w.img && <span style={s.showThumbInitial}>{w.title.charAt(0)}</span>}
                  <span style={s.showYear}>{w.year}</span>
                </div>
                <div style={s.showMeta}>
                  <span style={s.showTitle}>{w.title}</span>
                  <span style={s.showRole}>{w.role}</span>
                  <span style={s.showSummary}>{w.summary}</span>
                  <span style={{ ...s.showOpen, color: w.accent[1] }}>VIEW DETAILS →</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>


      {/* HOW I WORK — same editorial layout as the other legs (ghost number +
          hero/title/kicker/philosophy on the sky), only the 01–06 items are cards */}
      <div
        style={{
          ...s.procWrap,
          ...(isMobile ? s.procWrapMobile : null),
          opacity: section === 'HOW I WORK' ? 1 : 0,
          pointerEvents: section === 'HOW I WORK' ? 'auto' : 'none',
          transform: `translate(-50%, -50%) translateY(${section === 'HOW I WORK' ? 0 : 18}px)`,
        }}
      >
        <div style={{ ...s.procGhostCol, ...(isMobile ? { display: 'none' } : null) }}>
          <div style={s.procGhostNum}>09</div>
          <div style={s.procGhostLabel}>leg – 09</div>
        </div>
        <div style={s.procContent}>
          <div style={s.procHero}>PROCESS</div>
          <div style={s.procTitle}>How I get work done</div>
          <div style={s.procKicker}>THE APPROACH · FROM MY CASE STUDY</div>
          <p style={s.procPhil}>{PROCESS.philosophy}</p>
          <div style={s.procList}>
            {PROCESS.steps.map(([t, d], i) => (
              <div key={t} style={s.procRow}>
                <span style={s.procRowIdx}>{String(i + 1).padStart(2, '0')}</span>
                <span style={s.procRowMain}>
                  <span style={s.procRowTitle}>{t}</span>
                  <span style={s.procRowDesc}>{d}</span>
                </span>
                <span style={s.procRowCheck}>✓</span>
              </div>
            ))}
          </div>
          <a href={PROCESS.caseStudy.href} target="_blank" rel="noreferrer" style={s.procCta}>
            {PROCESS.caseStudy.label} ↗
          </a>
        </div>
      </div>

      {/* how-to-fly guide modal */}
      {showHelp && (
        <div style={s.modalOverlay} onClick={() => setShowHelp(false)}>
          <div style={{ ...s.helpCard, ...(isMobile ? s.modalCardMobile : null) }} onClick={(e) => e.stopPropagation()}>
            <div style={s.helpHead}>
              <span style={s.helpKicker}>FLIGHT SD-2026 · CABIN GUIDE</span>
              <h3 style={s.helpTitle}>How to fly this site</h3>
            </div>
            <ul style={s.helpList}>
              {[
                ['⬇', 'Scroll down or swipe up', 'Fly forward to the next chapter of the journey.'],
                ['⬆', 'Scroll up or swipe down', 'Bank into a U-turn and fly back to re-read the previous chapter.'],
                ['🗂', 'Selected Work', 'Hover a project card to grow it, then click to open its full details. Scrolling pauses while it’s open — close it to fly on.'],
                ['🛬', 'The landing', 'Reach the end and the plane lands. Hit “Fly again to read” to restart from take-off.'],
                ['🔊', 'Sound', 'Use SOUND ON / OFF (top-right) to toggle the flight audio.'],
                ['🖱', 'Look around', 'Move your mouse to gently parallax the view as you cruise.'],
              ].map(([icon, t, d]) => (
                <li key={t} style={s.helpItem}>
                  <span style={s.helpIcon}>{icon}</span>
                  <span>
                    <span style={s.helpItemTitle}>{t}</span>
                    <span style={s.helpItemDesc}>{d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div style={s.helpActions}>
              <button type="button" style={s.modalVisit} onClick={() => setShowHelp(false)}>
                GOT IT — LET’S FLY ✈
              </button>
            </div>
          </div>
        </div>
      )}

      {/* project detail modal */}
      {openWork !== null && (
        <div style={s.modalOverlay} onClick={() => setOpenWork(null)}>
          <div style={{ ...s.modalCard, ...(isMobile ? s.modalCardMobile : null) }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                ...s.modalBanner,
                background: WORKS[openWork].img
                  ? `center/cover url(${WORKS[openWork].img})`
                  : `linear-gradient(135deg, ${WORKS[openWork].accent[0]}, ${WORKS[openWork].accent[1]})`,
              }}
            >
              {!WORKS[openWork].img && <span style={s.modalBannerInitial}>{WORKS[openWork].title.charAt(0)}</span>}
              <button type="button" style={s.modalClose} onClick={() => setOpenWork(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div style={s.modalBody}>
              <span style={{ ...s.modalKicker, color: WORKS[openWork].accent[1] }}>
                {WORKS[openWork].role} · {WORKS[openWork].year}
              </span>
              <h3 style={s.modalTitle}>{WORKS[openWork].title}</h3>
              <p style={s.modalSummary}>{WORKS[openWork].summary}</p>
              <ul style={s.modalList}>
                {WORKS[openWork].highlights.map((h) => (
                  <li key={h} style={s.modalListItem}>
                    <span style={{ ...s.modalBullet, background: WORKS[openWork].accent[1] }} />
                    {h}
                  </li>
                ))}
              </ul>
              <div style={s.modalActions}>
                <a
                  href={WORKS[openWork].href}
                  target={WORKS[openWork].href.startsWith('#') ? undefined : '_blank'}
                  rel="noreferrer"
                  style={s.modalVisit}
                >
                  VISIT PROJECT ↗
                </a>
                <button type="button" style={s.modalCloseText} onClick={() => setOpenWork(null)}>
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* bottom bar */}
      <div style={{ ...s.bottomRow, ...(isMobile ? { left: 14, right: 14, gap: 10 } : null) }}>
        <span style={s.section}>
          <span style={s.sectionLabel}>SECTION</span>
          <span style={s.sectionName}>{section}</span>
        </span>
        {hint === 'takeoff' && <span style={s.hint}>▸ SCROLL TO TAKE OFF</span>}
        {hint === 'land' && <span style={s.hint}>▸ SCROLL TO LAND</span>}
        <div style={s.progressTrack}>
          <div ref={fillRef} style={s.progressFill} />
        </div>
      </div>
    </div>
  )
}

const MONO = "'SF Mono', ui-monospace, 'Roboto Mono', Menlo, monospace"
const HEAD = "'PP Gosha Sans', sans-serif"
const GLASS = 'rgba(9,14,22,0.42)'
const BORDER = 'rgba(255,255,255,0.16)'
const INK = '#eaf3ff'

const CARD = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'min(720px, 92vw)',
  background: 'rgba(8,12,20,0.58)',
  border: `1px solid ${'rgba(255,255,255,0.18)'}`,
  borderRadius: 20,
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  boxShadow: '0 28px 80px rgba(0,0,0,0.44)',
  padding: '46px 52px',
  textAlign: 'center',
  transition: 'opacity 0.5s ease',
  willChange: 'opacity',
}

const s = {
  wrap: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 10,
    fontFamily: "'PP Gosha Sans', sans-serif",
    color: INK,
  },

  // shrink the big cards on phones
  cardMobile: { width: '92vw', padding: '28px 22px', borderRadius: 16 },

  // ---- boarding card ----
  boardingCard: { ...CARD, opacity: 1 },
  passTop: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: MONO,
    fontSize: 13,
    letterSpacing: 3,
    color: '#bcd8f5',
    paddingBottom: 18,
    marginBottom: 24,
    borderBottom: '1px dashed rgba(255,255,255,0.22)',
  },
  passFlight: { color: '#6bffb0' },
  passName: {
    fontFamily: "'PP Gosha Sans', sans-serif",
    fontWeight: 800,
    fontSize: 'clamp(40px, 7vw, 62px)',
    letterSpacing: 1,
    lineHeight: 1.03,
  },
  passRole: {
    fontSize: 14,
    letterSpacing: 3,
    color: '#cfe0f2',
    marginTop: 12,
    fontWeight: 700,
  },
  route: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 26,
    margin: '30px 0 26px',
  },
  routeItem: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 },
  routeCode: { fontFamily: MONO, fontSize: 30, fontWeight: 700, letterSpacing: 1 },
  routeCity: { fontSize: 11, letterSpacing: 1.5, color: '#9fb6cc', textTransform: 'uppercase' },
  routeArrow: { position: 'absolute', right: -20, top: 8, color: '#6bffb0', fontSize: 14 },
  passTagline: {
    fontSize: 17,
    fontStyle: 'italic',
    color: '#dce8f4',
    lineHeight: 1.55,
    borderTop: '1px dashed rgba(255,255,255,0.22)',
    paddingTop: 22,
  },

  // ---- arrival card ----
  arrivalCard: { ...CARD, opacity: 0 },
  arriveSub: { fontFamily: MONO, fontSize: 13, letterSpacing: 4, color: '#6bffb0', marginBottom: 14 },
  arriveTitle: {
    fontFamily: "'PP Gosha Sans', sans-serif",
    fontWeight: 800,
    fontSize: 'clamp(38px, 6.5vw, 58px)',
    lineHeight: 1.03,
  },
  arriveNote: { fontSize: 17, color: '#cfe0f2', marginTop: 14, marginBottom: 28 },
  arriveContact: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, fontSize: 18 },
  link: { color: '#eaf3ff', textDecoration: 'none', borderBottom: '1px solid rgba(107,255,176,0.6)', paddingBottom: 1 },
  dot: { color: '#6a7c90' },
  linkedin: { display: 'inline-block', marginTop: 14, fontSize: 16, color: '#bcd8f5' },
  visa: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 2,
    color: '#9fb6cc',
    marginTop: 24,
    paddingTop: 20,
    borderTop: '1px dashed rgba(255,255,255,0.22)',
    textTransform: 'uppercase',
  },
  arriveName: {
    fontFamily: "'PP Gosha Sans', sans-serif",
    fontWeight: 800,
    fontSize: 22,
    letterSpacing: 3,
    marginTop: 18,
    color: '#eaf3ff',
  },

  topRow: {
    position: 'absolute',
    top: 26,
    left: 32,
    right: 32,
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: 700,
    textShadow: '0 1px 12px rgba(0,0,0,0.35)',
  },
  logoWrap: { display: 'inline-flex', alignItems: 'center', gap: 10 },
  logo: { fontFamily: "'PP Gosha Sans', sans-serif", fontWeight: 800 },
  tail: { fontFamily: MONO, letterSpacing: 3, color: '#bcd8f5' },

  // ---- top-centre controls (how to fly + download CV) ----
  topCenter: {
    position: 'absolute',
    top: 18,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 'calc(100vw - 24px)',
  },
  pillBtn: {
    pointerEvents: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: "'PP Gosha Sans', sans-serif",
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: 2,
    color: '#eaf3ff',
    background: 'rgba(9,14,22,0.5)',
    border: `1px solid ${BORDER}`,
    borderRadius: 999,
    padding: '9px 17px',
    cursor: 'pointer',
    textDecoration: 'none',
    backdropFilter: 'blur(12px) saturate(140%)',
    WebkitBackdropFilter: 'blur(12px) saturate(140%)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.18)',
  },
  pillBtnAccent: {
    color: '#062033',
    background: 'linear-gradient(135deg, rgba(107,255,176,0.95), rgba(79,214,255,0.95))',
    border: '1px solid rgba(255,255,255,0.4)',
  },

  // ---- glassmorphism boarding / arrival cards ----
  glassCard: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(720px, 94vw)',
    borderRadius: 26,
    overflow: 'hidden',
    // opaque enough for real text contrast over the bright sky, still glassy
    background: 'linear-gradient(150deg, rgba(17,26,43,0.9), rgba(8,13,24,0.93))',
    border: '1px solid rgba(255,255,255,0.22)',
    boxShadow: '0 40px 110px rgba(3,10,24,0.62), inset 0 1px 0 rgba(255,255,255,0.28)',
    backdropFilter: 'blur(22px) saturate(140%)',
    WebkitBackdropFilter: 'blur(22px) saturate(140%)',
    color: '#eef4fb',
    transition: 'opacity 0.5s ease',
    willChange: 'opacity, transform',
    transformStyle: 'preserve-3d',
  },
  glassCardMobile: { width: '92vw', borderRadius: 20 },
  glare: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    background: 'radial-gradient(circle at var(--mx,50%) var(--my,30%), rgba(255,255,255,0.25), rgba(255,255,255,0.06) 34%, transparent 60%)',
    mixBlendMode: 'soft-light',
  },
  glassInner: { position: 'relative', zIndex: 1, padding: '26px 30px 28px' },
  glassInnerMobile: { padding: '16px 16px 18px', maxHeight: '82vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' },

  // ---- airline ticket (boarding) — site-blue palette ----
  ticket: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(940px, 95vw)',
    display: 'flex',
    borderRadius: 18,
    overflow: 'hidden',
    background: '#fbfcfe',
    color: '#16202e',
    boxShadow: '0 40px 110px rgba(3,10,24,0.55)',
    transition: 'opacity 0.5s ease',
    willChange: 'opacity, transform',
    transformStyle: 'preserve-3d',
  },
  // punch the two perforation notches (top & bottom) at the stub boundary
  ticketNotch: {
    WebkitMaskImage: `radial-gradient(circle 12px at calc(100% - ${STUB_W}px) 0, transparent 11px, #000 11.5px), radial-gradient(circle 12px at calc(100% - ${STUB_W}px) 100%, transparent 11px, #000 11.5px)`,
    WebkitMaskComposite: 'source-in',
    maskImage: `radial-gradient(circle 12px at calc(100% - ${STUB_W}px) 0, transparent 11px, #000 11.5px), radial-gradient(circle 12px at calc(100% - ${STUB_W}px) 100%, transparent 11px, #000 11.5px)`,
    maskComposite: 'intersect',
  },
  ticketMobile: { flexDirection: 'column', width: '93vw', maxHeight: '86vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
  tkMain: { position: 'relative', flex: '1 1 auto', minWidth: 0, padding: '30px 36px', display: 'flex', flexDirection: 'column', gap: 16 },
  tkMapSvg: { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.26, pointerEvents: 'none' },
  tkBrandRow: { position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  tkBrand: { fontFamily: HEAD, fontWeight: 800, fontSize: 17, letterSpacing: 1, color: '#16202e' },
  tkBrandSub: { fontFamily: MONO, fontSize: 11, letterSpacing: 2, color: '#8b97a8' },
  tkRoute: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    flexWrap: 'wrap',
    fontFamily: HEAD,
    fontWeight: 800,
    fontSize: 'clamp(34px, 5vw, 56px)',
    letterSpacing: -1,
    color: '#101826',
    lineHeight: 1.02,
    textTransform: 'uppercase',
  },
  tkRoutePlane: { color: '#0b5fb8', fontSize: '0.72em' },
  tkPax: { position: 'relative', marginTop: 2, display: 'flex', alignItems: 'center', gap: 14 },
  tkAvatar: { width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', flex: '0 0 auto', border: '2px solid rgba(11,95,184,0.35)', boxShadow: '0 6px 16px rgba(3,10,24,0.2)' },
  tkPaxName: { fontFamily: HEAD, fontWeight: 800, fontSize: 24, color: '#16202e', letterSpacing: 0.3 },
  tkPaxSub: { fontFamily: MONO, fontSize: 12, letterSpacing: 1.5, color: '#7e8ba0', marginTop: 4 },
  tkTagline: { position: 'relative', fontStyle: 'italic', fontWeight: 600, fontSize: '1.15rem', lineHeight: 1.4, color: '#33414f' },
  // the fields sit inside a soft glassmorphism card
  tkFields: {
    position: 'relative',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '14px 24px',
    alignItems: 'center',
    marginTop: 4,
    padding: '14px 18px',
    borderRadius: 14,
    background: 'rgba(238,244,251,0.66)',
    border: '1px solid rgba(11,95,184,0.14)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
  },
  tkField: { display: 'flex', alignItems: 'center', gap: 9 },
  tkFieldCol: { display: 'flex', flexDirection: 'column', gap: 2 },
  tkFieldKey: { fontFamily: MONO, fontSize: 10, letterSpacing: 1.4, color: '#8b97a8', textTransform: 'uppercase' },
  tkFieldVal: { fontFamily: HEAD, fontWeight: 700, fontSize: 16, color: '#16202e', letterSpacing: 0.3 },
  tkStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginLeft: 'auto',
    background: 'linear-gradient(135deg, #0b5fb8, #4fd6ff)',
    color: '#fff',
    padding: '9px 16px',
    borderRadius: 11,
    boxShadow: '0 8px 22px rgba(11,95,184,0.4)',
  },
  tkStatusIcon: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', fontWeight: 800, fontSize: 13 },
  tkStatusKey: { display: 'block', fontFamily: MONO, fontSize: 9, letterSpacing: 1.5, opacity: 0.92 },
  tkStatusVal: { display: 'block', fontFamily: HEAD, fontWeight: 800, fontSize: 14, letterSpacing: 0.5 },
  tkPerf: { flex: '0 0 auto', width: 0, borderLeft: '2px dashed rgba(16,32,54,0.28)', margin: '18px 0' },
  tkPerfMobile: { width: 'auto', height: 0, borderLeft: 0, borderTop: '2px dashed rgba(16,32,54,0.28)', margin: '0 18px' },
  tkStub: { flex: `0 0 ${STUB_W}px`, display: 'flex', flexDirection: 'column', background: '#ffffff' },
  tkStubMobile: { flex: '1 1 auto' },
  tkStubHead: { background: 'linear-gradient(135deg, #0b5fb8, #4fd6ff)', color: '#fff', padding: '18px 22px' },
  tkStubName: { fontFamily: HEAD, fontWeight: 800, fontSize: 20 },
  tkStubNo: { fontFamily: MONO, fontSize: 10, letterSpacing: 1.5, opacity: 0.95, marginTop: 4 },
  tkStubBody: { padding: '18px 22px 20px', display: 'flex', flexDirection: 'column', gap: 13 },
  tkStubRow: { display: 'flex', flexDirection: 'column', gap: 4 },
  tkStubKeyRow: { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 10, letterSpacing: 1.4, color: '#8b97a8', textTransform: 'uppercase' },
  tkStubVal: { fontFamily: HEAD, fontWeight: 700, fontSize: 14, color: '#16202e', lineHeight: 1.4 },
  tkStubGrid: { display: 'flex', gap: 30 },
  tkBarcode: {
    height: 46,
    marginTop: 6,
    background: 'repeating-linear-gradient(90deg,#16202e 0,#16202e 2px,transparent 2px,transparent 4px,#16202e 4px,#16202e 7px,transparent 7px,transparent 9px,#16202e 9px,#16202e 10px,transparent 10px,transparent 13px)',
  },
  gcTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2.5,
    color: '#9fc4e8',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottom: '1px dashed rgba(255,255,255,0.2)',
  },
  gcTag: {
    background: 'rgba(79,214,255,0.16)',
    border: '1px solid rgba(79,214,255,0.4)',
    color: '#bfeaff',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 6,
  },
  gcFlight: { color: '#6bffb0' },
  gcHeadRow: { display: 'flex', alignItems: 'center', gap: 18 },
  gcAvatar: {
    width: 78,
    height: 78,
    borderRadius: '50%',
    objectFit: 'cover',
    flex: '0 0 auto',
    border: '2px solid rgba(255,255,255,0.5)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  gcName: {
    fontFamily: "'PP Gosha Sans', sans-serif",
    fontWeight: 800,
    lineHeight: 1.02,
    letterSpacing: 0.4,
    color: '#f4f9ff',
  },
  gcRole: { fontSize: 13, letterSpacing: 1.8, color: '#d7e4f3', fontWeight: 600, marginTop: 8 },
  gcRoute: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    margin: '18px 0',
    padding: '14px 18px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
  },
  gcRouteItem: { display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' },
  gcCode: { fontFamily: MONO, fontSize: 27, fontWeight: 700, color: '#f4f9ff', letterSpacing: 1 },
  gcCity: { fontSize: 11, letterSpacing: 1.4, color: '#b6c8dc', textTransform: 'uppercase' },
  gcConnector: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 44 },
  gcLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.32)' },
  gcPlane: { color: '#6bffb0', fontSize: 15, filter: 'drop-shadow(0 0 6px rgba(107,255,176,0.5))' },
  accentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 2,
    background: 'linear-gradient(90deg, #6bffb0, #4fd6ff, #6a8bff)',
  },
  gcChips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  gcChip: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 1,
    color: '#e2eefa',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 999,
    padding: '6px 12px',
  },
  gcTagline: {
    fontSize: '1.25rem', // 20px
    fontStyle: 'italic',
    fontWeight: 600,
    color: '#eef5fc',
    lineHeight: 1.5,
    paddingTop: 16,
    borderTop: '1px dashed rgba(255,255,255,0.2)',
  },
  gcBio: { fontSize: '1rem', lineHeight: 1.62, color: '#dbe6f3', marginTop: 12 },
  gcMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
    marginTop: 16,
    paddingTop: 15,
    borderTop: '1px dashed rgba(255,255,255,0.2)',
  },
  gcMetaRow: { display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' },
  gcMetaKey: {
    flex: '0 0 auto',
    width: 82,
    fontFamily: MONO,
    fontSize: 10.5,
    letterSpacing: 1.5,
    color: '#6bffb0',
    textTransform: 'uppercase',
  },
  gcMetaVal: { fontSize: '1rem', color: '#eaf2fb', lineHeight: 1.45 },
  gcActions: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginTop: 20 },
  gcPrimary: {
    pointerEvents: 'auto',
    fontFamily: "'PP Gosha Sans', sans-serif",
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: 1.5,
    color: '#062033',
    background: 'linear-gradient(135deg, #6bffb0, #4fd6ff)',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: 12,
    padding: '12px 22px',
    textDecoration: 'none',
    boxShadow: '0 12px 30px rgba(11,95,184,0.35)',
  },
  gcGhost: {
    pointerEvents: 'auto',
    fontFamily: "'PP Gosha Sans', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 1.5,
    color: '#eaf3ff',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.24)',
    borderRadius: 12,
    padding: '12px 20px',
    cursor: 'pointer',
  },
  gcHint: { fontFamily: MONO, fontSize: 11, letterSpacing: 2, color: '#6bffb0', fontWeight: 700 },
  gcContact: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: 15, marginTop: 18 },
  gcLink: { color: '#eaf3ff', textDecoration: 'none', borderBottom: '1px solid rgba(107,255,176,0.6)', paddingBottom: 1, pointerEvents: 'auto' },
  gcDot: { color: '#6a7c90' },
  gcVisa: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
    color: '#9fb6cc',
    marginTop: 18,
    paddingTop: 16,
    borderTop: '1px dashed rgba(255,255,255,0.2)',
    textTransform: 'uppercase',
  },
  helpDot: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    borderRadius: 999,
    background: '#4fd6ff',
    color: '#062033',
    fontFamily: 'Georgia, serif',
    fontStyle: 'italic',
    fontWeight: 700,
    fontSize: 12,
    lineHeight: 1,
  },
  helpCard: {
    width: 'min(520px, 94vw)',
    maxHeight: '88vh',
    overflow: 'auto',
    borderRadius: 22,
    background: 'rgba(11,16,26,0.95)',
    border: `1px solid ${BORDER}`,
    boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
    padding: '26px 28px 28px',
  },
  helpHead: { borderBottom: '1px dashed rgba(255,255,255,0.16)', paddingBottom: 16, marginBottom: 18 },
  helpKicker: { fontFamily: MONO, fontSize: 11, letterSpacing: 2.5, color: '#8fd4ff' },
  helpTitle: { fontFamily: "'PP Gosha Sans', sans-serif", fontWeight: 800, fontSize: 24, color: INK, margin: '8px 0 0' },
  helpList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 15 },
  helpItem: { display: 'flex', alignItems: 'flex-start', gap: 13 },
  helpIcon: {
    flex: '0 0 auto',
    width: 34,
    height: 34,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    background: 'rgba(79,214,255,0.12)',
    border: '1px solid rgba(79,214,255,0.28)',
  },
  helpItemTitle: { display: 'block', fontFamily: "'PP Gosha Sans', sans-serif", fontWeight: 700, fontSize: 14.5, color: INK },
  helpItemDesc: { display: 'block', fontSize: 13, lineHeight: 1.5, color: '#b8c5d6', marginTop: 3 },
  helpActions: { marginTop: 22, display: 'flex', justifyContent: 'center' },

  // vertical tape column, centered on screen height
  tape: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  tapeLabel: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2,
    color: '#bcd8f5',
    opacity: 0.9,
  },
  tapeWindow: {
    position: 'relative',
    width: 92,
    height: TAPE_H,
    overflow: 'hidden',
    background: GLASS,
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    backdropFilter: 'blur(7px)',
    WebkitBackdropFilter: 'blur(7px)',
    maskImage: 'linear-gradient(180deg, transparent, #000 16%, #000 84%, transparent)',
    WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 16%, #000 84%, transparent)',
  },
  tapeStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 0,
    willChange: 'transform',
  },
  tick: {
    position: 'absolute',
    left: 8,
    right: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 0,
    transform: 'translateY(50%)',
  },
  tickNum: { fontFamily: MONO, fontSize: 11, color: 'rgba(234,243,255,0.72)' },
  tickMark: { width: 14, height: 1, background: 'rgba(234,243,255,0.4)' },

  // center readout chip that overlays the tape
  readout: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    minWidth: 78,
    padding: '5px 4px',
    textAlign: 'center',
    background: 'rgba(4,7,12,0.72)',
    border: '1px solid',
    borderRadius: 6,
    boxShadow: '0 0 18px rgba(0,0,0,0.35)',
  },
  readoutVal: { fontFamily: MONO, fontSize: 19, fontWeight: 700, letterSpacing: 1, fontVariantNumeric: 'tabular-nums' },
  centerLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    background: 'rgba(255,255,255,0.25)',
  },

  vsBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 9px',
    background: GLASS,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    backdropFilter: 'blur(7px)',
    WebkitBackdropFilter: 'blur(7px)',
  },
  vsLabel: { fontFamily: MONO, fontSize: 9, letterSpacing: 1.5, color: '#bcd8f5' },
  vsArrow: { fontSize: 10, color: '#9fb3c8' },
  vsVal: { fontFamily: MONO, fontSize: 12, fontVariantNumeric: 'tabular-nums', color: INK, minWidth: 52 },

  reticleWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    width: 220,
    height: 60,
  },
  waterline: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' },
  fpv: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    willChange: 'transform',
    filter: 'drop-shadow(0 0 6px rgba(107,255,176,0.5))',
  },

  bottomRow: {
    position: 'absolute',
    bottom: 30,
    left: 32,
    right: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 20,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: 700,
    textShadow: '0 1px 12px rgba(0,0,0,0.35)',
  },
  section: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    padding: '7px 14px',
    background: 'rgba(9,14,22,0.62)',
    border: `1px solid ${BORDER}`,
    borderRadius: 999,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  sectionLabel: { fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: '#8fd4ff' },
  sectionName: { fontFamily: "'PP Gosha Sans', sans-serif", fontWeight: 800, fontSize: 12.5, letterSpacing: 1.5, color: INK },
  navNote: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: 700,
    color: '#4fd6ff',
    textShadow: '0 1px 12px rgba(0,0,0,0.4)',
  },
  hint: { color: '#6bffb0' },

  // ---- SELECTED WORK preview gallery ----
  workWrap: {
    position: 'absolute',
    left: '50%',
    bottom: 96,
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 18,
    transition: 'opacity 0.5s ease, transform 0.5s ease',
    willChange: 'opacity, transform',
  },
  workWrapMobile: {
    bottom: 82,
    gap: 8,
    width: 'calc(100vw - 20px)',
    justifyContent: 'center',
  },
  workCard: {
    display: 'flex',
    flexDirection: 'column',
    width: 208,
    borderRadius: 14,
    overflow: 'hidden',
    textDecoration: 'none',
    background: 'rgba(8,12,20,0.62)',
    border: `1px solid ${BORDER}`,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 16px 46px rgba(0,0,0,0.44)',
  },
  workThumb: {
    position: 'relative',
    height: 116,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workThumbInitial: {
    fontFamily: "'PP Gosha Sans', sans-serif",
    fontWeight: 800,
    fontSize: 44,
    color: 'rgba(255,255,255,0.92)',
    textShadow: '0 2px 12px rgba(0,0,0,0.32)',
  },
  workMeta: { display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 14px 14px' },
  workTitle: { fontFamily: "'PP Gosha Sans', sans-serif", fontWeight: 700, fontSize: 14.5, color: INK, letterSpacing: 0.4 },
  workTag: { fontFamily: MONO, fontSize: 10.5, letterSpacing: 1, color: '#8fd4ff' },

  // ---- PROJECT SHOWCASE (big, clickable) ----
  showWrap: {
    position: 'absolute',
    left: '50%',
    top: '52%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 18,
    willChange: 'opacity, transform, filter', // driven per-frame from progress, no CSS transition
  },
  showWrapMobile: { width: 'calc(100vw - 20px)' },
  showHead: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: 700,
    color: '#8fd4ff',
    textShadow: '0 1px 12px rgba(0,0,0,0.4)',
  },
  showRow: { display: 'flex', gap: 20 },
  showCard: {
    display: 'flex',
    flexDirection: 'column',
    width: 268,
    textAlign: 'left',
    padding: 0,
    borderRadius: 18,
    overflow: 'hidden',
    cursor: 'pointer',
    background: 'rgba(8,12,20,0.66)',
    border: `1px solid ${BORDER}`,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 22px 60px rgba(0,0,0,0.5)',
    color: INK,
    transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
  },
  showThumb: {
    position: 'relative',
    height: 148,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showThumbInitial: {
    fontFamily: "'PP Gosha Sans', sans-serif",
    fontWeight: 800,
    fontSize: 58,
    color: 'rgba(255,255,255,0.92)',
    textShadow: '0 2px 14px rgba(0,0,0,0.3)',
  },
  showYear: {
    position: 'absolute',
    top: 10,
    right: 12,
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 1,
    color: '#fff',
    background: 'rgba(0,0,0,0.32)',
    padding: '3px 8px',
    borderRadius: 999,
  },
  showMeta: { display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 16px 16px' },
  showTitle: { fontFamily: "'PP Gosha Sans', sans-serif", fontWeight: 800, fontSize: 17, color: INK, letterSpacing: 0.3 },
  showRole: { fontFamily: MONO, fontSize: 10, letterSpacing: 1.5, color: '#9fb6cc', textTransform: 'uppercase' },
  showSummary: { fontSize: 12.5, lineHeight: 1.5, color: '#c2cedd', marginTop: 2 },
  showOpen: { fontFamily: MONO, fontSize: 10.5, letterSpacing: 1.5, fontWeight: 700, marginTop: 6 },

  // ---- HOW I WORK — editorial layout (like other legs) with card items ----
  procWrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(1000px, 94vw)',
    maxHeight: '90vh',
    overflowY: 'auto',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 34,
    transition: 'opacity 0.5s ease, transform 0.5s ease',
    willChange: 'opacity, transform',
  },
  procWrapMobile: { flexDirection: 'column', gap: 12, width: '92vw' },
  procGhostCol: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 6 },
  procGhostNum: { fontFamily: HEAD, fontWeight: 800, fontSize: 'clamp(120px, 15vw, 200px)', lineHeight: 0.86, letterSpacing: -6, color: '#5c6572', opacity: 0.34 },
  procGhostLabel: { fontFamily: MONO, fontSize: 13, letterSpacing: 3, color: '#5c6572', marginTop: 6 },
  procContent: { flex: '1 1 auto', minWidth: 0, maxWidth: 640, display: 'flex', flexDirection: 'column' },
  procHero: { fontFamily: HEAD, fontWeight: 800, fontSize: 'clamp(40px, 5vw, 62px)', letterSpacing: -1, color: '#141b26', lineHeight: 1.02, textShadow: '0 1px 18px rgba(240,247,255,0.5)' },
  procTitle: { fontFamily: HEAD, fontWeight: 800, fontSize: 'clamp(20px, 2.6vw, 28px)', color: '#2f3a48', marginTop: 8, textShadow: '0 1px 14px rgba(240,247,255,0.45)' },
  procKicker: { fontFamily: MONO, fontSize: 12, letterSpacing: 3, color: '#0b5fb8', marginTop: 8, fontWeight: 700 },
  procPhil: { fontSize: '1rem', fontStyle: 'italic', fontWeight: 600, lineHeight: 1.5, color: '#2c3644', margin: '12px 0 22px', textShadow: '0 1px 12px rgba(240,247,255,0.5)' },
  procList: { display: 'flex', flexDirection: 'column', gap: 10 },
  procRow: {
    display: 'grid',
    gridTemplateColumns: '34px 1fr auto',
    alignItems: 'center',
    gap: 14,
    padding: '14px 18px',
    borderRadius: 12,
    // solid dark card so the light text reads cleanly over the bright sky
    background: 'rgba(10,16,27,0.92)',
    border: '1px solid rgba(255,255,255,0.16)',
    boxShadow: '0 14px 36px rgba(3,10,24,0.4)',
  },
  procRowIdx: { fontFamily: MONO, fontSize: 16, fontWeight: 700, color: '#4fd6ff' },
  procRowMain: { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 },
  procRowTitle: { fontFamily: HEAD, fontWeight: 700, fontSize: 16, letterSpacing: 0.3, color: '#f4f9ff' },
  procRowDesc: { fontSize: 13.5, lineHeight: 1.5, color: '#c4d2e2' },
  procRowCheck: { fontFamily: MONO, fontSize: 14, fontWeight: 700, color: '#6bffb0' },
  procCta: {
    alignSelf: 'flex-start',
    marginTop: 18,
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: 700,
    color: '#04121e',
    background: '#4fd6ff',
    borderRadius: 10,
    padding: '12px 22px',
    textDecoration: 'none',
    boxShadow: '0 0 24px rgba(79,214,255,0.4)',
  },

  // ---- project detail modal ----
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 40,
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    background: 'rgba(4,8,14,0.62)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
  },
  modalCard: {
    width: 'min(560px, 94vw)',
    maxHeight: '88vh',
    overflow: 'auto',
    borderRadius: 22,
    background: 'rgba(11,16,26,0.94)',
    border: `1px solid ${BORDER}`,
    boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
  },
  modalCardMobile: { width: '94vw' },
  modalBanner: {
    position: 'relative',
    height: 168,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBannerInitial: {
    fontFamily: "'PP Gosha Sans', sans-serif",
    fontWeight: 800,
    fontSize: 76,
    color: 'rgba(255,255,255,0.94)',
    textShadow: '0 2px 16px rgba(0,0,0,0.3)',
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(0,0,0,0.35)',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    lineHeight: 1,
  },
  modalBody: { padding: '22px 26px 26px' },
  modalKicker: { fontFamily: MONO, fontSize: 11, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' },
  modalTitle: { fontFamily: "'PP Gosha Sans', sans-serif", fontWeight: 800, fontSize: 26, color: INK, margin: '8px 0 12px', letterSpacing: 0.3 },
  modalSummary: { fontSize: 15, lineHeight: 1.6, color: '#cdd8e6', margin: 0 },
  modalList: { listStyle: 'none', padding: 0, margin: '18px 0 0', display: 'flex', flexDirection: 'column', gap: 10 },
  modalListItem: { display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#dbe6f2', lineHeight: 1.45 },
  modalBullet: { flex: '0 0 auto', width: 7, height: 7, borderRadius: 999, marginTop: 6 },
  modalActions: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 },
  modalVisit: {
    fontFamily: "'PP Gosha Sans', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 1.5,
    color: '#fff',
    background: '#0b5fb8',
    borderRadius: 10,
    padding: '11px 20px',
    textDecoration: 'none',
  },
  modalCloseText: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 2,
    color: '#9fb6cc',
    background: 'transparent',
    border: 0,
    cursor: 'pointer',
  },
  progressTrack: {
    flex: '0 1 240px',
    height: 5,
    background: 'rgba(9,14,22,0.5)',
    border: `1px solid ${BORDER}`,
    borderRadius: 999,
    overflow: 'hidden',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
  },
  progressFill: {
    height: '100%',
    width: '0%',
    background: 'linear-gradient(90deg, #4fd6ff, #6bffb0)',
    borderRadius: 999,
    boxShadow: '0 0 10px rgba(79,214,255,0.6)',
  },
}
