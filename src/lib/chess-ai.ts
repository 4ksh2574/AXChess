/** Client-side wrapper around the offline engine worker. */

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTIES: { id: Difficulty; label: string; blurb: string }[] = [
  { id: "easy", label: "Easy", blurb: "Casual — makes mistakes" },
  { id: "medium", label: "Medium", blurb: "Solid club player" },
  { id: "hard", label: "Hard", blurb: "Thinks several moves ahead" },
];

const SETTINGS: Record<Difficulty, { depth: number; randomness: number }> = {
  easy: { depth: 1, randomness: 260 },
  medium: { depth: 2, randomness: 60 },
  hard: { depth: 3, randomness: 0 },
};

export type EngineMove = { from: string; to: string; promotion?: string } | null;

let worker: Worker | null = null;
let seq = 0;

function getWorker(): Worker | null {
  if (typeof window === "undefined") return null;
  if (!worker) {
    try {
      worker = new Worker(new URL("./engine.worker.ts", import.meta.url), { type: "module" });
    } catch {
      worker = null;
    }
  }
  return worker;
}

/** Compute on the main thread when the background worker is unavailable. */
async function fallbackMove(fen: string, depth: number, randomness: number): Promise<EngineMove> {
  try {
    const { pickMove } = await import("./engine-core");
    return pickMove({ fen, depth, randomness });
  } catch {
    return null;
  }
}

/** Ask the engine for a move. Resolves to null if no legal move exists. */
export function requestEngineMove(fen: string, difficulty: Difficulty): Promise<EngineMove> {
  const w = getWorker();
  const { depth, randomness } = SETTINGS[difficulty];
  if (!w) return fallbackMove(fen, depth, randomness);
  const id = ++seq;
  return new Promise((resolve) => {
    let done = false;
    const finish = (move: EngineMove | Promise<EngineMove>) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
      resolve(move);
    };
    const onMessage = (event: MessageEvent<{ id: number; move: EngineMove }>) => {
      if (event.data?.id === id) finish(event.data.move);
    };
    const onError = () => {
      disposeEngine();
      finish(fallbackMove(fen, depth, randomness));
    };
    const timer = window.setTimeout(onError, 8000);
    w.addEventListener("message", onMessage);
    w.addEventListener("error", onError);
    try {
      w.postMessage({ id, fen, depth, randomness });
    } catch {
      onError();
    }
  });
}

export function disposeEngine() {
  worker?.terminate();
  worker = null;
}
