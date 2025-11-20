import { create } from 'zustand';

interface Point {
  x: number;
  y: number;
  z: number;
}

interface HandLandmark extends Point {}
interface FaceLandmark extends Point {}

interface HUDState {
  systemStatus: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  powerLevel: number;
  threatLevel: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
}

interface StoreState {
  // Tracking Data
  faceLandmarks: FaceLandmark[] | null;
  leftHand: HandLandmark[] | null;
  rightHand: HandLandmark[] | null;
  
  // Globe State
  globeRotation: { x: number; y: number };
  globeScale: number;
  
  // HUD State
  hudState: HUDState;

  // Actions
  setFaceLandmarks: (landmarks: FaceLandmark[] | null) => void;
  setHands: (left: HandLandmark[] | null, right: HandLandmark[] | null) => void;
  setGlobeRotation: (rotation: { x: number; y: number }) => void;
  setGlobeScale: (scale: number) => void;
  updateHUD: (updates: Partial<HUDState>) => void;
}

export const useStore = create<StoreState>((set) => ({
  faceLandmarks: null,
  leftHand: null,
  rightHand: null,
  
  globeRotation: { x: 0, y: 0 },
  globeScale: 1.5,
  
  hudState: {
    systemStatus: 'NOMINAL',
    powerLevel: 100,
    threatLevel: 'MINIMAL',
    message: 'INITIALIZING SYSTEMS...'
  },

  setFaceLandmarks: (landmarks) => set({ faceLandmarks: landmarks }),
  setHands: (left, right) => set({ leftHand: left, rightHand: right }),
  setGlobeRotation: (rotation) => set({ globeRotation: rotation }),
  setGlobeScale: (scale) => set({ globeScale: scale }),
  updateHUD: (updates) => set((state) => ({ hudState: { ...state.hudState, ...updates } })),
}));

