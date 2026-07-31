import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { TIMELINE } from '../data/timeline.js'
// troika (3D text) can't parse woff2 — use the TTF conversions here.
import goshaBold from '../assets/fonts/PPGoshaSans-Bold.ttf'
import goshaRegular from '../assets/fonts/PPGoshaSans-Regular.ttf'

// Editorial two-column typography over the sky (no panels): a big ghost leg
// number on the left with a "leg – 0x" label, and on the right a stacked block —
// hero (years / keyword), title beneath it, a tracked kicker, then the wide body
// copy. Dark ink on the bright cloud sky. Billboards to face the camera and
// fades in on approach.

const INK = '#141b26' // hero / strong copy — near-black for punch
const TITLE = '#2f3a48' // inline title
const SUB = '#2c3644' // kicker + body — dark & crisp, not washed grey
const GHOST = '#5c6572' // big number + leg label

const Z_OFFSET = -15
// full opacity while you're parked at the leg (~15 units away); only fade out
// once you fly well past it. This is what keeps the ink crisp instead of hazy.
const FADE_NEAR = 24
const FADE_FAR = 52

const HERO_SIZE = 0.9
const NUM_X = -4.1 // ghost-number column
const LEFT = -0.4 // content column left edge
const BODY_W = 10.8 // wide body column

function LegType({ leg, scale }) {
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
      <group scale={scale}>
       {/* shift the whole block left so the wide layout stays centred on screen */}
       <group position={[-1.9, 0, 0]}>
        {/* big ghost leg number, left column */}
        <Text userData={{ bf: 0.32, bo: 0 }} position={[NUM_X, 0.55, 0]} font={goshaBold} fontSize={2.9} anchorX="center" anchorY="middle" color={GHOST} fillOpacity={0.32} letterSpacing={-0.05}>
          {leg.no}
        </Text>
        {/* "leg – 0x" label under the number */}
        <Text userData={{ bf: 0.9, bo: 0 }} position={[NUM_X, -1.25, 0]} font={goshaRegular} fontSize={0.26} anchorX="center" anchorY="middle" color={GHOST} letterSpacing={0.18}>
          {`leg – ${leg.no}`}
        </Text>

        {/* hero — years / keyword */}
        <Text userData={{ bf: 1, bo: 0 }} position={[LEFT, 2.1, 0]} font={goshaBold} fontSize={HERO_SIZE} anchorX="left" anchorY="top" maxWidth={BODY_W} color={INK} letterSpacing={-0.02}>
          {leg.hero}
        </Text>
        {/* title, stacked below the year — with breathing room */}
        <Text userData={{ bf: 1, bo: 0 }} position={[LEFT, 0.85, 0]} font={goshaBold} fontSize={0.5} anchorX="left" anchorY="top" maxWidth={BODY_W} color={TITLE} letterSpacing={0.01}>
          {leg.title}
        </Text>

        {/* tracked kicker */}
        <Text userData={{ bf: 1, bo: 0 }} position={[LEFT, 0.15, 0]} font={goshaRegular} fontSize={0.24} anchorX="left" anchorY="top" color={SUB} letterSpacing={0.2}>
          {leg.kicker}
        </Text>

        {/* wide body copy — bigger, wider, more line spacing */}
        <Text userData={{ bf: 1, bo: 0 }} position={[LEFT, -0.55, 0]} font={goshaRegular} fontSize={0.32} anchorX="left" anchorY="top" maxWidth={BODY_W} textAlign="left" lineHeight={1.65} color={SUB}>
          {leg.quote}
        </Text>
       </group>
      </group>
    </Billboard>
  )
}

export default function SkyType() {
  // scale down on narrow / portrait viewports so the layout stays on screen
  const aspect = useThree((s) => s.viewport.aspect)
  const scale = aspect >= 1.3 ? 1 : aspect >= 0.85 ? 0.82 : 0.62
  return (
    <>
      {TIMELINE.map((leg) => (
        <LegType key={leg.key} leg={leg} scale={scale} />
      ))}
    </>
  )
}
