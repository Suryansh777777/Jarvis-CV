import { create } from 'zustand';

export interface Point {
  x: number;
  y: number;
  z: number;
}

export type GestureType = 'IDLE' | 'PINCH' | 'GRAB' | 'PALM_OPEN' | 'POINT' | 'VICTORY';

export interface HandLandmark extends Point {}
export interface FaceLandmark extends Point {}

interface HUDState {
  systemStatus: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  powerLevel: number;
  threatLevel: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
}

interface HandUI {
  visible: boolean;
  x: number;
  y: number;
  gesture: GestureType;
}

interface StoreState {
  // Tracking Data
  faceLandmarks: FaceLandmark[] | null;
  leftHand: HandLandmark[] | null;
  rightHand: HandLandmark[] | null;
  
  // Recognized Gestures
  leftGesture: GestureType;
  rightGesture: GestureType;

  // Globe State
  globeRotation: { x: number; y: number };
  globeScale: number;
  
  // HUD State
  hudState: HUDState;
  
  // Hand UI Data (for repulsor effect)
  handUiData: {
    left: HandUI;
    right: HandUI;
  };

  // Actions
  setFaceLandmarks: (landmarks: FaceLandmark[] | null) => void;
  setHands: (left: HandLandmark[] | null, right: HandLandmark[] | null) => void;
  setGestures: (left: GestureType, right: GestureType) => void;
  setGlobeRotation: (rotation: { x: number; y: number }) => void;
  setGlobeScale: (scale: number) => void;
  updateHUD: (updates: Partial<HUDState>) => void;
  updateHandUI: (hand: 'left' | 'right', data: Partial<HandUI>) => void;
}

export const useStore = create<StoreState>((set) => ({
  faceLandmarks: null,
  leftHand: null,
  rightHand: null,
  
  leftGesture: 'IDLE',
  rightGesture: 'IDLE',

  globeRotation: { x: 0, y: 0 },
  globeScale: 1.5,
  
  hudState: {
    systemStatus: 'NOMINAL',
    powerLevel: 100,
    threatLevel: 'MINIMAL',
    message: 'INITIALIZING SYSTEMS...'
  },

  handUiData: {
    left: { visible: false, x: 0, y: 0, gesture: 'IDLE' },
    right: { visible: false, x: 0, y: 0, gesture: 'IDLE' }
  },

  setFaceLandmarks: (landmarks) => set({ faceLandmarks: landmarks }),
  setHands: (left, right) => set({ leftHand: left, rightHand: right }),
  setGestures: (left, right) => set({ leftGesture: left, rightGesture: right }),
  setGlobeRotation: (rotation) => set({ globeRotation: rotation }),
  setGlobeScale: (scale) => set({ globeScale: scale }),
  updateHUD: (updates) => set((state) => ({ hudState: { ...state.hudState, ...updates } })),
  updateHandUI: (hand, data) => set((state) => ({
    handUiData: {
      ...state.handUiData,
      [hand]: { ...state.handUiData[hand], ...data }
    }
  })),
}));
