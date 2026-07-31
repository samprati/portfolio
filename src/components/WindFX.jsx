import { useEffect, useRef } from 'react'

// Wind / speed streaks: thin light lines that stream outward from a vanishing
// point, like air rushing past the cockpit. They're faint near the centre (so
// they never fight the text) and brighten toward the edges, and they speed up
// whenever the flight is moving between legs. Pure 2D canvas over the scene.
export default function WindFX({ progressRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    let W = 0
    let H = 0
    let cx = 0
    let cy = 0
    let maxR = 1

    const resize = () => {
      W = canvas.width = Math.floor(window.innerWidth * dpr)
      H = canvas.height = Math.floor(window.innerHeight * dpr)
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      cx = W / 2
      cy = H / 2
      maxR = Math.hypot(cx, cy)
    }
    resize()
    window.addEventListener('resize', resize)

    const N = 90
    const spawn = (s, nearCentre) => {
      s.a = Math.random() * Math.PI * 2
      s.r = nearCentre ? maxR * (0.04 + Math.random() * 0.12) : Math.random() * maxR
      s.spd = 0.55 + Math.random() * 0.9
    }
    const streaks = Array.from({ length: N }, () => {
      const s = {}
      spawn(s, false)
      return s
    })

    let last = performance.now()
    let prevP = progressRef.current || 0
    let boost = 1

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const cur = progressRef.current || 0
      const vel = Math.abs(cur - prevP) / Math.max(dt, 0.0001)
      prevP = cur
      // ease the boost so it swells as you fly and settles when parked
      const targetBoost = 1 + Math.min(7, vel * 150)
      boost += (targetBoost - boost) * (1 - Math.exp(-dt * 6))

      ctx.clearRect(0, 0, W, H)
      ctx.lineCap = 'round'

      for (const s of streaks) {
        const t0 = s.r / maxR
        // accelerate outward — faster the further out (perspective rush)
        s.r += s.spd * boost * dt * dpr * 620 * (0.25 + t0 * 1.6)
        if (s.r > maxR * 1.05) {
          spawn(s, true)
          continue
        }
        const t = s.r / maxR
        const len = (26 + t * 190) * dpr
        const cos = Math.cos(s.a)
        const sin = Math.sin(s.a)
        const x1 = cx + cos * s.r
        const y1 = cy + sin * s.r
        const x2 = cx + cos * (s.r + len)
        const y2 = cy + sin * (s.r + len)
        // faint in the middle, brighter at the edges; a touch more with speed
        const alpha = Math.min(0.34, t * t * 0.42) * Math.min(1.4, 0.6 + boost * 0.1)
        ctx.strokeStyle = `rgba(232,244,255,${alpha})`
        ctx.lineWidth = (0.6 + t * 1.6) * dpr
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
      raf = requestAnimationFrame(tick)
    }
    let raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [progressRef])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 6 }}
    />
  )
}
