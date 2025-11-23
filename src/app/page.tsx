import WebcamProcessor from "@/components/WebcamProcessor";
import GlobeScene from "@/components/GlobeScene";
import HUD from "@/components/HUD";
import HandUI from "@/components/HandUI";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden ">
      {/* Background: Webcam Feed */}
      <WebcamProcessor />

      {/* Middle Layer: 3D Hologram (Arc Reactor) */}
      <GlobeScene />

      {/* Top Layer: HUD & Hand Interactions */}
      <HUD />
      <HandUI />

      {/* Navigation Buttons */}
      <div className="absolute bottom-10 right-10 z-50 flex flex-col gap-4 items-end">
        <Link href="/overwatch">
          <button className="px-6 py-3 bg-blue-900/20 border border-blue-500/50 text-blue-400 rounded-none font-mono text-sm tracking-[0.2em] hover:bg-blue-500/20 hover:text-blue-200 transition-all duration-300 backdrop-blur-sm group w-64 text-right flex">
            <span className="mr-2 group-hover:animate-pulse">🌍</span>
            GLOBAL_OVERWATCH
          </button>
        </Link>
        <Link href="/neural">
          <button className="px-6 py-3 bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 rounded-none font-mono text-sm tracking-[0.2em] hover:bg-cyan-500/20 hover:text-cyan-200 transition-all duration-300 backdrop-blur-sm group w-64 text-right">
            <span className="mr-2 group-hover:animate-pulse">►</span>
            NEURAL_INTERFACE
          </button>
        </Link>

      </div>
    </main>
  );
}
