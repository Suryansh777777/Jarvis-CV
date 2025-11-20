"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh } from "three";
import { useStore } from "@/store/useStore";
import { Sphere, OrbitControls } from "@react-three/drei";

function Globe() {
  const meshRef = useRef<Mesh>(null);
  const { globeRotation, globeScale } = useStore();

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Smooth interpolation could be added here
    // For now, direct mapping with some auto-rotation if idle
    // But gestures control it.

    // Apply rotation from store
    meshRef.current.rotation.x = globeRotation.x;
    meshRef.current.rotation.y = globeRotation.y;

    // Auto-rotate if no manual interaction (can be refined)
    // meshRef.current.rotation.y += delta * 0.1;

    // Apply scale
    meshRef.current.scale.setScalar(globeScale);
  });

  return (
    <group position={[-2, 0, 0]}>
      {/* Main Wireframe Globe */}
      <Sphere args={[1, 32, 32]} ref={meshRef}>
        <meshBasicMaterial
          color="#00ffff"
          wireframe
          transparent
          opacity={0.3}
        />
      </Sphere>

      {/* Inner Core (optional for effect) */}
      <Sphere args={[0.8, 16, 16]}>
        <meshBasicMaterial
          color="#0088ff"
          wireframe
          transparent
          opacity={0.1}
        />
      </Sphere>
    </group>
  );
}

export default function GlobeScene() {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Globe />
      </Canvas>
    </div>
  );
}
