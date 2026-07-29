import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import LoadingScreen from './components/LoadingScreen.jsx'
import Scene3D from './components/Scene3D.jsx'
import FlightHUD from './components/FlightHUD.jsx'
import { FLIGHT_PATH, CONTENT_PROGRESS } from './data/timeline.js'

const FLIGHT_LENGTH_VH = 1040 // scrollable height (cruise portion), in viewport-heights

// The takeoff and landing both fly themselves. Scroll only ever drives the
// cruise between them:
//   • parked on the runway → first scroll auto-flies takeoff up to the intro
//   • scroll cruises intro → contact
//   • at the last section, scrolling further auto-flies the descent + landing
//     (scroll back up to take off again)
const SEG = FLIGHT_PATH.length - 1
const INTRO_T = CONTENT_PROGRESS[0] // top of the climb (intro section)
const END_T = CONTENT_PROGRESS[CONTENT_PROGRESS.length - 1] // last section (contact)
const ROTATE_T = 1 / SEG // end of the ground roll
const FLARE_T = (SEG - 1) / SEG // start of the landing flare

function App() {
  const [loaded, setLoaded] = useState(false)
  const progressRef = useRef(0)
  const spacerRef = useRef(null)

  const handleLoaded = useCallback(() => setLoaded(true), [])

  useEffect(() => {
    if (!loaded) return

    const doc = document.documentElement
    let phase = 'ground' // ground → takeoff → flight → landing → landed
    let tl // current auto-animation timeline
    const p = { v: 0 } // shared tween target

    progressRef.current = 0
    doc.style.overflow = 'hidden'
    window.scrollTo(0, 0)

    const lock = () => (doc.style.overflow = 'hidden')
    const unlock = () => (doc.style.overflow = '')
    const setP = () => (progressRef.current = p.v)
    const atBottom = () => {
      const max = doc.scrollHeight - window.innerHeight
      return max <= 0 || window.scrollY >= max - 2
    }

    // cruise: native scroll (0..1) maps to INTRO_T..END_T. The runway, takeoff
    // and landing stretches are never scrubbed by hand.
    function onScroll() {
      if (phase !== 'flight') return
      const max = doc.scrollHeight - window.innerHeight
      const frac = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      progressRef.current = INTRO_T + frac * (END_T - INTRO_T)
    }

    const enterFlight = (toBottom) => {
      phase = 'flight'
      unlock()
      const max = doc.scrollHeight - window.innerHeight
      window.scrollTo(0, toBottom ? max : 0)
      onScroll()
    }

    const startTakeoff = () => {
      if (phase !== 'ground') return
      phase = 'takeoff'
      p.v = 0
      tl = gsap.timeline({ onComplete: () => enterFlight(false) })
      tl.to(p, { v: ROTATE_T, duration: 1.6, ease: 'power1.in', onUpdate: setP }) // ground roll
        .to(p, { v: INTRO_T, duration: 3.4, ease: 'power2.out', onUpdate: setP }) // rotate + climb
    }

    const startLanding = () => {
      if (phase !== 'flight') return
      tl?.kill()
      phase = 'landing'
      lock()
      p.v = progressRef.current
      tl = gsap.timeline({ onComplete: () => (phase = 'landed') })
      tl.to(p, { v: FLARE_T, duration: 3.0, ease: 'power1.in', onUpdate: setP }) // descend through deck
        .to(p, { v: 1, duration: 2.0, ease: 'power2.out', onUpdate: setP }) // flare + touchdown
    }

    // scrolling up after (or during) the landing takes off again
    const reverseLanding = () => {
      if (phase !== 'landing' && phase !== 'landed') return
      tl?.kill()
      phase = 'reversing'
      p.v = progressRef.current
      tl = gsap.timeline({ onComplete: () => enterFlight(true) })
      tl.to(p, { v: END_T, duration: 2.2, ease: 'power2.out', onUpdate: setP })
    }

    const onWheel = (e) => {
      if (phase === 'ground' && e.deltaY > 0) startTakeoff()
      else if (phase === 'flight' && e.deltaY > 0 && atBottom()) startLanding()
      else if ((phase === 'landing' || phase === 'landed') && e.deltaY < 0) reverseLanding()
    }
    const onKey = (e) => {
      const down = ['ArrowDown', 'PageDown', ' ', 'Spacebar', 'Enter'].includes(e.key)
      const up = ['ArrowUp', 'PageUp'].includes(e.key)
      if (phase === 'ground' && down) startTakeoff()
      else if (phase === 'flight' && down && atBottom()) startLanding()
      else if ((phase === 'landing' || phase === 'landed') && up) reverseLanding()
    }
    let touchY = null
    const onTouchStart = (e) => (touchY = e.touches[0]?.clientY ?? null)
    const onTouchMove = (e) => {
      if (touchY == null) return
      const dy = touchY - (e.touches[0]?.clientY ?? touchY) // >0 = swipe up = scroll down
      if (phase === 'ground' && dy > 6) startTakeoff()
      else if (phase === 'flight' && dy > 6 && atBottom()) startLanding()
      else if ((phase === 'landing' || phase === 'landed') && dy < -6) reverseLanding()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })

    return () => {
      tl?.kill()
      unlock()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [loaded])

  return (
    <>
      {!loaded && <LoadingScreen onDone={handleLoaded} />}
      {loaded && (
        <>
          <Scene3D progressRef={progressRef} />
          <FlightHUD progressRef={progressRef} />
          {/* invisible spacer that gives the page real scrollable height for
              the cruise portion of the flight */}
          <div ref={spacerRef} style={{ height: `${FLIGHT_LENGTH_VH}vh` }} />
        </>
      )}
    </>
  )
}

export default App
