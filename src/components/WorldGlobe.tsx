"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/store/useStore";
import * as THREE from "three";
import { GlobeMethods } from "react-globe.gl";

// Dynamically import Globe with SSR disabled
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

// --- Types ---
interface FlightArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string | string[];
}

// --- Helper: Generate Random Flights ---
function generateFlights(count: number): FlightArc[] {
  const flights: FlightArc[] = [];
  for (let i = 0; i < count; i++) {
    flights.push({
      startLat: (Math.random() - 0.5) * 160,
      startLng: (Math.random() - 0.5) * 360,
      endLat: (Math.random() - 0.5) * 160,
      endLng: (Math.random() - 0.5) * 360,
      color: ["#ff0000", "#ffffff"],
    });
  }
  return flights;
}

export default function WorldGlobe() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const { globeRotation, globeScale, timeSpeed } = useStore();
  const [mounted, setMounted] = useState(false);
  
  // Generate static flights
  const flights = useMemo(() => generateFlights(30), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync Rotation & Time Speed
  useEffect(() => {
    if (globeRef.current) {
      // Apply rotation from store (if gesture is active)
      // Note: react-globe.gl controls its own camera, but we can influence it
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5 * timeSpeed; // Control speed with Time Stone
      }
    }
  }, [timeSpeed]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-10">
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        arcsData={flights}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={(d) => 4000 / timeSpeed} // Dynamic speed control
        arcStroke={0.5}
        atmosphereColor="#3a228a"
        atmosphereAltitude={0.2}
        width={window.innerWidth}
        height={window.innerHeight}
        backgroundColor="rgba(0,0,0,0)"
      />
    </div>
  );
}
