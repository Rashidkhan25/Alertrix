import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Sky } from "@react-three/drei";
import { useRef } from "react";

function Stripes() {
  const group = useRef();

  useFrame((_, delta) => {
    if (!group.current) return;

    group.current.children.forEach((m) => {
      if (m.position && typeof m.position.z === "number") {
        m.position.z += delta * 10;
        if (m.position.z > 10) m.position.z = -50;
      }
    });
  });

  return (
    <group ref={group}>
      {Array.from({ length: 60 }).map((_, i) => (
        <mesh key={i} position={[i % 2 ? 1.5 : -1.5, 0, -i]}>
          <boxGeometry args={[0.2, 0.02, 0.6]} dispose={null} />
          <meshBasicMaterial color="#E0FFFF" />
        </mesh>
      ))}
    </group>
  );
}

export default function LandingScene({ dayMode = false }) {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <Canvas camera={{ position: [0, 2, 8], fov: 60 }}>
        <color attach="background" args={["#0B0C10"]} />
        {dayMode ? (
          <Sky
            distance={450000}
            sunPosition={[0, 1, 0]}
            inclination={0.49}
            azimuth={0.25}
          />
        ) : (
          <>
            <Stars
              radius={80}
              depth={50}
              count={1500}
              factor={2}
              saturation={0}
              fade
              speed={0.8}
            />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 7]} intensity={0.6} />
          </>
        )}
        <Stripes />
      </Canvas>
    </div>
  );
}
