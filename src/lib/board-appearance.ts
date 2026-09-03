/**
 * Palette engine for the board and pieces.
 *
 * A single (hue, saturation, contrast) triple derives every colour used by the
 * board: square fills, move / check / selection accents and the per-side piece
 * tones. Colours are computed in OKLCH and converted to sRGB here so the whole
 * set stays perceptually even at any hue.
 */

export type PieceSetId = "rounded" | "classic" | "geometric" | "chunky";

export type BackgroundId = "wallpaper" | "ember" | "plain" | "custom";

export type AppearanceState = {
  pieceSet: PieceSetId;
  hue: number; // 0-360
  saturation: number; // 0-100
  contrast: number; // 0-100
  /** "custom" = derived from the sliders, otherwise a fixed hand-tuned palette. */
  paletteId: string;
  background: BackgroundId;
};


export type PieceTone = {
  body: string;
  edge: string;
  halo: string;
  shadow: string;
};

export type BoardTheme = {
  board: {
    light: string;
    dark: string;
    border: string;
    selected: string;
    selectedRing: string;
    lastMove: string;
    check: string;
    dot: string;
    lightNotation: string;
    darkNotation: string;
  };
  pieces: {
    w: PieceTone;
    b: PieceTone;
  };
  accent: string;
  accentSoft: string;
};

/* ------------------------------------------------------------------ */
/* OKLCH -> sRGB                                                       */
/* ------------------------------------------------------------------ */

function clamp01(n: number) {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

function gamma(c: number) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** Convert OKLCH (L 0-1, C 0-0.4, H degrees) to a #rrggbb string. */
export function oklch(L: number, C: number, H: number): string {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const to255 = (v: number) => Math.round(clamp01(gamma(v)) * 255);
  return (
    "#" +
    [to255(r), to255(g), to255(bl)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Same as {@link oklch} but returns an rgba() string with the given alpha. */
export function oklcha(L: number, C: number, H: number, alpha: number): string {
  const hex = oklch(L, C, H);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ------------------------------------------------------------------ */
/* Theme derivation                                                    */
/* ------------------------------------------------------------------ */

export function deriveTheme(state: AppearanceState): BoardTheme {
  const H = state.hue;
  const sat = state.saturation / 100;
  const contrast = state.contrast / 100;

  const chroma = 0.02 + sat * 0.11;

  // Squares: contrast widens the lightness gap between light and dark squares.
  const lightL = 0.95 - contrast * 0.07;
  const darkL = 0.78 - contrast * 0.3;

  const light = oklch(lightL, chroma * 0.45, H);
  const dark = oklch(darkL, chroma * 0.8, H);

  // Piece tones. The halo is the opposite lightness of the body, so each side
  // stays legible on both square colours.
  const whiteTone: PieceTone = {
    body: oklch(0.985, chroma * 0.14, H),
    edge: oklch(0.33, chroma * 0.5, H),
    halo: oklcha(0.28, chroma * 0.45, H, 0.55),
    shadow: oklcha(0.25, chroma * 0.4, H, 0.35),
  };
  const blackTone: PieceTone = {
    body: oklch(0.3, chroma * 0.55, H),
    edge: oklch(0.16, chroma * 0.4, H),
    halo: oklcha(0.98, chroma * 0.1, H, 0.65),
    shadow: oklcha(0.2, chroma * 0.35, H, 0.4),
  };

  const accentH = (H + 12) % 360;

  return {
    board: {
      light,
      dark,
      border: oklch(0.62, chroma * 0.9, H),
      selected: oklcha(0.62, 0.13, accentH, 0.38),
      selectedRing: oklcha(0.55, 0.15, accentH, 0.65),
      lastMove: oklcha(0.72, 0.12, (H + 150) % 360, 0.42),
      check: oklcha(0.58, 0.19, 25, 0.46),
      dot: oklcha(0.5, 0.13, accentH, 0.4),
      lightNotation: oklch(0.45, chroma * 0.8, H),
      darkNotation: light,
    },
    pieces: { w: whiteTone, b: blackTone },
    accent: oklch(0.55, 0.14, accentH),
    accentSoft: oklcha(0.55, 0.14, accentH, 0.14),
  };
}

/* ------------------------------------------------------------------ */
/* Presets + persistence                                               */
/* ------------------------------------------------------------------ */

export type Preset = { id: string; label: string; hue: number; saturation: number; contrast: number };

export const PRESETS: Preset[] = [
  { id: "lavender", label: "Lavender", hue: 300, saturation: 46, contrast: 46 },
  { id: "sage", label: "Sage", hue: 150, saturation: 40, contrast: 50 },
  { id: "ocean", label: "Ocean", hue: 235, saturation: 52, contrast: 54 },
  { id: "clay", label: "Clay", hue: 40, saturation: 55, contrast: 52 },
  { id: "rose", label: "Rose", hue: 5, saturation: 48, contrast: 44 },
  { id: "graphite", label: "Graphite", hue: 265, saturation: 10, contrast: 62 },
];

export const DEFAULT_APPEARANCE: AppearanceState = {
  pieceSet: "rounded",
  hue: 300,
  saturation: 46,
  contrast: 46,
};

const STORAGE_KEY = "axchess-appearance";

export function loadAppearance(): AppearanceState {
  if (typeof localStorage === "undefined") return DEFAULT_APPEARANCE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    const parsed = JSON.parse(raw) as Partial<AppearanceState>;
    return {
      pieceSet: (parsed.pieceSet ?? DEFAULT_APPEARANCE.pieceSet) as PieceSetId,
      hue: Number(parsed.hue ?? DEFAULT_APPEARANCE.hue),
      saturation: Number(parsed.saturation ?? DEFAULT_APPEARANCE.saturation),
      contrast: Number(parsed.contrast ?? DEFAULT_APPEARANCE.contrast),
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearance(state: AppearanceState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}
