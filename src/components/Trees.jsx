import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { GROUND_Y, DEPARTURE_Z, ARRIVAL_Z } from '../data/timeline.js'

function rand(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Plantation set back from the runway: a green belt of low-poly trees filling
// the open country between the airfield and the distant city, plus scattered
// woodland along the whole route.
function buildTrees() {
  const trees = []
  let seed = 3

  // belts flanking the two airports (denser landscaping near the fields)
  for (const cz of [DEPARTURE_Z, ARRIVAL_Z]) {
    for (const sign of [-1, 1]) {
      for (let i = 0; i < 70; i++) {
        const s = seed++
        const x = sign * (46 + rand(s) * 42) // 46..88, clear of the buildings
        const z = cz - 70 + rand(s * 1.7) * 150
        trees.push({ x, z, scale: 0.8 + rand(s * 2.3) * 1.1, hue: 0.28 + rand(s * 3.1) * 0.12 })
      }
    }
  }

  // sparse woodland scattered the length of the corridor
  for (const sign of [-1, 1]) {
    for (let i = 0; i < 120; i++) {
      const s = seed++
      const x = sign * (48 + rand(s) * 150)
      const z = 70 - rand(s * 1.3) * 410
      trees.push({ x, z, scale: 0.7 + rand(s * 2.7) * 1.3, hue: 0.26 + rand(s * 3.3) * 0.14 })
    }
  }

  return trees
}

const TRUNK_H = 2
const FOLIAGE_H = 5

export default function Trees() {
  const trunkRef = useRef(null)
  const leafRef = useRef(null)
  const trees = useMemo(buildTrees, [])

  useLayoutEffect(() => {
    const trunk = trunkRef.current
    const leaf = leafRef.current
    if (!trunk || !leaf) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()
    const col = new THREE.Color()

    trees.forEach((t, i) => {
      // trunk
      pos.set(t.x, GROUND_Y + (TRUNK_H * t.scale) / 2, t.z)
      scl.set(t.scale, t.scale, t.scale)
      m.compose(pos, q, scl)
      trunk.setMatrixAt(i, m)

      // foliage cone sits on top of the trunk
      pos.set(t.x, GROUND_Y + (TRUNK_H + FOLIAGE_H / 2) * t.scale, t.z)
      m.compose(pos, q, scl)
      leaf.setMatrixAt(i, m)
      col.setHSL(t.hue, 0.42, 0.34 + rand(i * 1.9) * 0.1)
      leaf.setColorAt(i, col)
    })
    trunk.instanceMatrix.needsUpdate = true
    leaf.instanceMatrix.needsUpdate = true
    if (leaf.instanceColor) leaf.instanceColor.needsUpdate = true
  }, [trees])

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, trees.length]}>
        <cylinderGeometry args={[0.35, 0.45, TRUNK_H, 5]} />
        <meshStandardMaterial color="#6b4f38" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[undefined, undefined, trees.length]}>
        <coneGeometry args={[2.2, FOLIAGE_H, 6]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
    </group>
  )
}
