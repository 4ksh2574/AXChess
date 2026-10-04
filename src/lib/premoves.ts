export type Premove = { from: string; to: string };

type Grid = (string | null)[][]; // [rank 8..1][file a..h], FEN letters

const FILES = "abcdefgh";

function idx(sq: string): [number, number] {
  return [8 - Number(sq[1]), FILES.indexOf(sq[0] as string)];
}

function parse(fen: string): Grid {
  const rows = (fen.split(" ")[0] ?? "").split("/");
  return rows.map((row) => {
    const out: (string | null)[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) for (let i = 0; i < Number(ch); i++) out.push(null);
      else out.push(ch);
    }
    return out;
  });
}

function serialize(grid: Grid, rest: string): string {
  const placement = grid
    .map((row) => {
      let s = "";
      let empty = 0;
      for (const c of row) {
        if (!c) empty++;
        else {
          if (empty) s += empty;
          empty = 0;
          s += c;
        }
      }
      return s + (empty ? empty : "");
    })
    .join("/");
  return `${placement} ${rest}`;
}

/** Piece letter (FEN case) on a square of the position after queued premoves. */
export function pieceAt(fen: string, premoves: Premove[], sq: string): string | null {
  const grid = applyGrid(fen, premoves);
  const [r, f] = idx(sq);
  return grid[r]?.[f] ?? null;
}

function applyGrid(fen: string, premoves: Premove[]): Grid {
  const grid = parse(fen);
  for (const { from, to } of premoves) {
    const [fr, ff] = idx(from);
    const [tr, tf] = idx(to);
    let piece = grid[fr]?.[ff] ?? null;
    if (!piece) continue;
    // auto-queen on promotion
    if (piece === "P" && tr === 0) piece = "Q";
    if (piece === "p" && tr === 7) piece = "q";
    // castling: move rook too
    if ((piece === "K" || piece === "k") && Math.abs(tf - ff) === 2) {
      const rookFrom = tf > ff ? 7 : 0;
      const rookTo = tf > ff ? 5 : 3;
      grid[fr]![rookTo] = grid[fr]![rookFrom] ?? null;
      grid[fr]![rookFrom] = null;
    }
    grid[fr]![ff] = null;
    grid[tr]![tf] = piece;
  }
  return grid;
}

/** FEN with queued premoves visually applied (side-to-move etc. unchanged). */
export function previewFen(fen: string, premoves: Premove[]): string {
  if (!premoves.length) return fen;
  const rest = fen.split(" ").slice(1).join(" ");
  return serialize(applyGrid(fen, premoves), rest);
}
