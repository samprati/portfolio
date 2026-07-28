import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import CloudTunnel from './CloudTunnel.jsx'
import CameraFlight from './CameraFlight.jsx'
import Runway from './Runway.jsx'
import Airports from './Airport.jsx'
import City from './City.jsx'
import Trees from './Trees.jsx'

// deeper blue up high, fading to a bright hazy band at the cloud horizon
const SKY = '#2f7fd0'

export default function Scene3D({ progressRef }) {
  return (
    <Canvas
      camera={{ fov: 62, near: 0.1, far: 900 }}
      style={{ position: 'fixed', inset: 0, background: SKY }}
      // NoToneMapping: the default filmic tone-mapping compresses dark
      // colors toward grey when they sit next to very bright (blown-out)
      // pixels — which is exactly our dark text on bright clouds. Disabling
      // it keeps text colors literal instead of exposure-compressed.
      gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
    >
      <color attach="background" args={[SKY]} />
      {/* fog pushed way back so the cloud sea reads all the way to a hazy
          horizon instead of dissolving a few units ahead */}
      <fog attach="fog" args={['#d3e7fa', 60, 340]} />
      <ambientLight intensity={1.15} color="#f5faff" />
      {/* key "sun" from high and to the side, warm-white */}
      <directionalLight position={[-40, 60, -20]} intensity={1.7} color="#fff6e8" />
      {/* cool bounce from the cloud sea below */}
      <directionalLight position={[10, -30, 20]} intensity={0.35} color="#bcd8f5" />

      <Runway />
      <City />
      <Trees />
      <Airports />

      <Suspense fallback={null}>
        <CloudTunnel />
      </Suspense>

      <CameraFlight progressRef={progressRef} />

      <EffectComposer multisampling={0}>
        {/* soft bloom lifts the cloud highlights into a high-altitude glow */}
        <Bloom intensity={0.35} luminanceThreshold={0.85} luminanceSmoothing={0.3} mipmapBlur />
        <Vignette eskil={false} offset={0.2} darkness={0.4} />
      </EffectComposer>
    </Canvas>
  )
}
