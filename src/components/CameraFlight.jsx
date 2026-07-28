import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { FLIGHT_PATH } from '../data/timeline.js'

// how far the mouse can nudge the view — kept small so it reads as a
// subtle parallax "look around", not a free-look camera
const MOUSE_LOOK = 6 // units the look-target shifts at full mouse travel
const MOUSE_POS = 0.9 // units the camera itself drifts sideways/up-down

export default function CameraFlight({ progressRef }) {
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
  const time = useRef(0)

  useFrame((state, delta) => {
    time.current += delta

    // critically-damped glide toward the scroll target instead of snapping
    // straight to it — this is what actually makes the flight feel smooth.
    const target = THREE.MathUtils.clamp(progressRef.current, 0, 1)
    const damping = 1 - Math.exp(-delta * 4.5)
    smoothed.current += (target - smoothed.current) * damping
    const t = smoothed.current

    posCurve.getPoint(t, tmpPos.current)
    lookCurve.getPoint(t, tmpLook.current)

    // smoothed mouse parallax — state.pointer is R3F's normalized (-1..1)
    // cursor position over the canvas, updated automatically on mousemove
    const mouseDamping = 1 - Math.exp(-delta * 3.5)
    mouse.current.x += (state.pointer.x - mouse.current.x) * mouseDamping
    mouse.current.y += (state.pointer.y - mouse.current.y) * mouseDamping

    // tiny idle drift so the camera never feels perfectly static, even
    // while scroll is paused
    const driftX = Math.sin(time.current * 0.35) * 0.12
    const driftY = Math.cos(time.current * 0.28) * 0.08

    state.camera.position.set(
      tmpPos.current.x + driftX + mouse.current.x * MOUSE_POS,
      tmpPos.current.y + driftY + mouse.current.y * MOUSE_POS * 0.6,
      tmpPos.current.z,
    )

    const lookTarget = tmpLook.current.clone()
    lookTarget.x += mouse.current.x * MOUSE_LOOK
    lookTarget.y += mouse.current.y * MOUSE_LOOK * 0.6
    state.camera.lookAt(lookTarget)

    // bank slightly into turns based on how the path curves ahead, plus a
    // touch of roll from the mouse itself for extra "alive" feel
    const tAhead = Math.min(1, t + 0.02)
    posCurve.getPoint(tAhead, tmpAhead.current)
    const lateral = tmpAhead.current.x - tmpPos.current.x
    const targetRoll =
      THREE.MathUtils.clamp(-lateral * 0.05, -0.12, 0.12) + mouse.current.x * -0.05
    state.camera.rotation.z = THREE.MathUtils.lerp(state.camera.rotation.z, targetRoll, 0.05)
  })

  return null
}
