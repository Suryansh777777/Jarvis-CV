import { create } from "zustand";

export interface Point {
  x: number;
  y: number;
  z: number;
}

export type GestureType =
  | "IDLE"
  | "PINCH"
  | "GRAB"
  | "PALM_OPEN"
  | "POINT"
  | "VICTORY";

export type HandLandmark = Point;
export type FaceLandmark = Point;

interface HUDState {
  systemStatus: "NOMINAL" | "WARNING" | "CRITICAL";
  powerLevel: number;
  threatLevel: "MINIMAL" | "LOW" | "MEDIUM" | "HIGH";
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
  globeCenter: { lat: number; lng: number };
  globeScale: number;
  activeScene: number;

  // HUD State
  hudState: HUDState;

  // Hand UI Data (for repulsor effect)
  handUiData: {
    left: HandUI;
    right: HandUI;
  };

  // Neural State
  theme: "CYBER" | "SOLAR" | "MATRIX" | "FROST";
  pulseTrigger: number; // Timestamp

  // Overwatch State
  timeSpeed: number;
  isManipulatingTime: boolean;

  // Actions
  setFaceLandmarks: (landmarks: FaceLandmark[] | null) => void;
  setHands: (left: HandLandmark[] | null, right: HandLandmark[] | null) => void;
  setGestures: (left: GestureType, right: GestureType) => void;
  setGlobeRotation: (rotation: { x: number; y: number }) => void;
  setGlobeCenter: (center: { lat: number; lng: number }) => void;
  setGlobeScale: (scale: number) => void;
  nextScene: () => void;
  prevScene: () => void;
  updateHUD: (updates: Partial<HUDState>) => void;
  updateHandUI: (hand: "left" | "right", data: Partial<HandUI>) => void;
  
  // Neural Actions
  setTheme: (theme: "CYBER" | "SOLAR" | "MATRIX" | "FROST") => void;
  cycleTheme: () => void;
  triggerPulse: () => void;

  // Overwatch Actions
  setTimeSpeed: (speed: number) => void;
  setIsManipulatingTime: (isManipulating: boolean) => void;
}

const THEME_ORDER = ["CYBER", "SOLAR", "MATRIX", "FROST"] as const;

export const useStore = create<StoreState>((set) => ({
  faceLandmarks: null,
  leftHand: null,
  rightHand: null,

  leftGesture: "IDLE",
  rightGesture: "IDLE",

  globeRotation: { x: 0, y: 0 },
  globeCenter: { lat: 19.0760, lng: 72.8777 }, // Mumbai Default
  globeScale: 1.5,
  activeScene: 0,

  hudState: {
    systemStatus: "NOMINAL",
    powerLevel: 100,
    threatLevel: "MINIMAL",
    message: "INITIALIZING SYSTEMS...",
  },

  handUiData: {
    left: { visible: false, x: 0, y: 0, gesture: "IDLE" },
    right: { visible: false, x: 0, y: 0, gesture: "IDLE" },
  },

  // Neural Defaults
  theme: "CYBER",
  pulseTrigger: 0,

  // Overwatch Defaults
  timeSpeed: 1.0,
  isManipulatingTime: false,

  setFaceLandmarks: (landmarks) => set({ faceLandmarks: landmarks }),
  setHands: (left, right) => set({ leftHand: left, rightHand: right }),
  setGestures: (left, right) => set({ leftGesture: left, rightGesture: right }),
  setGlobeRotation: (rotation) => set({ globeRotation: rotation }),
  setGlobeCenter: (center) => set({ globeCenter: center }),
  setGlobeScale: (scale) => set({ globeScale: scale }),
  nextScene: () =>
    set((state) => ({ activeScene: (state.activeScene + 1) % 4 })),
  prevScene: () =>
    set((state) => ({ activeScene: (state.activeScene - 1 + 4) % 4 })),
  updateHUD: (updates) =>
    set((state) => ({ hudState: { ...state.hudState, ...updates } })),
  updateHandUI: (hand, data) =>
    set((state) => ({
      handUiData: {
        ...state.handUiData,
        [hand]: { ...state.handUiData[hand], ...data },
      },
    })),
    
  setTheme: (theme) => set({ theme }),
  cycleTheme: () => set((state) => {
    const currentIndex = THEME_ORDER.indexOf(state.theme);
    const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
    return { theme: THEME_ORDER[nextIndex] };
  }),
  triggerPulse: () => set({ pulseTrigger: Date.now() }),

  setTimeSpeed: (speed) => set({ timeSpeed: speed }),
  setIsManipulatingTime: (isManipulating) => set({ isManipulatingTime: isManipulating }),
}));
