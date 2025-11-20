"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import clsx from "clsx";
import { Shield, Activity, Zap, Radio } from "lucide-react";

export default function HUD() {
  const { faceLandmarks, hudState, updateHUD } = useStore();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [range, setRange] = useState(2000);

  // Update offset based on face tracking
  useEffect(() => {
    if (faceLandmarks && faceLandmarks.length > 0) {
      // Nose tip is index 1
      const nose = faceLandmarks[1];
      // Calculate offset from center (0.5)
      // Invert X because of mirroring if needed, but usually movement direction matches.
      // If I move head right (screen right), HUD should maybe move slightly to simulate parallax?
      // Requirement: "HUD should appear to stay fixed in their field of view"
      // If head moves right, HUD moves right? Or opposite?
      // Usually, to stay "fixed" to the head, it moves WITH the head.
      
      const x = (nose.x - 0.5) * 50; // 50px max movement
      const y = (nose.y - 0.5) * 50;
      
      setOffset({ x, y });
    }
  }, [faceLandmarks]);

  // Simulation Interval
  useEffect(() => {
    const interval = setInterval(() => {
      const statuses: any[] = ['NOMINAL', 'OPTIMAL', 'SCANNING'];
      const threats: any[] = ['MINIMAL', 'LOW', 'MEDIUM'];
      
      setRange(Math.floor(Math.random() * 4000 + 1000));

      updateHUD({
        powerLevel: Math.floor(95 + Math.random() * 5),
        threatLevel: threats[Math.floor(Math.random() * threats.length)],
        systemStatus: statuses[Math.floor(Math.random() * statuses.length)],
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [updateHUD]);

  return (
    <div 
      className="absolute right-10 top-20 bottom-20 w-80 z-20 pointer-events-none transition-transform duration-100 ease-out"
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      {/* Main HUD Container */}
      <div className="flex flex-col h-full gap-6 p-6 bg-slate-900/30 border-l-2 border-cyan-400/50 backdrop-blur-sm rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.1)]">
        
        {/* Header */}
        <div className="border-b border-cyan-500/30 pb-2">
          <h1 className="text-2xl font-bold text-cyan-400 tracking-widest text-glow">
            J.A.R.V.I.S.
          </h1>
          <span className="text-xs text-cyan-200/70 tracking-[0.3em]">MARK-XLII</span>
        </div>

        {/* Operational Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-cyan-300">
            <span className="text-sm font-mono">SYSTEM STATUS</span>
            <span className={clsx("text-sm font-bold animate-pulse", 
              hudState.systemStatus === 'NOMINAL' ? 'text-green-400' : 'text-yellow-400'
            )}>
              {hudState.systemStatus}
            </span>
          </div>
          <div className="h-1 w-full bg-cyan-900/50 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 w-[98%] shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
          </div>
          <p className="text-xs text-cyan-400/60 font-mono typing-effect">
            &gt; All systems initializing...
            <br/>&gt; Biometric scan complete.
          </p>
        </div>

        {/* GEMINI 3 ACTIVE Panel */}
        <div className="mt-auto bg-black/40 border border-cyan-500/30 p-4 rounded relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
          
          <div className="flex items-center gap-2 mb-3 text-cyan-400">
            <Radio size={16} className="animate-pulse" />
            <h3 className="font-bold tracking-wider text-sm">GEMINI 3 ACTIVE</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1">
              <span className="text-cyan-500/70 block">RANGE</span>
              <span className="text-cyan-100">{range}m</span>
            </div>
            <div className="space-y-1">
              <span className="text-cyan-500/70 block">PWR</span>
              <span className="text-cyan-100">{hudState.powerLevel}%</span>
            </div>
            <div className="col-span-2 space-y-1 border-t border-cyan-500/20 pt-2">
              <span className="text-cyan-500/70 block">THREAT LEVEL</span>
              <span className={clsx("text-lg font-bold", 
                hudState.threatLevel === 'MINIMAL' ? 'text-green-400' : 'text-red-400'
              )}>
                {hudState.threatLevel}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Lines */}
      <div className="absolute -left-4 top-0 h-1/3 w-[2px] bg-gradient-to-b from-cyan-400/0 via-cyan-400/50 to-cyan-400/0" />
      <div className="absolute -right-4 bottom-0 h-1/3 w-[2px] bg-gradient-to-b from-cyan-400/0 via-cyan-400/50 to-cyan-400/0" />
    </div>
  );
}

