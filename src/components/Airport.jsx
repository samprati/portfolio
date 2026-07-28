import { GROUND_Y, DEPARTURE_Z, ARRIVAL_Z } from '../data/timeline.js'

// A simple low-poly airliner built from boxes, parked on the apron.
function ParkedPlane({ position, rotation = 0, accent = '#e2483d' }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* fuselage */}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[1.8, 1.8, 12]} />
        <meshStandardMaterial color="#f2f4f7" roughness={0.5} />
      </mesh>
      {/* nose taper */}
      <mesh position={[0, 1.6, 6.4]}>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <meshStandardMaterial color="#f2f4f7" roughness={0.5} />
      </mesh>
      {/* cheat-line accent */}
      <mesh position={[0, 2.0, 0]}>
        <boxGeometry args={[1.82, 0.4, 11.6]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
      {/* wings */}
      <mesh position={[0, 1.5, -0.5]}>
        <boxGeometry args={[15, 0.35, 3]} />
        <meshStandardMaterial color="#e7ebf0" roughness={0.6} />
      </mesh>
      {/* horizontal stabilizers */}
      <mesh position={[0, 1.9, -5.4]}>
        <boxGeometry args={[6, 0.3, 1.6]} />
        <meshStandardMaterial color="#e7ebf0" roughness={0.6} />
      </mesh>
      {/* tail fin */}
      <mesh position={[0, 3.1, -5.4]}>
        <boxGeometry args={[0.35, 3, 2.2]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
    </group>
  )
}

// One airport laid out beside a runway centered at z = `z`. Everything is set
// well back from the runway edge (±5.5) so there's open apron and airfield
// between the tarmac and any structure.
function Airport({ z }) {
  return (
    <group position={[0, GROUND_Y, z]}>
      {/* apron / tarmac strip on the terminal side, set back from the runway */}
      <mesh rotation-x={-Math.PI / 2} position={[-24, 0.03, 0]}>
        <planeGeometry args={[24, 72]} />
        <meshStandardMaterial color="#3a3f47" roughness={1} />
      </mesh>
      {/* taxiway connecting apron to runway */}
      <mesh rotation-x={-Math.PI / 2} position={[-9, 0.03, 20]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#3a3f47" roughness={1} />
      </mesh>

      {/* terminal — long low building, set back ~24 units */}
      <mesh position={[-30, 3.5, 0]}>
        <boxGeometry args={[9, 7, 32]} />
        <meshStandardMaterial color="#e4e8ee" roughness={0.7} />
      </mesh>
      <mesh position={[-30, 7.3, 0]}>
        <boxGeometry args={[9.6, 0.6, 32.6]} />
        <meshStandardMaterial color="#b7c1cd" roughness={0.7} />
      </mesh>
      {/* window strip facing the runway */}
      <mesh position={[-25.4, 3.6, 0]}>
        <boxGeometry args={[0.3, 2.6, 30]} />
        <meshStandardMaterial color="#2b3a49" roughness={0.35} metalness={0.3} />
      </mesh>

      {/* control tower, off to the far right */}
      <group position={[20, 0, 12]}>
        <mesh position={[0, 8, 0]}>
          <boxGeometry args={[2.4, 16, 2.4]} />
          <meshStandardMaterial color="#d3dae1" roughness={0.7} />
        </mesh>
        <mesh position={[0, 16.5, 0]}>
          <boxGeometry args={[4.6, 3, 4.6]} />
          <meshStandardMaterial color="#263a49" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[0, 18.4, 0]}>
          <boxGeometry args={[5.2, 0.5, 5.2]} />
          <meshStandardMaterial color="#aeb8c4" roughness={0.7} />
        </mesh>
      </group>

      {/* hangars, well back on the right */}
      {[-14, -30].map((dz) => (
        <group key={dz} position={[36, 0, dz]}>
          <mesh position={[0, 4, 0]}>
            <boxGeometry args={[15, 8, 12]} />
            <meshStandardMaterial color="#c6cdd5" roughness={0.8} />
          </mesh>
          <mesh position={[-7.55, 3.4, 0]}>
            <boxGeometry args={[0.3, 6.4, 10]} />
            <meshStandardMaterial color="#3b4652" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* parked jets on the apron, nosed toward the runway */}
      <ParkedPlane position={[-24, 0, 12]} rotation={Math.PI / 2} accent="#e2483d" />
      <ParkedPlane position={[-24, 0, -6]} rotation={Math.PI / 2} accent="#2f7fd0" />
    </group>
  )
}

export default function Airports() {
  return (
    <>
      {/* departure airport (under the takeoff) */}
      <Airport z={DEPARTURE_Z} />
      {/* arrival airport (under the landing) */}
      <Airport z={ARRIVAL_Z} />
    </>
  )
}
