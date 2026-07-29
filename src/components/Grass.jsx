import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { GROUND_Y, DEPARTURE_Z, ARRIVAL_Z } from '../data/timeline.js'

// grass_pbr.glb = the grass pack (converted to standard PBR). We use only the
// SMALL tuft meshes, kept small and packed densely into a meadow — the big
// "lawn" meshes have huge blades and are ignored.
const GRASS_URL = `${import.meta.env.BASE_URL}models/grass/grass_pbr.glb`
const TAU = Math.PI * 2
const RUNWAY_CLEAR = 11 // keep grass beyond the runway edge

function rand(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// a dense, jittered grid of small tufts filling the airfield either side of both
// runways, so the ground reads as a grassy meadow
function buildPlacements() {
  const items = []
  let seed = 7
  for (const cz of [DEPARTURE_Z, ARRIVAL_Z]) {
    for (const sign of [-1, 1]) {
      for (let gx = 16; gx <= 96; gx += 8) {
        for (let gz = cz - 130; gz <= cz + 130; gz += 8) {
          const s = seed++
          const x = sign * Math.max(RUNWAY_CLEAR, gx + (rand(s) - 0.5) * 7)
          items.push({
            rv: rand(s * 5.3),
            x,
            z: gz + (rand(s * 1.3) - 0.5) * 7,
            h: 1.2 + rand(s * 2.1) * 1.4, // short grass 1.2..2.6
            ry: rand(s * 3.7) * TAU,
          })
        }
      }
    }
  }
  return items
}

function InstancedGrass({ geometry, material, nativeH, items }) {
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
      const s = it.h / nativeH // uniform: keep each tuft's natural proportions
      e.set(0, it.ry, 0)
      q.setFromEuler(e)
      pos.set(it.x, GROUND_Y, it.z)
      scl.set(s, s, s)
      m.compose(pos, q, scl)
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [items, nativeH])

  return <instancedMesh ref={ref} args={[geometry, material, items.length]} frustumCulled={false} />
}

export default function Grass() {
  const { scene } = useGLTF(GRASS_URL)
  const items = useMemo(buildPlacements, [])

  const variants = useMemo(() => {
    scene.updateMatrixWorld(true)
    const all = []
    scene.traverse((o) => {
      if (!o.isMesh) return
      const geometry = o.geometry.clone()
      geometry.applyMatrix4(o.matrixWorld)
      geometry.computeBoundingBox()
      const bb = geometry.boundingBox
      const cx = (bb.min.x + bb.max.x) / 2
      const cz = (bb.min.z + bb.max.z) / 2
      geometry.translate(-cx, -bb.min.y, -cz) // center X/Z, base to y=0
      geometry.computeBoundingBox()
      const b = geometry.boundingBox
      const footprint = Math.max(b.max.x - b.min.x, b.max.z - b.min.z) || 1
      const nativeH = b.max.y || 1

      const material = o.material.clone()
      material.transparent = false
      material.alphaTest = 0.5
      material.depthWrite = true
      material.side = THREE.DoubleSide

      all.push({ geometry, material, nativeH, footprint })
    })

    // keep only the SMALL tuft meshes (drop the huge lawn slabs)
    const maxFp = all.reduce((mx, v) => Math.max(mx, v.footprint), 1)
    const small = all.filter((v) => v.footprint < maxFp * 0.45)
    return small.length ? small : all
  }, [scene])

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
        groups[i] && groups[i].length ? <InstancedGrass key={i} {...v} items={groups[i]} /> : null,
      )}
    </group>
  )
}

useGLTF.preload(GRASS_URL)
