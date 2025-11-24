"use client";
import WebcamProcessorOverwatch from "@/components/WebcamProcessorOverwatch";
import OverwatchScene from "@/components/OverwatchScene";
import HandUI from "@/components/HandUI";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LocationSearch from "@/components/LocationSearch";

export default function OverwatchPage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Background Video / Gesture Processor - PiP Mode */}
      <WebcamProcessorOverwatch className="fixed bottom-6 right-6 w-80 h-60 rounded-2xl overflow-hidden border-2 border-cyan-500/50 z-50 shadow-[0_0_30px_rgba(0,255,255,0.2)] bg-black/80 backdrop-blur-sm" />

      {/* 2. Overwatch Scene (Dynamic) */}
      <OverwatchScene />

      {/* 3. Hand Interactions Layer */}
      <HandUI />

      {/* 4. Navigation Back */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/">
          <button className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-full text-blue-400 hover:bg-blue-900/30 hover:text-blue-200 transition-all group">
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

      {/* 5. Location Search */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md pointer-events-auto">
        <LocationSearch />
      </div>
    </main>
  );
}
