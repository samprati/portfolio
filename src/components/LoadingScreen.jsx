import { useEffect, useRef, useState } from 'react'

export default function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0)
  const dotRef = useRef(null)

  useEffect(() => {
    const start = performance.now()
    const duration = 2200
    let raf

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = t < 1 ? 1 - Math.pow(1 - t, 3) : 1
      setProgress(Math.round(eased * 100))
      if (dotRef.current) {
        dotRef.current.style.transform = `translateY(${eased * 100}vh)`
      }
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setTimeout(onDone, 350)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onDone])

  return (
    <div style={styles.wrap}>
      <div style={styles.trail} />
      <div ref={dotRef} style={styles.dot} />
      <div style={styles.footer}>
        <span style={styles.label}>TAKING FLIGHT</span>
        <span style={styles.percent}>{progress}%</span>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(180deg, #0b0d14 0%, #05060c 70%)',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 100,
  },
  trail: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 1,
    height: '100%',
    background:
      'linear-gradient(180deg, transparent 0%, rgba(244,242,238,0.18) 40%, transparent 100%)',
    transform: 'translateX(-50%)',
  },
  dot: {
    position: 'absolute',
    top: -12,
    left: '50%',
    width: 10,
    height: 10,
    marginLeft: -5,
    borderRadius: '50%',
    background: '#ffd36c',
    boxShadow: '0 0 24px 6px rgba(255,211,108,0.5)',
    willChange: 'transform',
  },
  footer: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 32px 40px',
    fontSize: 12,
    letterSpacing: '2px',
    color: 'rgba(244,242,238,0.65)',
    fontFamily: "'Google Sans Flex', sans-serif",
  },
  label: {},
  percent: {
    fontVariantNumeric: 'tabular-nums',
    color: '#f4f2ee',
  },
}
