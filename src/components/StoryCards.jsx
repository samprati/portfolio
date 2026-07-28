import { useEffect, useRef } from 'react'
import { TIMELINE, CONTENT_PROGRESS } from '../data/timeline.js'
import useIsMobile from '../hooks/useIsMobile.js'

// Each career leg is a glass "story card" that floats in over the sky as the
// flight passes its waypoint, then drifts up and out as you continue. Cards
// alternate sides so the cockpit tapes and the moving sky stay visible.
const HALF = 0.055 // progress half-window a card is visible over

const clamp01 = (v) => Math.min(1, Math.max(0, v))

export default function StoryCards({ progressRef }) {
  const cards = useRef([])
  const isMobile = useIsMobile()

  useEffect(() => {
    let raf
    const tick = () => {
      const p = Math.min(1, Math.max(0, progressRef.current))
      for (let i = 0; i < TIMELINE.length; i++) {
        const el = cards.current[i]
        if (!el) continue
        const d = p - CONTENT_PROGRESS[i]
        const op = clamp01((HALF - Math.abs(d)) / (HALF * 0.55))
        // drift up and out as the flight moves past the waypoint
        const shift = Math.max(-70, Math.min(70, -d * 260))
        const x = isMobile ? '-50%' : '0'
        el.style.opacity = op
        el.style.transform = `translate(${x}, calc(-50% + ${shift}px))`
        el.style.pointerEvents = 'none'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progressRef, isMobile])

  return (
    <div style={s.wrap}>
      {TIMELINE.map((leg, i) => {
        const left = i % 2 === 0
        const place = isMobile ? s.center : left ? s.left : s.right
        return (
          <article
            key={leg.key}
            ref={(el) => (cards.current[i] = el)}
            style={{ ...s.card, ...place, ...(isMobile ? s.cardMobile : null) }}
          >
            <span style={{ ...s.ghost, ...(isMobile ? s.ghostMobile : null) }}>{leg.no}</span>
            <div style={s.eyebrow}>
              <span style={s.legTag}>LEG {leg.no}</span>
              <span style={s.code}>{leg.code}</span>
            </div>
            <div style={s.years}>{leg.years}</div>
            <h2 style={s.title}>{leg.title}</h2>
            <p style={s.story}>{leg.story}</p>
            <div style={s.chips}>
              {leg.chips.map((c) => (
                <span key={c} style={s.chip}>{c}</span>
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}

const MONO = "'SF Mono', ui-monospace, 'Roboto Mono', Menlo, monospace"

const s = {
  wrap: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 8,
    fontFamily: "'Google Sans Flex', sans-serif",
  },
  card: {
    position: 'absolute',
    top: '50%',
    width: 'min(500px, 82vw)',
    padding: '30px 34px 32px',
    background: 'rgba(8,12,20,0.55)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 18,
    backdropFilter: 'blur(13px)',
    WebkitBackdropFilter: 'blur(13px)',
    boxShadow: '0 26px 74px rgba(0,0,0,0.42)',
    color: '#eaf3ff',
    opacity: 0,
    overflow: 'hidden',
    willChange: 'opacity, transform',
  },
  left: { left: 'max(132px, 7vw)' },
  right: { right: 'max(132px, 7vw)' },
  center: { left: '50%' },
  cardMobile: { width: 'min(440px, 92vw)', padding: '24px 22px 26px', borderRadius: 16 },

  ghost: {
    position: 'absolute',
    top: -34,
    right: -6,
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontWeight: 800,
    fontSize: 170,
    lineHeight: 1,
    color: 'rgba(255,255,255,0.06)',
    pointerEvents: 'none',
  },
  ghostMobile: { fontSize: 120, top: -22 },
  eyebrow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 2,
  },
  legTag: {
    color: '#05121a',
    background: '#6bffb0',
    padding: '3px 8px',
    borderRadius: 5,
    fontWeight: 700,
  },
  code: { color: '#bcd8f5', letterSpacing: 1.5 },
  years: {
    fontFamily: MONO,
    fontSize: 12.5,
    letterSpacing: 2,
    color: '#8fa8c0',
    marginTop: 12,
  },
  title: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontWeight: 800,
    fontSize: 'clamp(28px, 3.6vw, 42px)',
    lineHeight: 1.05,
    margin: '4px 0 16px',
    letterSpacing: 0.2,
  },
  story: {
    fontSize: 16.5,
    lineHeight: 1.62,
    color: '#dbe7f3',
    margin: '0 0 20px',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 0.5,
    color: '#dceafa',
    background: 'rgba(255,255,255,0.09)',
    border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: 999,
    padding: '5px 12px',
  },
}
