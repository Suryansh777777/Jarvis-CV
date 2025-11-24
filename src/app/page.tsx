import WebcamProcessorNeural from "@/components/WebcamProcessorNeural";
import GlobeScene from "@/components/GlobeScene";
import HUD from "@/components/HUD";
import HandUI from "@/components/HandUI";
import Link from "next/link";
import NeuralScene from "@/components/NeuralScene";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden ">
      {/* Background: Webcam Feed */}
      <WebcamProcessorNeural />

      {/* Middle Layer:  NeuralScene  */}
      <NeuralScene />

      {/* 3. Hand Interactions Layer */}
       <HandUI />

      {/* Navigation Buttons */}
    <div className="absolute bottom-10 right-10 z-50 flex flex-col gap-4 items-end">
        <Link href="/overwatch">
          <button className="px-6 py-3 bg-blue-900/20 border border-blue-500/50 text-blue-400 rounded-none font-mono text-sm tracking-[0.2em] hover:bg-blue-500/20 hover:text-blue-200 transition-all duration-300 backdrop-blur-sm group w-64 text-right flex">
            <span className="mr-2 group-hover:animate-pulse">🌍</span>
            GLOBAL_OVERWATCH
          </button>
        </Link>
      </div>
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
