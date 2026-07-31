import { useEffect, useState } from 'react'
import './LoadingScreen.css'

const CHECKS = ['ENGINES', 'NAVIGATION', 'FUEL SYSTEMS', 'CABIN', 'CLEARANCE']

// faint cockpit HUD drawn behind the loading UI
function CockpitHUD() {
  const headingTicks = Array.from({ length: 11 }, (_, i) => 260 + i * 48)
  const bankTicks = [-30, -20, -10, 0, 10, 20, 30]
  const pt = (a, r = 300) => [500 + r * Math.sin((a * Math.PI) / 180), 360 - r * Math.cos((a * Math.PI) / 180)]
  return (
    <svg viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice">
      {/* corner brackets */}
      <path className="ls-hud-line" d="M40 40 H110 M40 40 V110" />
      <path className="ls-hud-line" d="M960 40 H890 M960 40 V110" />
      <path className="ls-hud-line" d="M40 580 H110 M40 580 V510" />
      <path className="ls-hud-line" d="M960 580 H890 M960 580 V510" />

      {/* heading tape */}
      <line className="ls-hud-line thin" x1="250" y1="70" x2="750" y2="70" />
      {headingTicks.map((x, i) => (
        <line key={x} className="ls-hud-line thin" x1={x} y1="70" x2={x} y2={i % 2 ? 80 : 86} />
      ))}
      <path className="ls-hud-line" d="M500 92 l-8 -12 h16 z" />
      <text className="ls-hud-txt" x="500" y="58" textAnchor="middle">360</text>

      {/* bank arc + pointer */}
      <path className="ls-hud-line thin" d={`M${pt(-40)[0]} ${pt(-40)[1]} A300 300 0 0 1 ${pt(40)[0]} ${pt(40)[1]}`} />
      {bankTicks.map((a) => {
        const [x1, y1] = pt(a, 300)
        const [x2, y2] = pt(a, a === 0 ? 282 : 290)
        return <line key={a} className="ls-hud-line thin" x1={x1} y1={y1} x2={x2} y2={y2} />
      })}
      <path className="ls-hud-line" d="M500 66 l-7 12 h14 z" />

      {/* pitch ladder */}
      {[
        { y: 250, n: '10' },
        { y: 310, n: '' },
        { y: 370, n: '-10' },
      ].map((r) => (
        <g key={r.y}>
          <line className="ls-hud-line" x1="370" y1={r.y} x2="455" y2={r.y} />
          <line className="ls-hud-line" x1="545" y1={r.y} x2="630" y2={r.y} />
          {r.n && <text className="ls-hud-txt" x="345" y={r.y + 5} textAnchor="end">{r.n}</text>}
        </g>
      ))}

      {/* boresight / waterline */}
      <path className="ls-hud-line" d="M450 320 h34 l8 10 8 -10 h34" />
      <circle className="ls-hud-line" cx="500" cy="320" r="4" />

      {/* airspeed (left) + altitude (right) tapes */}
      {[130, 870].map((x, side) => (
        <g key={x}>
          <line className="ls-hud-line thin" x1={x} y1="190" x2={x} y2="450" />
          {Array.from({ length: 9 }, (_, i) => 200 + i * 30).map((y) => (
            <line key={y} className="ls-hud-line thin" x1={x} y1={y} x2={side ? x - 12 : x + 12} y2={y} />
          ))}
          <path className="ls-hud-line" d={side ? `M${x + 2} 320 l16 -9 v18 z` : `M${x - 2} 320 l-16 -9 v18 z`} />
          <text className="ls-hud-txt" x={side ? x - 4 : x + 4} y="180" textAnchor={side ? 'end' : 'start'}>
            {side ? 'ALT' : 'SPD'}
          </text>
        </g>
      ))}

      {/* corner gauges */}
      {[140, 860].map((cx) => (
        <g key={cx}>
          <circle className="ls-hud-line thin" cx={cx} cy="500" r="70" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2
            return (
              <line
                key={i}
                className="ls-hud-line thin"
                x1={cx + Math.cos(a) * 70}
                y1={500 + Math.sin(a) * 70}
                x2={cx + Math.cos(a) * 62}
                y2={500 + Math.sin(a) * 62}
              />
            )
          })}
        </g>
      ))}
    </svg>
  )
}

export default function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const start = performance.now()
    const duration = 3200
    let raf
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 2)
      setProgress(Math.round(eased * 100))
      if (t < 1) raf = requestAnimationFrame(tick)
      else setReady(true)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const current = Math.min(4, Math.floor(progress / 20))
  const pad = String(progress).padStart(2, '0')

  return (
    <div className={`ls-wrap${ready ? ' ready' : ''}`} onClick={ready ? onDone : undefined}>
      <div className="ls-cockpit"><CockpitHUD /></div>
      <div className="ls-scan" />
      <div className="ls-overlay" />

      <div className="ls-content">
        <div className="ls-top">
          <span className="flight">FLIGHT SD-2026</span>
          <span className="name">SAMPRATI DASH</span>
        </div>

        <div className="ls-center">
          <div className="ls-num"><b>{pad}</b><sup>%</sup></div>
          <div className="ls-label">PRE-FLIGHT SYSTEMS CHECK</div>
          <div className="ls-seg">
            {CHECKS.map((_, i) => (
              <div key={i} className="s">
                <i style={{ width: `${Math.max(0, Math.min(1, (progress - i * 20) / 20)) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="ls-list">
            {CHECKS.map((label, i) => {
              const done = progress >= (i + 1) * 20
              const active = !done && i === current
              return (
                <div key={label} className={`ls-row${done ? ' done' : active ? ' active' : ''}`}>
                  <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="lbl">{label}</span>
                  <span className="stat">{done ? '✓ CLEAR' : active ? 'CHECKING…' : 'STANDBY'}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="ls-bottom">
          {ready ? (
            <div className="ls-cta">
              <span className="btn">CLICK TO TAKE OFF</span>
              <span className="sub">▸ then scroll to fly</span>
            </div>
          ) : (
            <div className="ls-status">SYSTEMS ARMING · {progress}%</div>
          )}
        </div>
      </div>
    </div>
  )
}
