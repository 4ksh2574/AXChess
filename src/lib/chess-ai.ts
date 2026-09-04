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

/** Ask the engine for a move. Resolves to null if no legal move exists. */
export function requestEngineMove(fen: string, difficulty: Difficulty): Promise<EngineMove> {
  const w = getWorker();
  const { depth, randomness } = SETTINGS[difficulty];
  if (!w) return Promise.resolve(null);
  const id = ++seq;
  return new Promise((resolve) => {
    const onMessage = (event: MessageEvent<{ id: number; move: EngineMove }>) => {
      if (event.data.id !== id) return;
      w.removeEventListener("message", onMessage);
      resolve(event.data.move);
    };
    w.addEventListener("message", onMessage);
    w.postMessage({ id, fen, depth, randomness });
  });
}

export function disposeEngine() {
  worker?.terminate();
  worker = null;
}
