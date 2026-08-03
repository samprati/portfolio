import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { FLIGHT_PATH } from '../data/timeline.js'

// how far the mouse can nudge the view — kept small so it reads as a
// subtle parallax "look around", not a free-look camera
const MOUSE_LOOK = 6
const MOUSE_POS = 0.9

export default function CameraFlight({ progressRef, maneuverRef }) {
  const posCurve = useMemo(
    () => new THREE.CatmullRomCurve3(FLIGHT_PATH.map((s) => new THREE.Vector3(...s.pos)), false, 'catmullrom', 0.4),
    [],
  )
  const lookCurve = useMemo(
    () => new THREE.CatmullRomCurve3(FLIGHT_PATH.map((s) => new THREE.Vector3(...s.look)), false, 'catmullrom', 0.4),
    [],
  )

  const smoothed = useRef(0)
  const mouse = useRef({ x: 0, y: 0 })
  const tmpPos = useRef(new THREE.Vector3())
  const tmpLook = useRef(new THREE.Vector3())
  const tmpAhead = useRef(new THREE.Vector3())
  const tmpTurn = useRef(new THREE.Vector3())
  const time = useRef(0)

  // cached maneuver curve, rebuilt whenever a new reverse turn starts
  const man = useRef({ id: -1, curve: null })

  // build the cinematic left U-turn path from `from` (current leg) to `to`
  // (previous leg): ease forward, swing wide to the left, sweep back onto it.
  // 'centripetal' avoids the overshoot loops that made the camera flip.
  const buildManeuver = (from, to) => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const D = 12 // how far forward it presses before turning
    const W = 15 // how far left it swings (kept small so the leg text stays in view)
    const y = (a.y + b.y) / 2 // keep the turn horizontal → tangent never goes vertical
    const leftX = Math.min(a.x, b.x) - W
    const midZ = (a.z + b.z) / 2
    return new THREE.CatmullRomCurve3(
      [
        a.clone(),
        new THREE.Vector3(a.x - W * 0.4, y, a.z - D), // ease forward, start banking left
        new THREE.Vector3(leftX, y, a.z - D * 0.4), // out to the left
        new THREE.Vector3(leftX, y, midZ), // wide on the left
        new THREE.Vector3(leftX * 0.4 + b.x * 0.6, y, b.z + D * 1.2), // sweep back to centre-line
        new THREE.Vector3(b.x, y, b.z + D * 0.5), // line up directly behind the leg (approach along -z)
        b.clone(),
      ],
      false,
      'centripetal',
      0.35, // lower tension → longer, gentler arcs (no hard corners)
    )
  }

  useFrame((state, delta) => {
    time.current += delta

    const mouseDamping = 1 - Math.exp(-delta * 3.5)
    mouse.current.x += (state.pointer.x - mouse.current.x) * mouseDamping
    mouse.current.y += (state.pointer.y - mouse.current.y) * mouseDamping
    const driftX = Math.sin(time.current * 0.35) * 0.12
    const driftY = Math.cos(time.current * 0.28) * 0.08

    const m = maneuverRef && maneuverRef.current
    if (m && m.active) {
      // ---- scripted first-person left U-turn ----
      if (man.current.id !== m.id) {
        man.current = { id: m.id, curve: buildManeuver(m.from, m.to) }
      }
      // quintic smootherstep on top of the timeline ease → the turn creeps in
      // and settles out very gently, no perceptible acceleration step
      const raw = THREE.MathUtils.clamp(m.phase, 0, 1)
      const ph = raw * raw * raw * (raw * (raw * 6 - 15) + 10)
      const curve = man.current.curve
      // arc-length parameterised → constant speed (no fast snap)
      curve.getPointAt(ph, tmpPos.current)
      curve.getTangentAt(ph, tmpAhead.current) // unit tangent — never degenerate

      // ride the curve exactly — no mouse/drift jitter during the turn
      state.camera.position.copy(tmpPos.current)
      // look well along the tangent → a wide, calm sweep (minimal swing)
      tmpLook.current.copy(tmpPos.current).addScaledVector(tmpAhead.current, 20)
      // …then ease the view onto the leg's own look target through most of the
      // turn, so the destination text swings into frame early and stays readable
      if (m.toLook && ph > 0.25) {
        const bl = THREE.MathUtils.smoothstep(ph, 0.25, 1)
        tmpTurn.current.set(m.toLook[0], m.toLook[1], m.toLook[2])
        tmpLook.current.lerp(tmpTurn.current, bl)
      }
      state.camera.up.set(0, 1, 0)
      state.camera.lookAt(tmpLook.current) // pure yaw/pitch, no roll
      // gentle quaternion bank around the view axis (not Euler → no flips)
      state.camera.rotateZ(0.24 * Math.sin(ph * Math.PI))
      // keep the smoother synced so normal flight resumes without a jump
      smoothed.current = THREE.MathUtils.clamp(progressRef.current, 0, 1)
      return
    }

    // ---- normal progress-driven flight ----
    const target = THREE.MathUtils.clamp(progressRef.current, 0, 1)
    const damping = 1 - Math.exp(-delta * 4.5)
    smoothed.current += (target - smoothed.current) * damping
    const t = smoothed.current

    posCurve.getPoint(t, tmpPos.current)
    lookCurve.getPoint(t, tmpLook.current)

    state.camera.position.set(
      tmpPos.current.x + driftX + mouse.current.x * MOUSE_POS,
      tmpPos.current.y + driftY + mouse.current.y * MOUSE_POS * 0.6,
      tmpPos.current.z,
    )

    const lookTarget = tmpLook.current.clone()
    lookTarget.x += mouse.current.x * MOUSE_LOOK
    lookTarget.y += mouse.current.y * MOUSE_LOOK * 0.6
    state.camera.lookAt(lookTarget)

    const tAhead = Math.min(1, t + 0.02)
    posCurve.getPoint(tAhead, tmpAhead.current)
    const lateral = tmpAhead.current.x - tmpPos.current.x
    const targetRoll = THREE.MathUtils.clamp(-lateral * 0.05, -0.12, 0.12) + mouse.current.x * -0.05
    state.camera.rotation.z = THREE.MathUtils.lerp(state.camera.rotation.z, targetRoll, 0.06)
  })

  return null
}
