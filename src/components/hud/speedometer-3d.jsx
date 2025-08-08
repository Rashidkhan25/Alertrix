
import { Canvas, useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import { useMemo, useRef } from "react"
import * as THREE from "three"

export default function Speedometer3D({ speed = 60, maxSpeed = 160 }) {
  const ratio = Math.min(1, Math.max(0, speed / maxSpeed))
  return (
    <div className="w-full h-[280px] md:h-[320px] rounded-md overflow-hidden relative">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <color attach="background" args={["#0B0C10"]} />
        <ambientLight intensity={1} />
        <Arc value={ratio} />
        <TickMarks />
        <DigitalReadout />
      </Canvas>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-center">
        <div className="text-2xl font-bold" style={{ color: "#E0FFFF", textShadow: "0 0 6px #00FFF7" }}>
          {speed}
          <span className="text-sm opacity-70 ml-2">km/h</span>
        </div>
      </div>
    </div>
  )
}

function Arc({ value = 0.5 }) {
  const arcRef = useRef(null)
  const baseRef = useRef(null)

  useFrame(() => {
    if (!arcRef.current) return
    const mat = arcRef.current.material
    const c = valueToColor(value)
    mat.color = new (THREE.Color)(c)
  })

  const ringGeo = useMemo(() => new THREE.TorusGeometry(2.3, 0.1, 16, 200, Math.PI), [])
  const arcGeo = useMemo(() => new THREE.TorusGeometry(2.3, 0.16, 16, 200, Math.PI * value), [value])

  return (
    <group rotation={[0, 0, Math.PI]}>
      <mesh geometry={ringGeo} ref={baseRef} position={[0, 0, 0]}>
        <meshBasicMaterial color={"#1F51FF"} transparent opacity={0.15} />
      </mesh>
      <mesh geometry={arcGeo} ref={arcRef} position={[0, 0, 0]}>
        <meshBasicMaterial color={"#00FFF7"} />
      </mesh>
    </group>
  )
}

function valueToColor(v) {
  if (v < 0.6) return "#00FFF7"
  if (v < 0.85) return "#FFC300"
  return "#FF1744"
}

function TickMarks() {
  const ticks = useMemo(() => {
    return Array.from({ length: 33 }).map((_, i) => {
      const t = i / 32
      const angle = Math.PI * t
      const r = 2.3
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      const len = i % 4 === 0 ? 0.24 : 0.14
      const rot = angle - Math.PI / 2
      return { x, y, len, rot }
    })
  }, [])
  return (
    <group rotation={[0, 0, Math.PI]}>
      {ticks.map((tk, i) => (
        <group key={i} position={[tk.x, tk.y, 0]} rotation={[0, 0, tk.rot]}>
          <mesh position={[0, tk.len / 2, 0]}>
            <boxGeometry args={[0.02, tk.len, 0.02]} />
            <meshBasicMaterial color={"#E0FFFF"} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function DigitalReadout() {
  return (
    <group position={[0, -0.2, 0]}>
      <Text fontSize={0.3} position={[0, -1.2, 0]} color={"#E0FFFF"}>
        {"SPEED"}
      </Text>
    </group>
  )
}
