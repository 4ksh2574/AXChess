/// <reference lib="webworker" />
/**
 * Offline chess engine: alpha-beta negamax over chess.js with material and
 * piece-square evaluation. Runs in a Web Worker so the board never stutters,
 * and needs no network — the whole engine ships with the app.
 */
import { Chess, type Move } from "chess.js";

type Request = { fen: string; depth: number; randomness: number };
type Reply = { from: string; to: string; promotion?: string } | null;

const VALUES: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// prettier-ignore
const PST: Record<string, number[]> = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
   -50,-40,-30,-30,-30,-30,-40,-50,
   -40,-20,  0,  0,  0,  0,-20,-40,
   -30,  0, 10, 15, 15, 10,  0,-30,
   -30,  5, 15, 20, 20, 15,  5,-30,
   -30,  0, 15, 20, 20, 15,  0,-30,
   -30,  5, 10, 15, 15, 10,  5,-30,
   -40,-20,  0,  5,  5,  0,-20,-40,
   -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
   -20,-10,-10,-10,-10,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5, 10, 10,  5,  0,-10,
   -10,  5,  5, 10, 10,  5,  5,-10,
   -10,  0, 10, 10, 10, 10,  0,-10,
   -10, 10, 10, 10, 10, 10, 10,-10,
   -10,  5,  0,  0,  0,  0,  5,-10,
   -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0,
  ],
  q: [
   -20,-10,-10, -5, -5,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
     0,  0,  5,  5,  5,  5,  0, -5,
   -10,  5,  5,  5,  5,  5,  0,-10,
   -10,  0,  5,  0,  0,  0,  0,-10,
   -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  k: [
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -20,-30,-30,-40,-40,-30,-30,-20,
   -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 10,  0,  0, 10, 30, 20,
  ],
};

function evaluate(game: Chess): number {
  let score = 0;
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = board[r]?.[f];
      if (!sq) continue;
      const idx = sq.color === "w" ? r * 8 + f : (7 - r) * 8 + f;
      const value = VALUES[sq.type]! + (PST[sq.type]?.[idx] ?? 0);
      score += sq.color === "w" ? value : -value;
    }
  }
  return score;
}

function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => scoreMove(b) - scoreMove(a));
}

function scoreMove(m: Move): number {
  let s = 0;
  if (m.captured) s += 10 * (VALUES[m.captured] ?? 0) - (VALUES[m.piece] ?? 0);
  if (m.promotion) s += 800;
  if (m.san.includes("+")) s += 50;
  return s;
}

function negamax(game: Chess, depth: number, alpha: number, beta: number, sign: number): number {
  if (game.isGameOver()) {
    if (game.isCheckmate()) return -100000 - depth * 100;
    return 0;
  }
  if (depth === 0) return sign * evaluate(game);

  let best = -Infinity;
  for (const move of orderMoves(game.moves({ verbose: true }) as Move[])) {
    game.move(move);
    const score = -negamax(game, depth - 1, -beta, -alpha, -sign);
    game.undo();
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

function pickMove({ fen, depth, randomness }: Request): Reply {
  const game = new Chess(fen);
  const moves = game.moves({ verbose: true }) as Move[];
  if (moves.length === 0) return null;

  const sign = game.turn() === "w" ? 1 : -1;
  const scored: { move: Move; score: number }[] = [];
  for (const move of orderMoves(moves)) {
    game.move(move);
    const score = -negamax(game, depth - 1, -Infinity, Infinity, -sign);
    game.undo();
    scored.push({ move, score: score + (Math.random() - 0.5) * randomness });
  }
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]!.move;
  return {
    from: best.from,
    to: best.to,
    ...(best.promotion ? { promotion: best.promotion } : {}),
  };
}

self.onmessage = (event: MessageEvent<Request & { id: number }>) => {
  const { id, ...req } = event.data;
  let move: Reply = null;
  try {
    move = pickMove(req);
  } catch {
    move = null;
  }
  (self as unknown as Worker).postMessage({ id, move });
};
