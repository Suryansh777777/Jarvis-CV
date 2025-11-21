"use client";
import WebcamProcessor from "@/components/WebcamProcessor";
import { DynamicNetwork, Controls, THEMES, ThemeKey } from "@/components/NeuralNetwork";
import HandUI from "@/components/HandUI";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { OrbitControls } from "@react-three/drei";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/store/useStore";

export default function NeuralPage() {
  const [theme, setTheme] = useState<ThemeKey>("CYBER");
  const [density, setDensity] = useState(1.2);
  const { globeRotation, globeScale } = useStore();

  return (
    <main className="relative w-screen h-screen overflow-hidden ">
      {/* 1. Background: Webcam Feed (Computer Vision) */}
      <WebcamProcessor />

      {/* 2. Neural Network Layer */}
      <div className="absolute inset-0 z-10">
        <div
          className="absolute inset-0 transition-colors duration-1000 pointer-events-none"
          style={{ backgroundColor: THEMES[theme].bg, opacity: 0.3 }}
        />
        <Canvas
          camera={{ position: [0, 0, 12], fov: 50 }}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: "high-performance",
          }}
        >
          <OrbitControls
            autoRotate={false} // Disable auto-rotate to let gestures control it
            enableZoom={true}
            maxDistance={25}
            minDistance={5}
          />

          {/* The Dynamic Network Visual */}
          <DynamicNetwork 
            themeKey={theme} 
            density={density} 
            active={true}
            rotation={globeRotation}
            scale={globeScale}
          />

          <EffectComposer>
            <Bloom
              luminanceThreshold={0.1}
              mipmapBlur
              intensity={1.5}
              radius={0.4}
            />
          </EffectComposer>
        </Canvas>
        <Controls
          theme={theme}
          setTheme={setTheme}
          density={density}
          setDensity={setDensity}
        />
      </div>

      {/* 3. Hand Interactions Layer */}
      <HandUI />

      {/* 4. Navigation Back */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/">
          <button className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-full text-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-200 transition-all group">
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="text-xs font-mono tracking-widest">
              RETURN TO HUD
            </span>
          </button>
        </Link>
      </div>

      {/* Overlay Title */}
      <div className="absolute top-6 right-6 z-50 text-right pointer-events-none">
        <h1 className="text-2xl font-bold text-white tracking-widest opacity-80 font-mono text-glow">
          NEURAL_INTERFACE
        </h1>
        <p className="text-cyan-400 text-xs mt-1 tracking-[0.3em] opacity-70">
          SYNAPTIC LINK ESTABLISHED
        </p>
      </div>
    </main>
  );
}
