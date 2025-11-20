import WebcamProcessor from "@/components/WebcamProcessor";
import GlobeScene from "@/components/GlobeScene";
import HUD from "@/components/HUD";
import HandUI from "@/components/HandUI";

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Background: Webcam Feed */}
      <WebcamProcessor />

      {/* Middle Layer: 3D Hologram (Arc Reactor) */}
      <GlobeScene />

      {/* Top Layer: HUD & Hand Interactions */}
      <HUD />
      <HandUI />
    </main>
  );
}
