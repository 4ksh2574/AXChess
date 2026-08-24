export const CODE_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
export const PEER_PREFIX = "lovable-chess-";

export function generateCode(): string {
  let out = "";
  const bytes =
    typeof crypto !== "undefined" && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(6))
      : null;
  for (let i = 0; i < 6; i++) {
    const n = (bytes ? bytes[i] : Math.floor(Math.random() * 256)) ?? 0;
    out += CODE_ALPHABET[n % CODE_ALPHABET.length] ?? "a";
  }
  return out;
}

export function normalizeCode(raw: string): string {
  return raw.trim().toLowerCase().replace(/^chess-/, "").replace(/[^a-z0-9]/g, "");
}

export function peerIdForCode(code: string): string {
  return `${PEER_PREFIX}${code}`;
}

export function displayCode(code: string): string {
  return `chess-${code}`;
}

export function inviteLink(code: string): string {
  if (typeof window === "undefined") return `/#game=${code}`;
  return `${window.location.origin}${window.location.pathname}#game=${code}`;
}

export function codeFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/game=([a-z0-9-]+)/i);
  return m?.[1] ? normalizeCode(m[1]) : null;
}

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export type PeerMessage =
  | { t: "hello"; name: string; color: "white" | "black" }
  | {
      t: "move";
      from: string;
      to: string;
      promotion?: string | undefined;
      fen: string;
      moveCount: number;
    }
  | { t: "sync"; fen: string; moveCount: number; history: string[] }
  | { t: "resign"; color: "white" | "black" }
  | { t: "rematch" };

export type SavedGame = {
  code: string;
  color: "white" | "black";
  role: "host" | "guest";
  fen: string;
  history: string[];
  savedAt: number;
};

const STORAGE_KEY = "lovable-chess-session";
const MAX_AGE_MS = 1000 * 60 * 60 * 6;

export function saveGame(game: SavedGame) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  } catch {
    /* storage unavailable */
  }
}

export function loadGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGame;
    if (!parsed?.code || Date.now() - parsed.savedAt > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
