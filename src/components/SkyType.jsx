import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { TIMELINE } from '../data/timeline.js'
// troika (3D text) can't parse woff2 — use the TTF conversions here. The DOM
// still uses the woff2 versions via CSS.
import goshaBold from '../assets/fonts/PPGoshaSans-Bold.ttf'
import goshaRegular from '../assets/fonts/PPGoshaSans-Regular.ttf'

// Pure floating typography (Dungyov style): a large hollow/outlined year and a
// big ghost leg-number paired with small solid labels, arranged as an
// asymmetric cluster. No card. Elements sit at slightly different Z for
// parallax, and the camera flies straight through each cluster.
//
// Colours are dark ink (not Dungyov's white) so the type reads against the
// bright cloud/sky background instead of disappearing into it.
const INK = '#1c2531'
const SUB = '#33404f'

const Z_OFFSET = -15 // sit the cluster ahead of the camera's waypoint
const FADE_NEAR = 6
const FADE_FAR = 34

function LegType({ leg, fit }) {
  const group = useRef()

  useFrame((state) => {
    if (!group.current) return
    const dist = state.camera.position.distanceTo(group.current.position)
    const t = THREE.MathUtils.clamp((FADE_FAR - dist) / (FADE_FAR - FADE_NEAR), 0, 1)
    group.current.traverse((o) => {
      if ('fillOpacity' in o) o.fillOpacity = t * (o.userData.bf ?? 1)
      if ('outlineOpacity' in o) o.outlineOpacity = t * (o.userData.bo ?? 0)
    })
  })

  return (
    <Billboard ref={group} position={[leg.pos[0], leg.pos[1], leg.pos[2] + Z_OFFSET]}>
      {/* the wide asymmetric cluster is scaled/nudged to fit narrow screens */}
      <group scale={fit.scale} position={[fit.x, 0, 0]}>
      {/* big ghost leg number, furthest back */}
      <Text
        userData={{ bf: 0, bo: 0.28 }}
        position={[3.4, 1.1, -1.5]}
        font={goshaBold}
        fontSize={3.8}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        outlineWidth={0.02}
        outlineColor={INK}
        letterSpacing={-0.04}
      >
        {leg.no}
      </Text>

      {/* large outlined HERO (years / keyword) — hollow strokes */}
      <Text
        userData={{ bf: 0, bo: 1 }}
        position={[-3.1, 1.55, -0.4]}
        font={goshaBold}
        fontSize={1.5}
        anchorX="left"
        anchorY="middle"
        maxWidth={9}
        fillOpacity={0}
        outlineWidth={0.035}
        outlineColor={INK}
        letterSpacing={-0.02}
      >
        {leg.hero}
      </Text>

      {/* solid heading */}
      <Text
        userData={{ bf: 1, bo: 0 }}
        position={[-3.1, 0.35, 0.2]}
        font={goshaBold}
        fontSize={0.62}
        anchorX="left"
        anchorY="middle"
        color={INK}
        letterSpacing={0.05}
      >
        {leg.title.toUpperCase()}
      </Text>

      {/* small tracked-out section label */}
      <Text
        userData={{ bf: 1, bo: 0 }}
        position={[-3.1, -0.18, 0.2]}
        font={goshaRegular}
        fontSize={0.28}
        anchorX="left"
        anchorY="middle"
        color={SUB}
        letterSpacing={0.22}
      >
        {leg.kicker}
      </Text>

      {/* supporting quote, floating just below/beside, closest to camera */}
      <Text
        userData={{ bf: 1, bo: 0 }}
        position={[-3.1, -0.95, 0.5]}
        font={goshaRegular}
        fontSize={0.3}
        anchorX="left"
        anchorY="top"
        maxWidth={6.4}
        lineHeight={1.45}
        color={SUB}
      >
        {leg.quote}
      </Text>
      </group>
    </Billboard>
  )
}

export default function SkyType() {
  // the cluster is authored for wide screens (spans ~8 world units); on narrow
  // / portrait viewports scale it down and re-centre so it stays on screen
  const aspect = useThree((s) => s.viewport.aspect)
  const fit =
    aspect >= 1.35
      ? { scale: 1, x: 0 }
      : aspect >= 0.9
        ? { scale: 0.74, x: -0.4 }
        : { scale: 0.5, x: -0.7 }
  return (
    <>
      {TIMELINE.map((leg) => (
        <LegType key={leg.key} leg={leg} fit={fit} />
      ))}
    </>
  )
}
