import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { GROUND_Y, DEPARTURE_Z, ARRIVAL_Z } from '../data/timeline.js'

// Kenney "City Kit (Commercial)" GLBs. Each is a single mesh sharing one
// colormap atlas, so we can instance them cheaply.
const DIR = `${import.meta.env.BASE_URL}models/city/`
const url = (name) => `${DIR}${name}.glb`

// taller, detailed models for the downtowns near each airport
const DOWNTOWN = [
  'building-a', 'building-e', 'building-g', 'building-i', 'building-j', 'building-l', 'building-n',
  'building-skyscraper-a', 'building-skyscraper-b', 'building-skyscraper-c', 'building-skyscraper-d', 'building-skyscraper-e',
]
// cheap low-detail models for the sprawl along the route
const SUBURB = [
  'low-detail-building-a', 'low-detail-building-c', 'low-detail-building-e', 'low-detail-building-g',
  'low-detail-building-i', 'low-detail-building-k', 'low-detail-building-m',
  'low-detail-building-wide-a', 'low-detail-building-wide-b',
]
const ALL = [...DOWNTOWN, ...SUBURB]

function rand(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// scatter buildings: far-off downtowns beside the airports, sprawl along the
// corridor — all kept well clear of the runway/flight path
function buildPlacements() {
  const items = []
  let seed = 1
  const push = (o) => items.push(o)

  // downtown skylines flank each airport — close enough to read as a city, but
  // starting past the airfield (x ≥ 52) so nothing sits on the runway
  for (const cz of [DEPARTURE_Z, ARRIVAL_Z]) {
    for (const sign of [-1, 1]) {
      for (let i = 0; i < 55; i++) {
        const s = seed++
        push({
          mi: Math.floor(rand(s * 1.1) * DOWNTOWN.length),
          set: 'd',
          x: sign * (95 + rand(s) * 90), // 95..185 — a distant skyline
          z: cz - 90 + rand(s * 1.7) * 180,
          h: 16 + rand(s * 2.3) * 24, // target height
          ry: Math.floor(rand(s * 4.3) * 4) * (Math.PI / 2),
        })
      }
    }
  }
  // lower sprawl running the length of the route on both sides
  for (const sign of [-1, 1]) {
    for (let i = 0; i < 150; i++) {
      const s = seed++
      push({
        mi: Math.floor(rand(s * 1.3) * SUBURB.length),
        set: 's',
        x: sign * (88 + rand(s) * 130), // 88..218
        z: 74 - rand(s * 1.9) * 440,
        h: 6 + rand(s * 2.7) * 11,
        ry: Math.floor(rand(s * 4.7) * 4) * (Math.PI / 2),
      })
    }
  }
  return items
}

function InstancedModel({ geometry, material, baseY, nativeH, items }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()

    items.forEach((it, i) => {
      // uniform scale keeps the model's designed proportions; sized so its
      // height hits the target (thin models stay thin, skyscrapers stay tall)
      const s = it.h / nativeH
      e.set(0, it.ry, 0)
      q.setFromEuler(e)
      pos.set(it.x, GROUND_Y - baseY * s, it.z) // sit the base on the ground
      scl.set(s, s, s)
      m.compose(pos, q, scl)
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [items, baseY, nativeH])

  return (
    <instancedMesh ref={ref} args={[geometry, material, items.length]} frustumCulled={false} />
  )
}

export default function City() {
  const gltfs = useGLTF(ALL.map(url))
  const items = useMemo(buildPlacements, [])

  // pull geometry + material + native size out of each loaded model
  const models = useMemo(
    () =>
      gltfs.map((g) => {
        let mesh
        g.scene.traverse((o) => {
          if (o.isMesh && !mesh) mesh = o
        })
        const geometry = mesh.geometry
        if (!geometry.boundingBox) geometry.computeBoundingBox()
        const bb = geometry.boundingBox
        const nativeH = bb.max.y - bb.min.y || 1
        return { geometry, material: mesh.material, baseY: bb.min.y, nativeH }
      }),
    [gltfs],
  )

  // group placements by which model they use
  const groups = useMemo(() => {
    const g = ALL.map(() => [])
    for (const it of items) {
      const idx = it.set === 'd' ? it.mi : DOWNTOWN.length + it.mi
      g[idx].push(it)
    }
    return g
  }, [items])

  return (
    <group>
      {models.map((mo, i) =>
        groups[i].length ? <InstancedModel key={i} {...mo} items={groups[i]} /> : null,
      )}
    </group>
  )
}

useGLTF.preload(ALL.map(url))
