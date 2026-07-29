import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { GROUND_Y, DEPARTURE_Z, ARRIVAL_Z } from '../data/timeline.js'

// A Sketchfab "low poly trees" pack: one GLB holding ~12 tree meshes (each with
// its own embedded texture). We normalise each tree to origin/upright, then
// GPU-instance them across the countryside.
const TREES_URL = `${import.meta.env.BASE_URL}models/trees/low_poly_trees.glb`
const TAU = Math.PI * 2

function rand(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// belts of plantation flanking the airports, plus sprawl down the corridor —
// each entry carries a 0..1 value used to pick a tree variant once loaded
function buildPlacements() {
  const items = []
  let seed = 3

  // tree line in the mid-ground between the airfield grass and the far city
  for (const cz of [DEPARTURE_Z, ARRIVAL_Z]) {
    for (const sign of [-1, 1]) {
      for (let i = 0; i < 75; i++) {
        const s = seed++
        items.push({
          rv: rand(s * 5.1),
          x: sign * (30 + rand(s) * 55), // 30..85
          z: cz - 80 + rand(s * 1.7) * 170,
          h: 6 + rand(s * 2.3) * 8, // 6..14
          ry: rand(s * 4.1) * TAU,
        })
      }
    }
  }
  for (const sign of [-1, 1]) {
    for (let i = 0; i < 140; i++) {
      const s = seed++
      items.push({
        rv: rand(s * 5.7),
        x: sign * (34 + rand(s) * 150), // 34..184
        z: 74 - rand(s * 1.3) * 440,
        h: 5 + rand(s * 2.7) * 9,
        ry: rand(s * 4.9) * TAU,
      })
    }
  }
  return items
}

function InstancedTree({ geometry, material, nativeH, items }) {
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
      const s = it.h / nativeH // scale so the tree reaches its target height
      e.set(0, it.ry, 0)
      q.setFromEuler(e)
      pos.set(it.x, GROUND_Y, it.z) // geometry base already sits at y=0
      scl.set(s, s, s)
      m.compose(pos, q, scl)
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [items, nativeH])

  return <instancedMesh ref={ref} args={[geometry, material, items.length]} frustumCulled={false} />
}

export default function Trees() {
  const { scene } = useGLTF(TREES_URL)
  const items = useMemo(buildPlacements, [])

  // pull each tree mesh out, bake its world orientation, and recenter it so the
  // trunk base sits at origin — ready to scatter anywhere
  const variants = useMemo(() => {
    scene.updateMatrixWorld(true)
    const out = []
    scene.traverse((o) => {
      if (!o.isMesh) return
      if (/rock/i.test(o.name)) return // keep every tree mesh, skip only the rock
      const geometry = o.geometry.clone()
      geometry.applyMatrix4(o.matrixWorld) // bake upright orientation + layout
      geometry.computeBoundingBox()
      const bb = geometry.boundingBox
      const cx = (bb.min.x + bb.max.x) / 2
      const cz = (bb.min.z + bb.max.z) / 2
      geometry.translate(-cx, -bb.min.y, -cz) // center X/Z, base to y=0
      geometry.computeBoundingBox()
      out.push({ geometry, material: o.material, nativeH: geometry.boundingBox.max.y || 1 })
    })
    return out
  }, [scene])

  // group placements by which tree variant they use
  const groups = useMemo(() => {
    const n = Math.max(1, variants.length)
    const g = variants.map(() => [])
    for (const it of items) {
      const vi = Math.min(n - 1, Math.floor(it.rv * n))
      g[vi].push(it)
    }
    return g
  }, [items, variants])

  return (
    <group>
      {variants.map((v, i) =>
        groups[i] && groups[i].length ? <InstancedTree key={i} {...v} items={groups[i]} /> : null,
      )}
    </group>
  )
}

useGLTF.preload(TREES_URL)
