"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { Shield, Activity, Cpu, Radio, Crosshair } from "lucide-react";

const Hexagon = ({ className }: { className?: string }) => (
  <div className={`relative w-4 h-4 ${className}`}>
    <div className="absolute inset-0 border border-cyan-500/50 rotate-45" />
  </div>
);

const DataRow = ({ label, value, color = "text-cyan-400" }: { label: string, value: string, color?: string }) => (
  <div className="flex justify-between items-center text-xs font-mono border-b border-cyan-900/30 pb-1 mb-1">
    <span className="text-cyan-500/70 tracking-widest">{label}</span>
    <span className={`${color} font-bold`}>{value}</span>
  </div>
);

export default function HUD() {
  const { faceLandmarks, hudState, updateHUD } = useStore();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scanLine, setScanLine] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(35);

  // Parallax Effect based on Face Position
  useEffect(() => {
    if (faceLandmarks && faceLandmarks.length > 0) {
      // Smooth follow
      const nose = faceLandmarks[1];
      const targetX = (nose.x - 0.5) * -30; // Inverted for mirror feel
      const targetY = (nose.y - 0.5) * -30;
      
      setOffset(prev => ({
        x: prev.x + (targetX - prev.x) * 0.1,
        y: prev.y + (targetY - prev.y) * 0.1
      }));
    }
  }, [faceLandmarks]);

  // Simulation Data
  useEffect(() => {
    const interval = setInterval(() => {
      updateHUD({
        powerLevel: Math.floor(95 + Math.random() * 5),
        systemStatus: Math.random() > 0.9 ? 'WARNING' : 'NOMINAL',
      });
      setScanLine(prev => (prev + 1) % 100);
      setCpuUsage(Math.floor(Math.random() * 20 + 30));
    }, 1000);
    return () => clearInterval(interval);
  }, [updateHUD]);

  return (
    <div 
      className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
      style={{ 
        perspective: "1000px",
      }}
    >
      {/* Moving Container with Parallax */}
      <motion.div 
        className="w-full h-full relative"
        animate={{ x: offset.x, y: offset.y }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      >
        {/* TOP LEFT: System Core */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-10 left-10 w-64 holographic-panel p-4 rounded-tl-2xl clip-corner-br"
        >
          <div className="flex items-center gap-2 mb-2 border-b border-cyan-500/30 pb-2">
             <Cpu className="text-cyan-400 animate-pulse" size={18} />
             <span className="text-sm font-bold text-cyan-300 tracking-[0.2em]">CORE SYSTEMS</span>
          </div>
          <DataRow label="CPU" value={`${cpuUsage}%`} />
          <DataRow label="MEM" value="16.4 TB" />
          <DataRow label="NET" value="SECURE" color="text-green-400" />
          
          <div className="mt-2 flex gap-1">
            {[...Array(10)].map((_, i) => (
               <div key={i} className={`h-1 w-full rounded-sm ${i < 7 ? 'bg-cyan-500' : 'bg-cyan-900'}`} />
            ))}
          </div>
        </motion.div>

        {/* TOP RIGHT: J.A.R.V.I.S Identity */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-10 right-10 text-right"
        >
           <h1 className="text-4xl font-bold text-white tracking-[0.2em] text-glow opacity-90">
             J.A.R.V.I.S
           </h1>
           <div className="flex items-center justify-end gap-2 text-cyan-400 text-xs tracking-[0.4em] mt-1">
             <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
             ONLINE
           </div>
        </motion.div>

        {/* BOTTOM RIGHT: Environmental Data */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-20 right-10 w-72 holographic-panel p-4 clip-corner-tl"
        >
           <div className="flex justify-between items-end mb-4">
             <span className="text-4xl font-thin text-white font-tech">{hudState.powerLevel}%</span>
             <span className="text-xs text-cyan-500 mb-1">OUTPUT CAPACITY</span>
           </div>
           
           <div className="space-y-1">
              <div className="flex justify-between text-xs text-cyan-400">
                 <span>THREAT ANALYSIS</span>
                 <span className={hudState.threatLevel === 'MINIMAL' ? 'text-green-400' : 'text-red-500'}>
                    {hudState.threatLevel}
                 </span>
              </div>
              <div className="h-1 bg-cyan-900/50 w-full">
                 <motion.div 
                   className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                   initial={{ width: 0 }}
                   animate={{ width: '30%' }}
                 />
              </div>
           </div>
        </motion.div>

        {/* BOTTOM LEFT: Log Stream */}
        <motion.div 
           initial={{ opacity: 0, x: -50 }}
           animate={{ opacity: 1, x: 0 }}
           className="absolute bottom-20 left-10 w-64 text-xs font-mono text-cyan-500/60 space-y-1"
        >
           <p>&gt; Initializing biometric sensors...</p>
           <p>&gt; Connecting to satellite array...</p>
           <p>&gt; Hand tracking active.</p>
           <p className="text-cyan-300 animate-pulse">&gt; {hudState.message}</p>
        </motion.div>

        {/* CENTER: Reticle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-20 pointer-events-none">
           <div className="absolute inset-0 border border-cyan-500/30 rounded-full scale-[0.8]" />
           <div className="absolute inset-0 border-l border-r border-cyan-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-cyan-500/50" />
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-cyan-500/50" />
           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-cyan-500/50" />
           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-cyan-500/50" />
        </div>

      </motion.div>

      {/* Static Overlays (Vignette/Scanlines) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,black_120%)] pointer-events-none opacity-50" />
      <div className="absolute inset-0 scanline opacity-10 pointer-events-none" />
    </div>
  );
}
