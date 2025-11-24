"use client";

import { useStore, GestureType } from "@/store/useStore";
import { motion } from "framer-motion";

const Repulsor = ({ gesture }: { gesture: GestureType }) => {
  const color = 
    gesture === 'GRAB' ? '#ef4444' : // Red
    gesture === 'PALM_OPEN' ? '#00ffff' : // Cyan
    gesture === 'PINCH' ? '#eab308' : // Yellow
    '#3b82f6'; // Blue

  return (
    <div className="relative w-24 h-24 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      {/* Inner Core */}
      <motion.div 
        className="absolute inset-0 rounded-full border-2 opacity-80"
        style={{ borderColor: color, boxShadow: `0 0 15px ${color}` }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Rotating Ring 1 */}
      <motion.div 
        className="absolute inset-2 rounded-full border border-dashed opacity-60"
        style={{ borderColor: color }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      {/* Rotating Ring 2 (Counter) */}
      <motion.div 
        className="absolute inset-4 rounded-full border border-dotted opacity-60"
        style={{ borderColor: color }}
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Center Point */}
      <div 
        className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"
      />
      
      {/* Label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-widest" style={{ color }}>
        {gesture}
      </div>
    </div>
  );
};

export default function HandUI() {
  const { handUiData } = useStore();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">

      {/* Left Hand UI */}
      {handUiData.left.visible && (
        <div 
          className="absolute"
          style={{ 
            left: `${(1 - handUiData.left.x) * 100}%`, 
            top: `${handUiData.left.y * 100}%` 
          }}
        >
          <Repulsor gesture={handUiData.left.gesture} />
        </div>
      )}

      {handUiData.right.visible && (
        <div 
          className="absolute"
          style={{ 
            left: `${(1 - handUiData.right.x) * 100}%`, 
            top: `${handUiData.right.y * 100}%` 
          }}
        >
          <Repulsor gesture={handUiData.right.gesture} />
        </div>
      )}
    </div>
  );
}

