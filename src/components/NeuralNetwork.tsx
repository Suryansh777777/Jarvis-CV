"use client";

import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// --- Constants & Types ---
const MAX_PULSES = 10;
const PULSE_SPEED = 4.0; // Units per second
const PULSE_WIDTH = 1.5;

export const THEMES = {
  CYBER: {
    name: "Cyberpunk",
    bg: "#000000",
    node: "#2a0a5e",
    line: "#1a053e",
    pulse: "#00ffff", // Cyan
  },
  SOLAR: {
    name: "Solar Flare",
    bg: "#050000",
    node: "#5e2a0a",
    line: "#3e1a05",
    pulse: "#ffaa00", // Gold/Orange
  },
  MATRIX: {
    name: "The Matrix",
    bg: "#000500",
    node: "#0a5e2a",
    line: "#053e1a",
    pulse: "#00ff44", // Green
  },
  FROST: {
    name: "Permafrost",
    bg: "#000005",
    node: "#0a2a5e",
    line: "#051a3e",
    pulse: "#ffffff", // White/Blue
  },
};

export type ThemeKey = keyof typeof THEMES;

// --- GLSL Shaders ---

const vertexShader = `
  varying vec3 vPosition;
  varying float vDistance;
  
  void main() {
    vPosition = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 4.0 * (10.0 / -mvPosition.z);
  }
`;

const fragmentShader = `
  uniform vec3 uColorNode;
  uniform vec3 uColorPulse;
  uniform float uTime;
  uniform vec3 uPulseOrigins[${MAX_PULSES}];
  uniform float uPulseTimes[${MAX_PULSES}];
  uniform int uPulseCount;
  uniform float uPulseSpeed;
  uniform float uPulseWidth;
  
  varying vec3 vPosition;

  void main() {
    vec3 finalColor = uColorNode;
    float totalGlow = 0.0;

    for (int i = 0; i < ${MAX_PULSES}; i++) {
      if (i >= uPulseCount) break;
      
      float age = uTime - uPulseTimes[i];
      if (age < 0.0) continue;
      
      float dist = distance(vPosition, uPulseOrigins[i]);
      float wavePos = age * uPulseSpeed;
      
      // Ring effect: specific distance from origin
      float diff = abs(dist - wavePos);
      float glow = 1.0 - smoothstep(0.0, uPulseWidth, diff);
      
      // Fade out as it gets larger/older
      glow *= smoothstep(20.0, 0.0, wavePos); 
      
      totalGlow += glow;
    }

    // Mix pulse color based on glow intensity
    finalColor = mix(finalColor, uColorPulse, min(totalGlow, 1.0));
    
    #ifdef IS_POINT
      vec2 coord = gl_PointCoord - vec2(0.5);
      if(length(coord) > 0.5) discard;
    #endif

    gl_FragColor = vec4(finalColor, 1.0);
    
    // Add bloom brightness
    if (totalGlow > 0.5) {
        gl_FragColor.rgb += uColorPulse * (totalGlow - 0.5);
    }
  }
`;

