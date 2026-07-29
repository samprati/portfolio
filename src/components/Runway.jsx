import { useMemo } from 'react'
import { GROUND_Y, ROAD_START_Z, ROAD_END_Z, ARRIVAL_Z } from '../data/timeline.js'

// A single asphalt strip with a dashed centerline and a threshold bar, laid
// flat on the ground. One sits under the takeoff, one under the landing.
function RunwayStrip({ zNear, zFar }) {
  const length = Math.abs(zNear - zFar)
  const zCenter = (zNear + zFar) / 2

  const dashes = useMemo(() => {
    const out = []
    const step = 7
    for (let z = zFar + 6; z < zNear - 6; z += step) out.push(z)
    return out
  }, [zNear, zFar])

  return (
    <group position={[0, GROUND_Y + 0.02, 0]}>
      {/* asphalt */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, zCenter]} receiveShadow>
        <planeGeometry args={[11, length]} />
        <meshStandardMaterial color="#2a2e35" roughness={1} metalness={0} />
      </mesh>
      {/* centerline dashes */}
      {dashes.map((z) => (
        <mesh key={z} rotation-x={-Math.PI / 2} position={[0, 0.03, z]}>
          <planeGeometry args={[0.5, 3]} />
          <meshStandardMaterial color="#e9edf2" roughness={0.9} />
        </mesh>
      ))}
      {/* threshold bar at the near end */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, zNear - 2]}>
        <planeGeometry args={[9, 1.2]} />
        <meshStandardMaterial color="#e9edf2" roughness={0.9} />
      </mesh>
    </group>
  )
}

export default function Runway() {
  // wide, hazy ground plane so there's a horizon to climb away from and
  // descend back toward; the scene fog melts its far edge into the sky
  const groundLength = Math.abs(ROAD_END_Z - ROAD_START_Z) + 120

  return (
    <>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, GROUND_Y, (ROAD_START_Z + ROAD_END_Z) / 2]}
        receiveShadow
      >
        <planeGeometry args={[600, groundLength]} />
        {/* earthy base under the 3D grass; the grass patches provide the green,
            and gaps read as soil rather than a flat green field */}
        <meshStandardMaterial color="#8f9068" roughness={1} metalness={0} />
      </mesh>

      {/* departure runway (under the takeoff) */}
      <RunwayStrip zNear={ROAD_START_Z} zFar={6} />
      {/* arrival runway (under the landing) */}
      <RunwayStrip zNear={ARRIVAL_Z + 26} zFar={ROAD_END_Z} />
    </>
  )
}
