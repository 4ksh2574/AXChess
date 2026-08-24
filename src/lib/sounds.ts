let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Call from a user gesture so mobile browsers allow audio later. */
export function unlockAudio() {
  getCtx();
}

function tone(freq: number, duration: number, type: OscillatorType, gain: number, delay = 0) {
  const audio = getCtx();
  if (!audio || muted) return;
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const vol = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  vol.gain.setValueAtTime(0.0001, start);
  vol.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  vol.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(vol).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export const sounds = {
  move: () => tone(420, 0.09, "sine", 0.16),
  opponentMove: () => tone(340, 0.09, "sine", 0.14),
  capture: () => {
    tone(200, 0.12, "triangle", 0.22);
    tone(120, 0.16, "sawtooth", 0.1, 0.02);
  },
  check: () => {
    tone(760, 0.1, "square", 0.1);
    tone(980, 0.12, "square", 0.09, 0.09);
  },
  end: () => {
    tone(523, 0.16, "sine", 0.18);
    tone(659, 0.16, "sine", 0.18, 0.14);
    tone(784, 0.3, "sine", 0.18, 0.28);
  },
  connect: () => {
    tone(587, 0.1, "sine", 0.14);
    tone(880, 0.16, "sine", 0.14, 0.09);
  },
  error: () => tone(160, 0.2, "sawtooth", 0.12),
};
