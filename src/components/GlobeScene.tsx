"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Mesh, Group } from "three";
import { useStore } from "@/store/useStore";
import { Sphere, Torus, Ring, Environment } from "@react-three/drei";

function ArcReactor() {
  const groupRef = useRef<Group>(null);
  const ring1Ref = useRef<Mesh>(null);
  const ring2Ref = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);
  
  const { globeRotation, globeScale } = useStore();

  useFrame((state, delta) => {
    if (!groupRef.current || !ring1Ref.current || !ring2Ref.current || !coreRef.current) return;

    // Interactive Rotation
    groupRef.current.rotation.x = globeRotation.x * 0.5;
    groupRef.current.rotation.y = globeRotation.y * 0.5;

    // Idle Animation
    ring1Ref.current.rotation.z += delta * 0.5;
    ring2Ref.current.rotation.x -= delta * 0.3;
    
    // Pulse Effect
    const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
    coreRef.current.scale.setScalar(pulse);

    // Global Scale
    groupRef.current.scale.setScalar(globeScale);
  });

  return (
    <group ref={groupRef} position={[-2, 0, 0]}>
      {/* Core Glow */}
      <Sphere args={[0.4, 32, 32]} ref={coreRef}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </Sphere>
      <Sphere args={[0.6, 32, 32]}>
        <meshBasicMaterial color="#00ffff" transparent opacity={0.3} wireframe />
      </Sphere>
      
      {/* Inner Ring */}
      <Torus ref={ring1Ref} args={[0.8, 0.05, 16, 100]}>
        <meshStandardMaterial color="#0088ff" emissive="#0044aa" emissiveIntensity={2} wireframe />
      </Torus>
      
      {/* Middle Ring */}
      <Torus ref={ring2Ref} args={[1.1, 0.02, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
      </Torus>

      {/* Outer Structure */}
      <Ring args={[1.3, 1.4, 64]} rotation={[0, 0, 0]}>
         <meshStandardMaterial color="#002244" side={2} transparent opacity={0.5} />
      </Ring>
      
      {/* Floating Particles */}
      <group>
        {[...Array(8)].map((_, i) => (
          <mesh key={i} position={[
            Math.sin(i) * 1.8,
            Math.cos(i) * 1.8,
            Math.sin(i * 2) * 0.5
          ]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default function GlobeScene() {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} color="#00ffff" intensity={2} />
        <ArcReactor />
      </Canvas>
    </div>
  );
}