// Helper to create ShaderMaterial
const createNetworkMaterial = (isPoint: boolean) => {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: (isPoint ? "#define IS_POINT\n" : "") + fragmentShader,
    uniforms: {
      uColorNode: { value: new THREE.Color() },
      uColorPulse: { value: new THREE.Color() },
      uTime: { value: 0 },
      uPulseOrigins: { value: new Array(MAX_PULSES).fill(new THREE.Vector3()) },
      uPulseTimes: { value: new Array(MAX_PULSES).fill(-1000) },
      uPulseCount: { value: 0 },
      uPulseSpeed: { value: PULSE_SPEED },
      uPulseWidth: { value: PULSE_WIDTH },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
};

// --- Main Component ---

export function DynamicNetwork({
  themeKey = "CYBER",
  density = 1.0,
  active = true,
  rotation = { x: 0, y: 0 },
  scale = 1.0,
}: {
  themeKey?: ThemeKey;
  density?: number; // 0.5 to 2.0
  active?: boolean;
  rotation?: { x: number; y: number };
  scale?: number;
}) {
  // 1. Generate Geometry
  const { positions, indices } = useMemo(() => {
    const count = Math.floor(1500 * density);
    const connectionDist = 1.5;

    const posArray = [];
    // Generate random points in a sphere
    for (let i = 0; i < count; i++) {
      const r = 10 * Math.cbrt(Math.random()); // Uniform sphere distribution
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      posArray.push(x, y, z);
    }

    // Generate connections
    const idxArray = [];
    for (let i = 0; i < count; i++) {
      const x1 = posArray[i * 3];
      const y1 = posArray[i * 3 + 1];
      const z1 = posArray[i * 3 + 2];

      let connected = 0;
      for (let j = i + 1; j < count; j++) {
        const x2 = posArray[j * 3];
        const y2 = posArray[j * 3 + 1];
        const z2 = posArray[j * 3 + 2];

        const d2 = (x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2;
        if (d2 < connectionDist * connectionDist) {
          idxArray.push(i, j);
          connected++;
          if (connected > 4) break; // Limit connections
        }
      }
    }

    return {
      positions: new Float32Array(posArray),
      indices: new Uint16Array(idxArray),
    };
  }, [density]);

  // 2. Shader Materials
  const pointsMat = useRef<THREE.ShaderMaterial>(null);
  const linesMat = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Initialize materials only once or when strictly needed
  if (!pointsMat.current) pointsMat.current = createNetworkMaterial(true);
  if (!linesMat.current) linesMat.current = createNetworkMaterial(false);

  // 3. Pulse State
  const pulses = useRef<{ pos: THREE.Vector3; time: number }[]>([]);

  // Trigger Pulse
  const triggerPulse = (point: THREE.Vector3) => {
    pulses.current.push({ pos: point.clone(), time: 0 }); // Time will be set in useFrame
    if (pulses.current.length > MAX_PULSES) pulses.current.shift();
  };

  // Handle Clicks
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    triggerPulse(e.point);
  };

  // Update Loop
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.visible = active;
      if (active) {
        // Auto-rotation combined with gesture rotation
        groupRef.current.rotation.y = rotation.y + state.clock.elapsedTime * 0.05;
        groupRef.current.rotation.x = rotation.x;
        groupRef.current.scale.setScalar(scale);
      }
    }
    if (!active) return;
    if (!active) return;

    const time = state.clock.elapsedTime;

    const activePulses = pulses.current;

    // Prepare arrays for uniforms
    const originArray = pointsMat.current!.uniforms.uPulseOrigins.value;
    const timeArray = pointsMat.current!.uniforms.uPulseTimes.value;

    // Reset count
    let count = 0;
    for (let i = 0; i < activePulses.length; i++) {
      const p = activePulses[i];
      if (p.time === 0) p.time = time; // Initialize on first frame see

      originArray[i].copy(p.pos);
      timeArray[i] = p.time;
      count++;
    }

    // Update Uniforms
    const updateMat = (mat: THREE.ShaderMaterial) => {
      mat.uniforms.uTime.value = time;
      mat.uniforms.uColorNode.value.set(THEMES[themeKey].node);
      // Lines slightly darker?
      mat.uniforms.uColorPulse.value.set(THEMES[themeKey].pulse);
      mat.uniforms.uPulseCount.value = count;
    };

    if (pointsMat.current) updateMat(pointsMat.current);
    if (linesMat.current) {
      updateMat(linesMat.current);
      linesMat.current.uniforms.uColorNode.value.set(THEMES[themeKey].line);
    }
  });

  return (
    <group ref={groupRef} onPointerDown={handlePointerDown}>
      <points material={pointsMat.current!}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
      </points>

      <lineSegments material={linesMat.current!}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="index" args={[indices, 1]} />
        </bufferGeometry>
      </lineSegments>
    </group>
  );
}

// --- Controls UI ---
export function Controls({
  theme,
  setTheme,
  density,
  setDensity,
}: {
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => void;
  density: number;
  setDensity: (d: number) => void;
}) {
  return (
    <div
      className="absolute bottom-10 left-1/2 transform -translate-x-1/2 
                    bg-black/80 backdrop-blur-md border border-white/10 
                    p-4 rounded-2xl flex flex-col gap-4 w-80 z-50 text-white"
    >
      <div>
        <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
          Theme
        </label>
        <div className="flex gap-2">
          {Object.keys(THEMES).map((k) => {
            const t = k as ThemeKey;
            const active = theme === t;
            return (
              <button
                key={k}
                onClick={() => setTheme(t)}
                className={`w-full py-2 text-xs font-bold rounded transition-all
                   ${
                     active
                       ? `bg-white text-black shadow-[0_0_15px_${THEMES[t].pulse}]`
                       : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                   }`}
              >
                {THEMES[t].name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs uppercase tracking-widest text-gray-400 mb-2">
          <span>Density</span>
          <span>{Math.round(density * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={density}
          onChange={(e) => setDensity(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer 
                     accent-white hover:accent-cyan-400"
        />
      </div>

      <div className="text-[10px] text-center text-gray-500 mt-1">
        CLICK ANYWHERE TO PULSE
      </div>
    </div>
  );
}

// --- Root Page Component ---
export default function DynamicNetworkCanvas() {
  const [theme, setTheme] = useState<ThemeKey>("CYBER");
  const [density, setDensity] = useState(1.0);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Color Transition */}
      <div
        className="absolute inset-0 transition-colors duration-1000 pointer-events-none"
        style={{ backgroundColor: THEMES[theme].bg }}
      />

      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 2]}
      >
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.2}
          enableDamping
          dampingFactor={0.05}
          maxDistance={30}
          minDistance={5}
        />

        <DynamicNetwork themeKey={theme} density={density} />

        <EffectComposer>
          <Bloom
            intensity={2.0}
            luminanceThreshold={0.1}
            mipmapBlur
            radius={0.4}
          />
        </EffectComposer>

        <Stats />
      </Canvas>

      <Controls
        theme={theme}
        setTheme={setTheme}
        density={density}
        setDensity={setDensity}
      />
    </div>
  );
}
