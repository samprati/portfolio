import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ROAD_START_Z, ROAD_END_Z } from '../data/timeline.js'

const TAU = Math.PI * 2
// how fast the cloud sea streams toward the camera (world units/sec, × layer wind)
const Z_FLOW = 4

function rand(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function wrap(v, min, size) {
  return min + (((v - min) % size) + size) % size
}

// A puffy cumulus cloud drawn to a canvas: a cauliflower of solid white lobes
// (biased upward so the base is flatter) with a soft blue-grey shadow graded
// onto the underside, so it reads as a lit 3D cloud, not a fog smear.
function makePuffTexture() {
  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')

  const blob = (x, y, r) => {
    const g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.68, 'rgba(255,255,255,1)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, TAU)
    ctx.fill()
  }
  // main body + billowing top bumps
  blob(128, 152, 66)
  for (const [x, y, r] of [
    [70, 124, 42], [104, 98, 52], [150, 106, 48], [190, 132, 40],
    [128, 122, 60], [92, 146, 46], [170, 150, 44], [210, 156, 34], [46, 150, 34],
  ]) {
    blob(x, y, r)
  }
  // shade the underside (top stays bright, bottom picks up a cool shadow)
  const sg = ctx.createLinearGradient(0, 70, 0, 232)
  sg.addColorStop(0, 'rgba(255,255,255,0)')
  sg.addColorStop(1, 'rgba(150,178,210,0.55)')
  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = sg
  ctx.fillRect(0, 0, size, size)
  ctx.globalCompositeOperation = 'source-over'

  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

function CloudLayer({ count, spread, length, sizeMin, sizeMax, tint, opacity, texture, seedBase, yCenter, ySpread, wind }) {
  const puffs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const s = seedBase + i * 13.7
        return {
          x: (rand(s) - 0.5) * spread,
          y: yCenter + (rand(s * 1.7) - 0.5) * ySpread,
          z: ROAD_START_Z - rand(s * 2.9) * length,
          scale: sizeMin + rand(s * 3.3) * (sizeMax - sizeMin),
          rot: rand(s * 4.1) * Math.PI,
          phase: rand(s * 5.3) * TAU,
          driftSpeed: 0.025 + rand(s * 6.1) * 0.05,
          driftAmp: 1.5 + rand(s * 6.7) * 3.5,
          bobSpeed: 0.018 + rand(s * 7.3) * 0.04,
          bobAmp: 0.4 + rand(s * 7.9) * 1.1,
          rotSpeed: (rand(s * 8.3) - 0.5) * 0.01,
          breatheSpeed: 0.05 + rand(s * 8.9) * 0.08,
        }
      }),
    [count, spread, length, sizeMin, sizeMax, seedBase, yCenter, ySpread],
  )

  const refs = useRef([])
  const zMin = ROAD_START_Z - length

  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < puffs.length; i++) {
      const sp = refs.current[i]
      if (!sp) continue
      const p = puffs[i]
      // stream from the front (far, -z) toward the back (+z, past the camera),
      // so it feels like flying into the clouds. Higher layers flow faster =
      // parallax depth. A small x-sway keeps it alive.
      sp.position.z = wrap(p.z + wind * Z_FLOW * t, zMin, length)
      sp.position.x = p.x + Math.sin(t * p.driftSpeed + p.phase) * p.driftAmp
      sp.position.y = p.y + Math.sin(t * p.bobSpeed + p.phase * 1.7) * p.bobAmp
      sp.material.rotation = p.rot + t * p.rotSpeed
      const sc = p.scale * (1 + Math.sin(t * p.breatheSpeed + p.phase) * 0.04)
      sp.scale.set(sc, sc, 1)
    }
  })

  return (
    <group>
      {puffs.map((p, i) => (
        <sprite
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={[p.x, p.y, p.z]}
          scale={[p.scale, p.scale, 1]}
        >
          <spriteMaterial
            map={texture}
            color={tint}
            transparent
            opacity={opacity}
            depthWrite={false}
            // NORMAL blending + real alpha = the cloud floor actually hides the
            // ground below it, so at cruise you see only a sea of cloud tops
            blending={THREE.NormalBlending}
            rotation={p.rot}
          />
        </sprite>
      ))}
    </group>
  )
}

// a thick cloud sea whose tops sit ~y36, well below the higher cruise (68) so
// the far city only peeks through as tiny tops and the clouds carry the view
const SEA = 22

export default function CloudTunnel() {
  const texture = useMemo(makePuffTexture, [])
  const length = Math.abs(ROAD_END_Z - ROAD_START_Z) + 80

  return (
    <>
      {/* far horizon band — fills densely to the vanishing point */}
      <CloudLayer count={360} spread={700} length={length} sizeMin={22} sizeMax={40} tint="#eef4fb" opacity={0.92} texture={texture} seedBase={311} yCenter={SEA - 2} ySpread={5} wind={0.7} />
      {/* THE SEA — a dense white cumulus floor */}
      <CloudLayer count={820} spread={620} length={length} sizeMin={14} sizeMax={28} tint="#ffffff" opacity={1} texture={texture} seedBase={5} yCenter={SEA} ySpread={5} wind={1.0} />
      {/* billowing tops for structure */}
      <CloudLayer count={480} spread={560} length={length} sizeMin={10} sizeMax={20} tint="#ffffff" opacity={1} texture={texture} seedBase={61} yCenter={SEA + 5} ySpread={6} wind={1.4} />
    </>
  )
}
