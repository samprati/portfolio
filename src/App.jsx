import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import LoadingScreen from './components/LoadingScreen.jsx'
import Scene3D from './components/Scene3D.jsx'
import FlightHUD from './components/FlightHUD.jsx'
import NavInstruments from './components/NavInstruments.jsx'
import FlightAudio from './components/FlightAudio.jsx'
import WindFX from './components/WindFX.jsx'
import { FLIGHT_PATH, CONTENT_PROGRESS, TIMELINE } from './data/timeline.js'

// Leg-snapped flight: takeoff and landing fly themselves; in between, each
// scroll/swipe auto-flies to the next or previous leg. Scrolling BACK plays a
// left-banking turn, as if the plane loops around to revisit the leg.
const SEG = FLIGHT_PATH.length - 1
const N = CONTENT_PROGRESS.length
const INTRO_T = CONTENT_PROGRESS[0]
const END_T = CONTENT_PROGRESS[N - 1]
const ROTATE_T = 1 / SEG
const FLARE_T = (SEG - 1) / SEG

function App() {
  const [loaded, setLoaded] = useState(false)
  const progressRef = useRef(0)
  // scripted reverse maneuver: { active, id, from:[x,y,z], to:[x,y,z], phase }
  const maneuverRef = useRef({ active: false, id: 0, from: [0, 0, 0], to: [0, 0, 0], phase: 0 })
  // { moving, turn, label } — drives the "turning to leg —" note in the HUD
  const navRef = useRef({ moving: false, turn: false, label: '' })
  // when the HUD opens a modal (e.g. a project detail), lock scroll-nav
  const uiLockRef = useRef(false)
  const restartRef = useRef(null)

  const handleLoaded = useCallback(() => setLoaded(true), [])

  useEffect(() => {
    if (!loaded) return

    const doc = document.documentElement
    let phase = 'ground' // ground → takeoff → flight → landing → landed
    let legIndex = 0
    let busy = false
    let tl
    const p = { v: 0, turn: 0 }

    progressRef.current = 0
    doc.style.overflow = 'hidden' // sections model — nav by wheel / key / swipe
    window.scrollTo(0, 0)

    const setP = () => (progressRef.current = p.v)

    const startTakeoff = () => {
      if (phase !== 'ground') return
      phase = 'takeoff'
      busy = true
      p.v = 0
      tl = gsap.timeline({ onComplete: () => { phase = 'flight'; legIndex = 0; busy = false } })
      tl.to(p, { v: ROTATE_T, duration: 1.6, ease: 'power1.in', onUpdate: setP }) // ground roll
        .to(p, { v: INTRO_T, duration: 3.4, ease: 'power2.out', onUpdate: setP }) // rotate + climb
    }

    // fly to leg i. Forward = a straight glide. Reverse = a cinematic first-
    // person LEFT U-TURN: the camera flies its own looping maneuver curve back
    // onto the previous leg (see CameraFlight for the actual path/banking).
    const goToLeg = (i, reverse) => {
      if (busy || i < 0 || i > N - 1) return
      busy = true
      navRef.current = { moving: true, turn: reverse, label: TIMELINE[i].label }
      tl?.kill()
      if (reverse) {
        const fromP = CONTENT_PROGRESS[legIndex]
        const toP = CONTENT_PROGRESS[i]
        const m = maneuverRef.current
        m.active = true
        m.id += 1
        m.from = TIMELINE[legIndex].pos
        m.to = TIMELINE[i].pos
        m.toLook = TIMELINE[i].look // so the turn lines up with the leg's own view
        m.phase = 0
        const o = { ph: 0 }
        tl = gsap.timeline({
          onComplete: () => { m.active = false; progressRef.current = toP; legIndex = i; busy = false; navRef.current.moving = false },
        })
        tl.to(o, {
          ph: 1,
          duration: 4.6,
          ease: 'sine.inOut',
          onUpdate: () => { m.phase = o.ph; progressRef.current = fromP + (toP - fromP) * o.ph },
        })
      } else {
        p.v = progressRef.current
        tl = gsap.timeline({ onComplete: () => { legIndex = i; busy = false; navRef.current.moving = false } })
        tl.to(p, { v: CONTENT_PROGRESS[i], duration: 2.1, ease: 'sine.inOut', onUpdate: setP })
      }
    }

    const startLanding = () => {
      if (phase !== 'flight') return
      phase = 'landing'
      busy = true
      tl?.kill()
      p.v = progressRef.current
      tl = gsap.timeline({ onComplete: () => { phase = 'landed'; busy = false } })
      tl.to(p, { v: FLARE_T, duration: 3.0, ease: 'power1.in', onUpdate: setP })
        .to(p, { v: 1, duration: 2.0, ease: 'power2.out', onUpdate: setP })
    }

    // climb back up onto the last leg from the landing
    const reverseLanding = () => {
      if (phase !== 'landing' && phase !== 'landed') return
      phase = 'reversing'
      busy = true
      tl?.kill()
      p.v = progressRef.current
      tl = gsap.timeline({ onComplete: () => { phase = 'flight'; legIndex = N - 1; busy = false } })
      tl.to(p, { v: END_T, duration: 2.4, ease: 'power2.out', onUpdate: setP })
    }

    // "fly again" — reset to the parked runway to read the whole flight again
    const restart = () => {
      tl?.kill()
      phase = 'ground'
      legIndex = 0
      busy = false
      p.v = 0
      maneuverRef.current.active = false
      progressRef.current = 0
      window.scrollTo(0, 0)
    }
    restartRef.current = restart

    const forward = () => {
      if (phase === 'ground') startTakeoff()
      else if (phase === 'flight') {
        if (legIndex < N - 1) goToLeg(legIndex + 1, false)
        else startLanding()
      }
    }
    const backward = () => {
      if (phase === 'flight' && legIndex > 0) goToLeg(legIndex - 1, true)
      else if (phase === 'landing' || phase === 'landed') reverseLanding()
    }

    const onWheel = (e) => {
      if (busy || uiLockRef.current) return
      if (e.deltaY > 4) forward()
      else if (e.deltaY < -4) backward()
    }
    const onKey = (e) => {
      if (busy || uiLockRef.current) return
      if (['ArrowDown', 'PageDown', ' ', 'Spacebar', 'Enter'].includes(e.key)) forward()
      else if (['ArrowUp', 'PageUp'].includes(e.key)) backward()
    }
    let touchY = null
    const onTouchStart = (e) => (touchY = e.touches[0]?.clientY ?? null)
    const onTouchMove = (e) => {
      if (busy || uiLockRef.current || touchY == null) return
      const dy = touchY - (e.touches[0]?.clientY ?? touchY) // >0 = swipe up = forward
      if (dy > 26) { forward(); touchY = e.touches[0]?.clientY }
      else if (dy < -26) { backward(); touchY = e.touches[0]?.clientY }
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })

    return () => {
      tl?.kill()
      doc.style.overflow = ''
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
          <Scene3D progressRef={progressRef} maneuverRef={maneuverRef} />
          <WindFX progressRef={progressRef} />
          <NavInstruments progressRef={progressRef} />
          <FlightHUD progressRef={progressRef} navRef={navRef} uiLockRef={uiLockRef} onFlyAgain={() => restartRef.current && restartRef.current()} />
          <FlightAudio progressRef={progressRef} />
        </>
      )}
    </>
  )
}

export default App
