
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, RoundedBox } from "@react-three/drei"
import * as THREE from "three"
import { useMemo, useRef } from "react"

function Road() {
  const group = useRef(null)
  const stripes = useMemo(() => {
    const arr = []
    for (let i = -50; i < 50; i++) arr.push(i * 2)
    return arr
  }, [])
  useFrame((_, delta) => {
    if (group.current) {
      group.current.position.z += delta * 10
      if (group.current.position.z > 2) group.current.position.z = 0
    }
  })
  return (
   <group>
  <mesh
    rotation={[-Math.PI / 2, 0, 0]}
    position={[0, -0.51, 0]}
    receiveShadow
  >
    <planeGeometry args={[40, 200, 1, 1]} />
    <meshStandardMaterial color={"#0B0C10"} />
  </mesh>
  <group ref={group}>
    {stripes.map((z, i) => (
      <mesh
        key={i}
        position={[0, -0.5, z]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.4, 0.02, 1.4]} />
        <meshStandardMaterial color={"#E0FFFF"} />
      </mesh>
    ))}
  </group>
</group>
  )
}
function Car() {
  const car = useRef(null)
  const headlightLeft = useRef(null)
  const headlightRight = useRef(null)

  useFrame((state) => {
    if (!car.current) return
    car.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.02
    car.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.03
  })

  return (
    <group ref={car} position={[0, 0, 3]} rotation={[0, Math.PI, 0]}>
  {/* Main body - rounded */}
  <RoundedBox
    args={[1.6, 0.5, 3]}
    radius={0.2}
    smoothness={4}
    castShadow
    receiveShadow
  >
    <meshStandardMaterial color={"#FFD700"} metalness={0.6} roughness={0.3} />
  </RoundedBox>

  {/* Roof - curved, smaller */}
  <RoundedBox
    args={[1.2, 0.3, 1.6]}
    radius={0.09}
    smoothness={4}
    position={[0, 0.45, -0.3]}
    castShadow
    receiveShadow
  >
    <meshStandardMaterial color={"#E6BE00"} metalness={0.6} roughness={0.1} />
  </RoundedBox>

  {/* Front windshield */}
  <mesh
    position={[0, 0.4, 0.5]}
    castShadow
    receiveShadow
  >
    <boxGeometry args={[1.1, 0.25, 0.05]} />
    <meshStandardMaterial color={"#ffffff"} transparent opacity={0.4} />
  </mesh>

  {/* Smaller Headlights */}
  <mesh position={[-0.55, 0.2, 1.35]} castShadow receiveShadow>
    <sphereGeometry args={[0.06, 16, 16]} />
    <meshStandardMaterial color={"#ffffcc"} emissive={"#ffffaa"} />
  </mesh>
  <mesh position={[0.55, 0.2, 1.35]} castShadow receiveShadow>
    <sphereGeometry args={[0.06, 16, 16]} />
    <meshStandardMaterial color={"#ffffcc"} emissive={"#ffffaa"} />
  </mesh>

  {/* Wheels */}
  {[ -0.7, 0.7 ].map(x => (
    <group key={x}>
      <mesh position={[x, -0.2, 1]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.15, 32]} />
        <meshStandardMaterial color={"#222"} />
      </mesh>
      <mesh position={[x, -0.2, -1]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.15, 32]} />
        <meshStandardMaterial color={"#222"} />
      </mesh>
    </group>
  ))}

  {/* Tail lights */}
  <mesh position={[-0.5, 0.15, -1.5]} castShadow receiveShadow>
    <boxGeometry args={[0.2, 0.1, 0.05]} />
    <meshStandardMaterial color={"#ff2200"} emissive={"#d91414"} />
  </mesh>
  <mesh position={[0.5, 0.15, -1.5]} castShadow receiveShadow>
    <boxGeometry args={[0.2, 0.1, 0.05]} />
    <meshStandardMaterial color={"#ff2200"} emissive={"#d91414"} />
  </mesh>
</group>
  )
}

export default function LoadingDrive() {
  return (
    <Canvas shadows camera={{ position: [0, 4, 8], fov: 60 }} dpr={[1, 2]}>
  <color attach="background" args={["#0B0C10"]} />

  <ambientLight intensity={0.3} />

  <directionalLight
    castShadow
    position={[5, 4, 5]}
    intensity={1.2}
    shadow-mapSize-width={1024}
    shadow-mapSize-height={1024}
    shadow-camera-far={50}
    shadow-camera-left={-10}
    shadow-camera-right={10}
    shadow-camera-top={10}
    shadow-camera-bottom={-10}
  />
  <Road />
  <Car />
  <OrbitControls enabled={true} />
</Canvas>
  )
}
