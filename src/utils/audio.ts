// Simple sci-fi sound synthesizer using Web Audio API
// No external assets needed

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx && typeof window !== "undefined") {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

const createOscillator = (
  freq: number,
  type: OscillatorType,
  duration: number,
  vol: number = 0.1
) => {
  const ctx = initAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export const playSelectSound = () => {
  // High pitched "blip"
  createOscillator(1200, "sine", 0.1, 0.05);
  setTimeout(() => createOscillator(2000, "sine", 0.1, 0.03), 50);
};

export const playHoverSound = () => {
  // Low "thrum"
  createOscillator(200, "square", 0.1, 0.02);
};

export const playEngageSound = () => {
  // Power up sound
  const ctx = initAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

export const playErrorSound = () => {
  createOscillator(150, "sawtooth", 0.2, 0.05);
  setTimeout(() => createOscillator(100, "sawtooth", 0.2, 0.05), 100);
};
