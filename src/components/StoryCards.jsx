import { useEffect, useRef } from 'react'
import { TIMELINE, CONTENT_PROGRESS } from '../data/timeline.js'
import useIsMobile from '../hooks/useIsMobile.js'
import PassCard, { pp } from './PassCard.jsx'

// Each career leg is a boarding-pass "ticket" placed on the flight path. As
// the camera reaches its waypoint the ticket rushes up in scale and blows past
// — so it reads like flying THROUGH the card, the way the old 3D text did —
// then fades as you continue to the next leg.
const HALF = 0.06 // progress half-window a card is "in range"

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
        // u < 0 approaching, 0 at the waypoint, > 0 past it (flying through)
        const u = (p - CONTENT_PROGRESS[i]) / HALF
        if (u <= -1 || u >= 1.15) {
          el.style.opacity = 0
          continue
        }
        // fade in on approach, hold through the middle, fade out as we pass
        const op = clamp01((u + 1) / 0.5) * clamp01((1.05 - u) / 0.55)
        // scale keeps growing as the camera bears down on and punches through
        const scale = u <= 0 ? 0.82 + (u + 1) * 0.18 : 1 + u * 1.35
        el.style.opacity = op
        el.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`
        el.style.pointerEvents = 'none'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progressRef, isMobile])

  return (
    <div style={wrap}>
      {TIMELINE.map((leg, i) => {
        return (
          <PassCard
            key={leg.key}
            ref={(el) => (cards.current[i] = el)}
            style={{ ...cardBase, ...(isMobile ? cardMobile : null) }}
            header={
              <>
                <div style={pp.kickerRow}>
                  <span style={pp.tag}>LEG {leg.no}</span>
                  <span>{leg.code}</span>
                </div>
                <h2 style={{ ...pp.headTitle, fontSize: isMobile ? 28 : 34 }}>{leg.title}</h2>
                <div style={pp.years}>{leg.years}</div>
              </>
            }
            stub={
              <>
                <div style={pp.barcode} />
                <div style={pp.stubMeta}>
                  SD-2026
                  <br />
                  LEG {leg.no}
                </div>
              </>
            }
          >
            <p style={pp.story}>{leg.story}</p>
            <div style={pp.chips}>
              {leg.chips.map((c) => (
                <span key={c} style={pp.chip}>{c}</span>
              ))}
            </div>
          </PassCard>
        )
      })}
    </div>
  )
}

const wrap = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 8,
  fontFamily: "'Google Sans Flex', sans-serif",
}

const cardBase = { top: '50%', left: '50%', width: 'min(460px, 88vw)', opacity: 0 }
const cardMobile = { width: 'min(440px, 92vw)' }
