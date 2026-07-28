import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { GROUND_Y, DEPARTURE_Z, ARRIVAL_Z } from '../data/timeline.js'

function rand(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Two "downtown" clusters sit under the airports; sparser suburbs run the
// length of the flight on both sides. Everything is one InstancedMesh of
// scaled boxes, so a few hundred buildings cost almost nothing.
function buildBuildings() {
  const items = []
  let seed = 1

  const push = (x, z, w, h, d, hue, sat, light) => {
    items.push({ x, z, w, h, d, hue, sat, light })
  }

  // downtown skylines sit FAR off to the sides of each airport — a distant
  // cluster of towers, not buildings crowding the runway
  const downtowns = [DEPARTURE_Z, ARRIVAL_Z]
  for (const cz of downtowns) {
    for (const sign of [-1, 1]) {
      for (let i = 0; i < 54; i++) {
        const s = seed++
        const x = sign * (110 + rand(s) * 80) // 110..190 units out
        const z = cz - 60 + rand(s * 1.7) * 120
        const w = 4 + rand(s * 2.3) * 7
        const d = 4 + rand(s * 2.9) * 7
        const h = 10 + rand(s * 3.7) * 24 // tall towers
        // cool concrete/glass greys, a few with a faint blue cast
        push(x, z, w, h, d, 0.58, 0.04 + rand(s * 4.1) * 0.1, 0.5 + rand(s * 4.9) * 0.28)
      }
    }
  }

  // suburbs scattered along the whole corridor, lower and wider, but kept a
  // long way from the flight path so the runway stays in open country
  for (const sign of [-1, 1]) {
    for (let i = 0; i < 130; i++) {
      const s = seed++
      const x = sign * (85 + rand(s) * 130) // 85..215 units out
      const z = 70 - rand(s * 1.3) * 400
      const w = 5 + rand(s * 2.1) * 8
      const d = 5 + rand(s * 2.7) * 8
      const h = 3 + rand(s * 3.3) * 9
      push(x, z, w, h, d, 0.09 + rand(s * 3.9) * 0.5, 0.05 + rand(s * 4.3) * 0.08, 0.52 + rand(s * 5.1) * 0.24)
    }
  }

  return items
}

export default function City() {
  const ref = useRef(null)
  const buildings = useMemo(buildBuildings, [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()
    const col = new THREE.Color()

    buildings.forEach((b, i) => {
      pos.set(b.x, GROUND_Y + b.h / 2, b.z)
      scl.set(b.w, b.h, b.d)
      m.compose(pos, q, scl)
      mesh.setMatrixAt(i, m)
      col.setHSL(b.hue, b.sat, b.light)
      mesh.setColorAt(i, col)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [buildings])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, buildings.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.82} metalness={0.05} />
    </instancedMesh>
  )
}
