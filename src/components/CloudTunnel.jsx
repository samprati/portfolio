import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ROAD_START_Z, ROAD_END_Z, CLOUD_DECK_Y, CRUISE_Y } from '../data/timeline.js'

const TAU = Math.PI * 2

function rand(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function wrap(v, min, size) {
  return min + (((v - min) % size) + size) % size
}

// A soft, irregular cloud puff drawn to a canvas so we get real alpha (the
// clouds can then OCCLUDE the ground instead of only brightening the sky like
// additive sprites do).
function makePuffTexture() {
  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  ctx.globalCompositeOperation = 'lighter'
  const lobes = 10
  for (let i = 0; i < lobes; i++) {
    const ang = (i / lobes) * TAU
    const cx = size / 2 + Math.cos(ang) * size * 0.17 * (0.4 + rand(i + 1))
    const cy = size / 2 + Math.sin(ang) * size * 0.12 * (0.4 + rand(i + 7))
    const r = size * 0.22 * (0.6 + rand(i + 13) * 0.8)
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, 'rgba(255,255,255,0.9)')
    g.addColorStop(0.5, 'rgba(255,255,255,0.35)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, TAU)
    ctx.fill()
  }
  // solid core so overlapping puffs build a floor that hides what's behind
  const g2 = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.46)
  g2.addColorStop(0, 'rgba(255,255,255,0.95)')
  g2.addColorStop(0.6, 'rgba(255,255,255,0.45)')
  g2.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g2
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.46, 0, TAU)
  ctx.fill()

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
  const xMin = -spread / 2

  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < puffs.length; i++) {
      const sp = refs.current[i]
      if (!sp) continue
      const p = puffs[i]
      const drift = wind * t + Math.sin(t * p.driftSpeed + p.phase) * p.driftAmp
      sp.position.x = wrap(p.x + drift, xMin, spread)
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

export default function CloudTunnel() {
  const texture = useMemo(makePuffTexture, [])
  const length = Math.abs(ROAD_END_Z - ROAD_START_Z) + 80

  return (
    <>
      {/* THE SEA — a dense, wide, opaque floor of cloud tops just below cruise.
          This is what hides the ground and sells the altitude. */}
      <CloudLayer count={300} spread={380} length={length} sizeMin={34} sizeMax={70} tint="#f4f8fc" opacity={1} texture={texture} seedBase={5} yCenter={CLOUD_DECK_Y + 3} ySpread={7} wind={1.0} />
      {/* bumps and billows raised on top of the sea for relief */}
      <CloudLayer count={150} spread={340} length={length} sizeMin={20} sizeMax={46} tint="#ffffff" opacity={0.95} texture={texture} seedBase={61} yCenter={CLOUD_DECK_Y + 9} ySpread={9} wind={1.25} />
      {/* soft grey underbellies, giving the deck some depth from below */}
      <CloudLayer count={90} spread={340} length={length} sizeMin={30} sizeMax={60} tint="#c7d6e6" opacity={0.7} texture={texture} seedBase={131} yCenter={CLOUD_DECK_Y - 5} ySpread={8} wind={0.9} />

      {/* eye-level wisps you streak through at cruise — the sense of speed */}
      <CloudLayer count={22} spread={80} length={length} sizeMin={7} sizeMax={18} tint="#ffffff" opacity={0.5} texture={texture} seedBase={211} yCenter={CRUISE_Y} ySpread={10} wind={2.6} />

      {/* high, thin cirrus far above */}
      <CloudLayer count={18} spread={300} length={length} sizeMin={40} sizeMax={80} tint="#dbe8f5" opacity={0.2} texture={texture} seedBase={137} yCenter={CRUISE_Y + 26} ySpread={14} wind={0.4} />
    </>
  )
}
