import { useEffect, useRef, useState } from 'react'
import { CONTENT_PROGRESS } from '../data/timeline.js'
import takeoffUrl from '../assets/music/takeoff.mp3'
import oncloudUrl from '../assets/music/oncloud.mp3'
import landingUrl from '../assets/music/landing.mp3'

// progress zones: takeoff (0..START) → cruise (START..END) → landing (END..1)
const START = CONTENT_PROGRESS[0]
const END = CONTENT_PROGRESS[CONTENT_PROGRESS.length - 1]
const MASTER = 1.0
const AMBIENT_FLOOR = 0.32 // oncloud keeps a bed so there's always some sound

const clamp01 = (v) => Math.min(1, Math.max(0, v))

export default function FlightAudio({ progressRef }) {
  // ON by default; browsers still require a gesture, so we also auto-start
  // playback on the first user interaction
  const [on, setOn] = useState(true)
  const onRef = useRef(true)
  onRef.current = on
  const audio = useRef(null)

  useEffect(() => {
    const takeoff = new Audio(takeoffUrl)
    const cloud = new Audio(oncloudUrl)
    const landing = new Audio(landingUrl)
    for (const a of [takeoff, cloud, landing]) {
      a.loop = true
      a.volume = 0
      a.preload = 'auto'
    }
    audio.current = { takeoff, cloud, landing }

    // start playback on the first user gesture (required by autoplay policies)
    const start = () => {
      if (onRef.current) for (const a of [takeoff, cloud, landing]) a.play().catch(() => {})
    }
    const gestures = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'click']
    gestures.forEach((g) => window.addEventListener(g, start, { passive: true }))

    const vol = { t: 0, c: 0, l: 0 }
    let raf
    const tick = () => {
      const p = clamp01(progressRef.current)
      const live = onRef.current

      const tT = p <= 0.012 ? 0 : Math.min(1, p / (START * 0.25)) * clamp01((START - p) / (START * 0.35))
      const tC = Math.max(AMBIENT_FLOOR, clamp01((p - START * 0.55) / (START * 0.45)) * clamp01((1 - p) / (1 - END)))
      const tL = clamp01((p - END) / ((1 - END) * 0.4))

      const mul = live ? MASTER : 0
      vol.t += (tT * mul - vol.t) * 0.07
      vol.c += (tC * mul - vol.c) * 0.07
      vol.l += (tL * mul - vol.l) * 0.07
      takeoff.volume = clamp01(vol.t)
      cloud.volume = clamp01(vol.c)
      landing.volume = clamp01(vol.l)

      // keep audible tracks playing (recovers from any blocked start)
      if (live) {
        if (takeoff.paused && takeoff.volume > 0.001) takeoff.play().catch(() => {})
        if (cloud.paused && cloud.volume > 0.001) cloud.play().catch(() => {})
        if (landing.paused && landing.volume > 0.001) landing.play().catch(() => {})
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      gestures.forEach((g) => window.removeEventListener(g, start))
      for (const a of [takeoff, cloud, landing]) {
        a.pause()
        a.src = ''
      }
    }
  }, [progressRef])

  const toggle = () => {
    const next = !on
    setOn(next)
    const a = audio.current
    if (a && next) {
      for (const el of [a.takeoff, a.cloud, a.landing]) el.play().catch(() => {})
    } else if (a) {
      for (const el of [a.takeoff, a.cloud, a.landing]) el.pause()
    }
  }

  return (
    <button type="button" onClick={toggle} style={{ ...s.btn, ...(on ? s.on : s.off) }} title={on ? 'Sound on' : 'Sound off'}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
        {on ? (
          <>
            <path d="M16 8.5a4 4 0 0 1 0 7" />
            <path d="M18.5 6a7 7 0 0 1 0 12" />
          </>
        ) : (
          <path d="M17 9l6 6M23 9l-6 6" />
        )}
      </svg>
      <span style={s.txt}>{on ? 'SOUND ON' : 'SOUND OFF'}</span>
    </button>
  )
}

const s = {
  btn: {
    position: 'fixed',
    top: 52,
    right: 30,
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 32,
    padding: '0 12px',
    borderRadius: 9,
    fontFamily: "'SF Mono', ui-monospace, monospace",
    fontSize: 11,
    letterSpacing: 1.5,
    cursor: 'pointer',
    pointerEvents: 'auto',
    backdropFilter: 'blur(7px)',
    WebkitBackdropFilter: 'blur(7px)',
  },
  txt: { fontWeight: 700 },
  on: { color: '#05121a', background: '#6bffb0', border: '1px solid #6bffb0' },
  off: { color: '#eaf3ff', background: 'rgba(9,14,22,0.55)', border: '1px solid rgba(255,255,255,0.25)' },
}
