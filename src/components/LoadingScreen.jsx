import { useEffect, useState } from 'react'
import './LoadingScreen.css'

const CHECKS = ['ENGINES', 'NAVIGATION', 'FUEL SYSTEMS', 'CABIN', 'CLEARANCE']
const PILOT = `${import.meta.env.BASE_URL}profile-pilot.webp`
const DESIGNER = `${import.meta.env.BASE_URL}profile.webp`

export default function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [designer, setDesigner] = useState(false) // pilot → designer on chat click

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
      {/* pilot photo, with the designer photo cross-fading over it on click */}
      <div className="ls-photo" style={{ backgroundImage: `url(${PILOT})` }} />
      <div className="ls-photo top" style={{ backgroundImage: `url(${DESIGNER})`, opacity: designer ? 1 : 0 }} />

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

        {progress >= 20 && !designer && (
          <div className="ls-chat" onClick={(e) => e.stopPropagation()}>
            <span className="who">CAPTAIN SD · ON THE RECORD</span>
            Okay, confession — <b>I'm not really a pilot</b> ✈️. Being one was the
            childhood dream, so I'll fly you through my work. But{' '}
            <button
              type="button"
              className="ls-chat-link"
              onClick={(e) => {
                e.stopPropagation()
                setDesigner(true)
              }}
            >
              click here
            </button>{' '}
            and I turn back into what I actually am — a designer.
          </div>
        )}

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
