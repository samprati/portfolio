import { useEffect, useMemo, useRef, useState } from 'react'
import {
  TIMELINE,
  CONTENT_PROGRESS,
  FLIGHT_PATH,
  CRUISE_Y,
  BOARDING,
  ARRIVAL,
  WORKS,
} from '../data/timeline.js'
import useIsMobile from '../hooks/useIsMobile.js'
import PassCard, { pp } from './PassCard.jsx'
import { getDestination } from '../data/destination.js'

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

const clamp01 = (v) => Math.min(1, Math.max(0, v))

// linear-interpolate the camera Y along the flight path at scroll progress p
function altYAt(p) {
  const seg = Math.min(N - 1, Math.max(0, p)) * (N - 1)
  const i = Math.min(N - 2, Math.floor(seg))
  const f = seg - i
  return FLIGHT_PATH[i].pos[1] + (FLIGHT_PATH[i + 1].pos[1] - FLIGHT_PATH[i].pos[1]) * f
}

const fmt = (n) => Math.round(n).toLocaleString('en-US')

export default function FlightHUD({ progressRef, navRef, onFlyAgain }) {
  const isMobile = useIsMobile()
  const [section, setSection] = useState('BOARDING')
  const [hint, setHint] = useState('takeoff') // 'takeoff' | 'land' | null
  const [nav, setNav] = useState({ label: '', turn: false }) // "turning to leg —" note

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
      if (boardingRef.current) {
        boardingRef.current.style.opacity = boardO
        boardingRef.current.style.pointerEvents = boardO > 0.5 ? 'auto' : 'none'
      }
      if (arrivalRef.current) {
        arrivalRef.current.style.opacity = arriveO
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
      {/* BOARDING pass — on the departure runway, before takeoff */}
      <PassCard
        ref={boardingRef}
        style={{ ...hudCard, opacity: 1, width: isMobile ? '92vw' : 'min(680px, 92vw)' }}
        header={
          <>
            <div style={pp.kickerRow}>
              <span style={pp.tag}>BOARDING PASS</span>
              <span>FLIGHT {BOARDING.flight}</span>
            </div>
            <div style={{ ...pp.headTitle, fontSize: isMobile ? 40 : 56 }}>{BOARDING.name}</div>
            <div style={pp.headSub}>{BOARDING.role}</div>
          </>
        }
        stub={
          <>
            <div style={pp.barcode} />
            <div style={pp.stubMeta}>
              SEAT 1A · GATE 26
              <br />
              {BOARDING.flight}
            </div>
          </>
        }
      >
        <div style={route}>
          {routeStops.map((r, i) => (
            <div key={r.code + i} style={routeItem}>
              <span style={routeCode}>{r.code}</span>
              <span style={routeCity}>{r.city}</span>
              {i < routeStops.length - 1 && <span style={routeArrow}>✈</span>}
            </div>
          ))}
        </div>
        <div style={tagline}>{BOARDING.tagline}</div>
      </PassCard>

      {/* ARRIVAL pass — on the arrival runway, after landing */}
      <PassCard
        ref={arrivalRef}
        style={{ ...hudCard, opacity: 0, width: isMobile ? '92vw' : 'min(640px, 92vw)' }}
        header={
          <>
            <div style={pp.kickerRow}>
              <span style={pp.tag}>ARRIVAL</span>
              <span>{ARRIVAL.sub}</span>
            </div>
            <div style={{ ...pp.headTitle, fontSize: isMobile ? 36 : 50 }}>{dest.city}</div>
            <div style={pp.headSub}>{ARRIVAL.note} · {dest.city}</div>
          </>
        }
        stub={
          <>
            <div style={pp.barcode} />
            <div style={pp.stubMeta}>{ARRIVAL.visa}</div>
          </>
        }
      >
        <div style={arriveContact}>
          <a href={`mailto:${ARRIVAL.email}`} style={pp.link}>{ARRIVAL.email}</a>
          <span style={{ color: '#9aa7b6' }}>·</span>
          <a href={`tel:${ARRIVAL.phone.replace(/\s/g, '')}`} style={pp.link}>{ARRIVAL.phone}</a>
        </div>
        <a href={`https://${ARRIVAL.linkedin}`} target="_blank" rel="noreferrer" style={{ ...pp.link, display: 'inline-block', marginTop: 12 }}>
          {ARRIVAL.linkedin}
        </a>
        <div style={{ marginTop: 20 }}>
          <button type="button" style={flyAgainBtn} onClick={onFlyAgain}>
            ✈ FLY AGAIN TO READ
          </button>
        </div>
      </PassCard>

      {/* top bar */}
      <div style={s.topRow}>
        <span style={s.logo}>SAMPRATI DASH</span>
        <span style={{ ...s.tail, display: isMobile ? 'none' : 'inline' }}>SD·2026 · KUL → {lastLeg.code}</span>
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

      {/* center — flight-path reticle */}
      <div style={s.reticleWrap}>
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

      {/* SELECTED WORK — clickable side-project gallery, only on that leg */}
      <div
        style={{
          ...s.workWrap,
          ...(isMobile ? s.workWrapMobile : null),
          opacity: section === 'SELECTED WORK' ? 1 : 0,
          pointerEvents: section === 'SELECTED WORK' ? 'auto' : 'none',
          transform: `translateX(-50%) translateY(${section === 'SELECTED WORK' ? 0 : 14}px)`,
        }}
      >
        {WORKS.map((w) => (
          <a
            key={w.title}
            href={w.href}
            target={w.href.startsWith('#') ? undefined : '_blank'}
            rel="noreferrer"
            style={{ ...s.workCard, ...(isMobile ? { width: 'calc((100vw - 40px) / 3)' } : null) }}
          >
            <div
              style={{
                ...s.workThumb,
                ...(isMobile ? { height: 60 } : null),
                background: w.img
                  ? `center/cover url(${w.img})`
                  : `linear-gradient(135deg, ${w.accent[0]}, ${w.accent[1]})`,
              }}
            >
              {!w.img && <span style={s.workThumbInitial}>{w.title.charAt(0)}</span>}
            </div>
            <div style={s.workMeta}>
              <span style={s.workTitle}>{w.title}</span>
              <span style={s.workTag}>{w.tag} ↗</span>
            </div>
          </a>
        ))}
      </div>

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
  logo: { fontFamily: "'PP Gosha Sans', sans-serif", fontWeight: 800 },
  tail: { fontFamily: MONO, letterSpacing: 3, color: '#bcd8f5' },

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

  // ---- SELECTED WORK gallery ----
  workWrap: {
    position: 'absolute',
    left: '50%',
    bottom: 92,
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 14,
    transition: 'opacity 0.5s ease, transform 0.5s ease',
    willChange: 'opacity, transform',
  },
  workWrapMobile: {
    bottom: 78,
    gap: 8,
    width: 'calc(100vw - 24px)',
    justifyContent: 'center',
  },
  workCard: {
    display: 'flex',
    flexDirection: 'column',
    width: 148,
    borderRadius: 12,
    overflow: 'hidden',
    textDecoration: 'none',
    background: 'rgba(8,12,20,0.6)',
    border: `1px solid ${BORDER}`,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 14px 40px rgba(0,0,0,0.4)',
  },
  workThumb: {
    position: 'relative',
    height: 84,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workThumbInitial: {
    fontFamily: "'PP Gosha Sans', sans-serif",
    fontWeight: 800,
    fontSize: 34,
    color: 'rgba(255,255,255,0.9)',
    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
  workMeta: { display: 'flex', flexDirection: 'column', gap: 3, padding: '9px 11px 11px' },
  workTitle: { fontFamily: "'PP Gosha Sans', sans-serif", fontWeight: 700, fontSize: 12.5, color: INK, letterSpacing: 0.4 },
  workTag: { fontFamily: MONO, fontSize: 9.5, letterSpacing: 1, color: '#8fd4ff' },
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
