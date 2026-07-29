import { useEffect, useRef } from 'react'
import { CONTENT_PROGRESS, TIMELINE } from '../data/timeline.js'
import useIsMobile from '../hooks/useIsMobile.js'

const N = TIMELINE.length
const CYAN = '#4fd6ff'
const AMBER = '#ffc24b'
const DIM = 'rgba(120,150,170,0.35)'
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

// polar point with 0° at the top
function polar(cx, cy, r, deg) {
  const a = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}
function arcPath(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0)
  const [x1, y1] = polar(cx, cy, r, a1)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`
}

export default function NavInstruments({ progressRef }) {
  const isMobile = useIsMobile()
  const sweep = useRef(null)
  const blips = useRef([])
  const segs = useRef([])
  const countRef = useRef(null)
  const labelRef = useRef(null)

  useEffect(() => {
    if (isMobile) return
    let raf
    let sweepDeg = 0
    let last = performance.now()

    const tick = (now) => {
      const dt = (now - last) / 1000
      last = now
      const p = Math.min(1, Math.max(0, progressRef.current))

      // radar sweep spins continuously
      sweepDeg = (sweepDeg + dt * 90) % 360
      if (sweep.current) sweep.current.setAttribute('transform', `rotate(${sweepDeg} 84 84)`)

      // radar blips: each leg positioned by distance ahead/behind current
      for (let i = 0; i < N; i++) {
        const el = blips.current[i]
        if (!el) continue
        const d = CONTENT_PROGRESS[i] - p
        const r = clamp(Math.abs(d) * 120, 7, 70)
        const th = (i - (N - 1) / 2) * 0.22
        const dir = d >= 0 ? 1 : -1
        el.setAttribute('cx', 84 + r * Math.sin(th))
        el.setAttribute('cy', 84 - dir * r * Math.cos(th))
        el.setAttribute('opacity', clamp(1 - Math.abs(d) * 1.4, 0.14, 1))
        el.setAttribute('fill', Math.abs(d) < 0.028 ? AMBER : dir < 0 ? 'rgba(120,220,160,0.7)' : CYAN)
      }

      // legs dial: nearest = current, count passed
      let nearest = 0
      let best = Infinity
      let passed = 0
      for (let i = 0; i < N; i++) {
        const dd = Math.abs(CONTENT_PROGRESS[i] - p)
        if (dd < best) {
          best = dd
          nearest = i
        }
        if (CONTENT_PROGRESS[i] <= p + 0.001) passed++
      }
      for (let i = 0; i < N; i++) {
        const el = segs.current[i]
        if (!el) continue
        if (i === nearest) {
          el.setAttribute('stroke', AMBER)
          el.setAttribute('opacity', '1')
        } else if (CONTENT_PROGRESS[i] < p) {
          el.setAttribute('stroke', CYAN)
          el.setAttribute('opacity', '0.9')
        } else {
          el.setAttribute('stroke', DIM)
          el.setAttribute('opacity', '1')
        }
      }
      if (countRef.current) countRef.current.textContent = String(passed)
      if (labelRef.current) labelRef.current.textContent = TIMELINE[nearest].label

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progressRef, isMobile])

  if (isMobile) return null

  const ticks = Array.from({ length: 12 }, (_, i) => i * 30)
  const segGeom = Array.from({ length: N }, (_, i) => arcPath(84, 84, 60, i * (360 / N) + 3, (i + 1) * (360 / N) - 3))

  return (
    <div style={box}>
      {/* ---- RADAR (bottom-left) ---- */}
      <div style={{ ...panel, left: 30 }}>
        <svg width="168" height="168" viewBox="0 0 168 168">
          <circle cx="84" cy="84" r="74" fill="rgba(4,10,16,0.55)" stroke="rgba(120,200,255,0.35)" strokeWidth="1" />
          <circle cx="84" cy="84" r="52" fill="none" stroke="rgba(120,200,255,0.16)" strokeWidth="1" />
          <circle cx="84" cy="84" r="30" fill="none" stroke="rgba(120,200,255,0.16)" strokeWidth="1" />
          <line x1="84" y1="12" x2="84" y2="156" stroke="rgba(120,200,255,0.12)" strokeWidth="1" />
          <line x1="12" y1="84" x2="156" y2="84" stroke="rgba(120,200,255,0.12)" strokeWidth="1" />
          {ticks.map((t) => {
            const [x0, y0] = polar(84, 84, 74, t)
            const [x1, y1] = polar(84, 84, t % 90 === 0 ? 66 : 70, t)
            return <line key={t} x1={x0} y1={y0} x2={x1} y2={y1} stroke="rgba(150,210,255,0.5)" strokeWidth="1" />
          })}
          {/* sweep */}
          <g ref={sweep}>
            <defs>
              <linearGradient id="sweepgrad" x1="84" y1="84" x2="84" y2="12" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor={CYAN} stopOpacity="0.35" />
                <stop offset="1" stopColor={CYAN} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M84 84 L84 12 A72 72 0 0 1 130 30 Z" fill="url(#sweepgrad)" />
            <line x1="84" y1="84" x2="84" y2="12" stroke={CYAN} strokeWidth="1.5" strokeOpacity="0.8" />
          </g>
          {/* leg blips */}
          {TIMELINE.map((leg, i) => (
            <circle key={leg.key} ref={(el) => (blips.current[i] = el)} cx="84" cy="84" r="2.6" fill={CYAN} />
          ))}
          {/* aircraft */}
          <path d="M84 90 l-4 6 l4 -2 l4 2 z" fill="#eaf3ff" />
        </svg>
        <span style={label}>RADAR · NAV</span>
      </div>

      {/* ---- LEGS DIAL (bottom-right) ---- */}
      <div style={{ ...panel, right: 30 }}>
        <svg width="168" height="168" viewBox="0 0 168 168">
          <circle cx="84" cy="84" r="74" fill="rgba(4,10,16,0.55)" stroke="rgba(120,200,255,0.35)" strokeWidth="1" />
          {segGeom.map((d, i) => (
            <path
              key={i}
              ref={(el) => (segs.current[i] = el)}
              d={d}
              fill="none"
              stroke={DIM}
              strokeWidth="7"
              strokeLinecap="butt"
            />
          ))}
          <text ref={countRef} x="84" y="80" textAnchor="middle" fontFamily="'SF Mono', ui-monospace, monospace" fontSize="34" fontWeight="700" fill="#eaf3ff">0</text>
          <text x="84" y="98" textAnchor="middle" fontFamily="'SF Mono', ui-monospace, monospace" fontSize="12" letterSpacing="1" fill="rgba(190,216,245,0.8)">OF {N} LEGS</text>
          <text ref={labelRef} x="84" y="120" textAnchor="middle" fontFamily="'SF Mono', ui-monospace, monospace" fontSize="9" letterSpacing="1.5" fill={AMBER}>BOARDING</text>
        </svg>
        <span style={label}>FLIGHT PLAN</span>
      </div>
    </div>
  )
}

const box = { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9 }
const panel = {
  position: 'absolute',
  bottom: 64,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  borderRadius: '50%',
}
const label = {
  fontFamily: "'SF Mono', ui-monospace, 'Roboto Mono', monospace",
  fontSize: 10,
  letterSpacing: 2,
  color: '#bcd8f5',
  textShadow: '0 1px 8px rgba(0,0,0,0.4)',
}
