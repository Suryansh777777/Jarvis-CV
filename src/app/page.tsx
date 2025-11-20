import WebcamProcessor from "@/components/WebcamProcessor";
import GlobeScene from "@/components/GlobeScene";
import HUD from "@/components/HUD";

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Background: Webcam Feed & Gesture Visualization */}
      <WebcamProcessor />

      {/* Middle Layer: 3D Globe */}
      <GlobeScene />

      {/* Top Layer: UI HUD */}
      <HUD />

      {/* Vignette Effect for cinematic look */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </main>
  );
}
