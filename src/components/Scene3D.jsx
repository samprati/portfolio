import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import CloudTunnel from './CloudTunnel.jsx'
import CameraFlight from './CameraFlight.jsx'
import Runway from './Runway.jsx'
import Airports from './Airport.jsx'
import City from './City.jsx'
import Trees from './Trees.jsx'
import Grass from './Grass.jsx'
import SkyType from './SkyType.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

// deeper blue up high, fading to a bright hazy band at the cloud horizon
const SKY = '#2f7fd0'

// A gradient sky dome: deep blue at the zenith → hazy pale at the horizon,
// like the view from a cruising airliner. It follows the camera so the
// gradient always sits correctly against the horizon.
function SkyDome() {
  const ref = useRef()
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color('#0f3a78') },
          mid: { value: new THREE.Color('#3f8ad8') },
          horizon: { value: new THREE.Color('#dfeef9') },
        },
        vertexShader: `
          varying vec3 vDir;
          void main() {
            vDir = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          varying vec3 vDir;
          uniform vec3 top; uniform vec3 mid; uniform vec3 horizon;
          void main() {
            float h = normalize(vDir).y;
            vec3 col = mix(horizon, mid, smoothstep(0.0, 0.30, h));
            col = mix(col, top, smoothstep(0.30, 0.85, h));
            col = mix(col, horizon, smoothstep(0.0, -0.20, h)); // haze below
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  )
  useFrame(({ camera }) => {
    if (ref.current) ref.current.position.copy(camera.position)
  })
  return (
    <mesh ref={ref} material={material} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[800, 32, 16]} />
    </mesh>
  )
}

// The close-up scenery (runway, airport, trees, grass) is only for takeoff and
// landing — it's hidden once above the cloud deck so the cruise view stays a
// clean sea of clouds and the section text keeps the focus. The distant city
// stays visible (its small tops peek through the clouds far away).
function LowScenery({ children }) {
  const ref = useRef()
  useFrame(({ camera }) => {
    if (ref.current) ref.current.visible = camera.position.y < 40
  })
  return <group ref={ref}>{children}</group>
}

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
      <SkyDome />
      {/* fog tuned to the horizon haze so the cloud sea melts into the sky */}
      <fog attach="fog" args={['#dbecf8', 70, 360]} />
      <ambientLight intensity={1.15} color="#f5faff" />
      {/* key "sun" from high and to the side, warm-white */}
      <directionalLight position={[-40, 60, -20]} intensity={1.7} color="#fff6e8" />
      {/* cool bounce from the cloud sea below */}
      <directionalLight position={[10, -30, 20]} intensity={0.35} color="#bcd8f5" />

      {/* close scenery — only near the ground (takeoff / landing) */}
      <LowScenery>
        <Runway />
        <Airports />
        <Suspense fallback={null}>
          <ErrorBoundary>
            <Trees />
          </ErrorBoundary>
          <ErrorBoundary>
            <Grass />
          </ErrorBoundary>
        </Suspense>
      </LowScenery>

      {/* distant city + sky — always visible */}
      <Suspense fallback={null}>
        <ErrorBoundary>
          <City />
        </ErrorBoundary>
        <ErrorBoundary>
          <SkyType />
        </ErrorBoundary>
        <CloudTunnel />
      </Suspense>

      <CameraFlight progressRef={progressRef} />

      <EffectComposer multisampling={0}>
        {/* very light bloom — enough for a soft glow, not a white-out */}
        <Bloom intensity={0.12} luminanceThreshold={0.92} luminanceSmoothing={0.3} mipmapBlur />
        <Vignette eskil={false} offset={0.2} darkness={0.4} />
      </EffectComposer>
    </Canvas>
  )
}
