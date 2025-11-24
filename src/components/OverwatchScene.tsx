"use client";

import dynamic from "next/dynamic";

// Dynamically import MapboxScene to avoid SSR issues with mapbox-gl
const MapboxScene = dynamic(() => import("@/components/MapboxScene"), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-black/90 flex items-center justify-center text-cyan-500 font-mono animate-pulse">INITIALIZING SATELLITE UPLINK...</div>
});

export default function OverwatchScene() {
  // MapboxScene handles its own rendering and controls
  return (
    <div className="absolute inset-0 z-10">
        {/* Mapbox Scene */}
        <MapboxScene />
      
      {/* UI Overlay for Overwatch */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 tracking-[0.5em] font-mono drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            GLOBAL_OVERWATCH
        </h1>
        <p className="text-cyan-500 text-xs mt-2 tracking-[0.8em] uppercase animate-pulse">
            Satellite Uplink Established
        </p>
      </div>
    </div>
  );
}
