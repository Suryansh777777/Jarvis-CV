"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useStore } from "@/store/useStore";
import "mapbox-gl/dist/mapbox-gl.css";

// Placeholder token - User needs to replace this!
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function MapboxScene() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  // Select only UI state to prevent re-renders on map movement
  const timeSpeed = useStore((state) => state.timeSpeed);
  const isManipulatingTime = useStore((state) => state.isManipulatingTime);
  
  // Time Stone Effect: Cycle Light Presets
  const [timeOfDay, setTimeOfDay] = useState(12); // 0-24 hours

  useEffect(() => {
    if (isManipulatingTime) {
      const interval = setInterval(() => {
        setTimeOfDay((prev) => {
            // Responsive speed based on gesture
            const delta = (timeSpeed - 1.0) * 0.5; 
            let next = prev + delta;
            if (next > 24) next = 0;
            if (next < 0) next = 24;
            return next;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isManipulatingTime, timeSpeed]);

  // Determine Light Preset based on Time
  const lightPreset = 
    timeOfDay >= 6 && timeOfDay < 17 ? "day" :
    timeOfDay >= 17 && timeOfDay < 19 ? "dusk" :
    timeOfDay >= 19 || timeOfDay < 5 ? "night" :
    "dawn";

  // Initialize Map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    if (!MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/suryansh777777/cmibdpk3f00ev01qqcos791pd",
      projection: { name: 'globe' } as any, // Type assertion for newer mapbox-gl versions
      center: [72.8777, 19.0760], // Mumbai
      zoom: 1.5,
      pitch: 60,
      bearing: 0,
    });

    map.current.on('load', () => {
        // Add terrain if not exists
        if (!map.current?.getSource('mapbox-dem')) {
            map.current?.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
            });
            map.current?.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
        }

        // Add 3D buildings layer if not exists
        if (!map.current?.getLayer('3d-buildings')) {
            // Insert the layer beneath any symbol layer.
            const layers = map.current?.getStyle()?.layers;
            const labelLayerId = layers?.find(
                (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
            )?.id;

            map.current?.addLayer(
                {
                    'id': '3d-buildings',
                    'source': 'composite',
                    'source-layer': 'building',
                    'filter': ['==', 'extrude', 'true'],
                    'type': 'fill-extrusion',
                    'minzoom': 15,
                    'paint': {
                        'fill-extrusion-color': '#aaa',
                        // Use an 'interpolate' expression to
                        // add a smooth transition effect to
                        // the buildings as the user zooms in.
                        'fill-extrusion-height': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'height']
                        ],
                        'fill-extrusion-base': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'min_height']
                        ],
                        'fill-extrusion-opacity': 0.6
                    }
                },
                labelLayerId
            );
        }
    });

  }, []);

  // Update Light Preset
  useEffect(() => {
    if (!map.current) return;
    if (map.current.isStyleLoaded()) {
        try {
            map.current.setConfig('basemap', { lightPreset: lightPreset });
        } catch (e) {
            console.warn("Could not set map config", e);
        }
    }
  }, [lightPreset]);

  // Animation Loop for Smooth Movement
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
        const { globeRotation, globeScale, globeCenter, isManipulatingTime } = useStore.getState();
        
        if (map.current && !isManipulatingTime) {
            // Calculate Targets
            const targetZoom = 1.5 + (globeScale - 1) * 8;
            const targetBearing = globeRotation.y * (180 / Math.PI);
            const targetPitch = Math.max(0, Math.min(85, globeRotation.x * (180 / Math.PI) + 60));
            const targetLng = globeCenter.lng;
            const targetLat = globeCenter.lat;

            // Get Current State
            const currentZoom = map.current.getZoom();
            const currentBearing = map.current.getBearing();
            const currentPitch = map.current.getPitch();
            const currentCenter = map.current.getCenter();

            // Lerp Factor (Lower = Smoother/Slower, Higher = Snappier)
            const factor = 0.1;

            // Interpolate
            const newZoom = currentZoom + (targetZoom - currentZoom) * factor;
            const newBearing = currentBearing + (targetBearing - currentBearing) * factor;
            const newPitch = currentPitch + (targetPitch - currentPitch) * factor;
            const newLng = currentCenter.lng + (targetLng - currentCenter.lng) * factor;
            let newLat = currentCenter.lat + (targetLat - currentCenter.lat) * factor;
            
            // Safety Clamp
            newLat = Math.max(-85, Math.min(85, newLat));

            // Validate all values before passing to Mapbox
            if (
                Number.isFinite(newZoom) &&
                Number.isFinite(newBearing) &&
                Number.isFinite(newPitch) &&
                Number.isFinite(newLng) &&
                Number.isFinite(newLat)
            ) {
                // Apply Update
                map.current.jumpTo({
                    zoom: newZoom,
                    bearing: newBearing,
                    pitch: newPitch,
                    center: [newLng, newLat]
                });
            }
        }
        
        animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, []); // Run once, independent of store updates

  return (
    <div className="absolute inset-0 z-10">
      {!MAPBOX_TOKEN && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 text-white flex-col">
            <h2 className="text-2xl font-bold text-red-500">MISSING MAPBOX TOKEN</h2>
            <p>Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file</p>
         </div>
      )}
      
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Controls UI */}
      <div className="absolute top-24 left-6 bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-cyan-500/30 text-white font-mono pointer-events-none max-w-sm shadow-[0_0_20px_rgba(0,255,255,0.1)]">
        <h3 className="text-cyan-400 font-bold text-lg mb-4 tracking-widest border-b border-white/10 pb-2">OPERATOR CONTROLS</h3>
        <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-center gap-3">
                <span className="text-cyan-300 font-bold w-16">PINCH</span>
                <span>Zoom In / Out (Two Hands)</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-cyan-300 font-bold w-16">PALM</span>
                <span>Pan / Drag Map</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-cyan-300 font-bold w-16">PEACE</span>
                <span>Rotate / Orbit (Right Hand)</span>
            </div>
           
        </div>
      </div>
      
      {/* Gesture Debug UI - Removed for cleaner look */}
    </div>
  );
}
