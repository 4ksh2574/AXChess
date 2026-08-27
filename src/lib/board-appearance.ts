/**
 * Board & piece appearance model.
 *
 * A single tonal palette (hue / chroma / contrast) drives every colour used by
 * the chessboard: square fills, move accents and the piece vector fills. All
 * colours are computed in OKLCH and converted to sRGB here so the SVG pieces
 * can use plain hex/rgba values (SVG presentation attributes are far more
 * predictable with hex than with oklch()).
 */

export type PieceSetId = "rounded" | "classic" | "geometric" | "chunky";

export type Appearance = {
  setId: PieceSetId;
  /** 0-360 tonal hue. */
  hue: number;
  /** 0-100, how saturated the tonal palette is. */
  chroma: number;
  /** 0-100, separation between light/dark squares and piece body/edge. */
  contrast: number;
};

export const DEFAULT_APPEARANCE: Appearance = {
  setId: "rounded",
  hue: 300,
  chroma: 55,
  contrast: 50,
};

/* ------------------------------------------------------------------ */
/* OKLCH -> sRGB                                                       */
/* ------------------------------------------------------------------ */

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** OKLCH (L 0-1, C 0-0.4, H degrees) to an sRGB triple in 0-255. */
export function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const gamma = (x: number) =>
    Math.round(clamp01(x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255);

  return [gamma(lr), gamma(lg), gamma(lb)];
}

export function oklchToHex(L: number, C: number, H: number): string {
  const [r, g, b] = oklchToRgb(L, C, H);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function oklchToRgba(L: number, C: number, H: number, alpha: number): string {
  const [r, g, b] = oklchToRgb(L, C, H);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ------------------------------------------------------------------ */
/* Derived theme                                                       */
/* ------------------------------------------------------------------ */

/** Colours for one side's pieces. */
export type PieceTone = {
  /** Main silhouette fill. */
  body: string;
  /** Outline + interior detail strokes. */
  edge: string;
  /**
   * Wide contrast ring drawn *behind* the silhouette. This is what keeps a
   * piece readable when it sits on a square of a similar lightness.
   */
  halo: string;
  /** Soft drop shadow beneath the piece. */
  shadow: string;
};

export type BoardTheme = {
  light: string;
  dark: string;
  selected: string;
  lastMove: string;
  check: string;
  dot: string;
  primary: string;
  lightNotation: string;
  darkNotation: string;
};

export type DerivedTheme = {
  board: BoardTheme;
  white: PieceTone;
  black: PieceTone;
};

export function deriveTheme(app: Appearance): DerivedTheme {
  const hue = app.hue;
  // Max chroma is kept modest so the palette always stays "tonal" / pastel.
  const c = (app.chroma / 100) * 0.14;
  const k = app.contrast / 100;

  // --- squares -----------------------------------------------------
  const lightL = 0.958 - 0.03 * k;
  const darkL = 0.82 - 0.16 * k;
  const light = oklchToHex(lightL, c * 0.22, hue);
  const dark = oklchToHex(darkL, c * 0.44, hue);

  // --- accents -----------------------------------------------------
  const primaryL = 0.52;
  const primary = oklchToHex(primaryL, c, hue);

  // --- piece tones -------------------------------------------------
  // White pieces: near-white body with a dark edge, plus a dark halo so they
  // still separate from the pale light squares.
  const whiteBodyL = 0.982;
  const whiteEdgeL = 0.36 - 0.12 * k;
  const white: PieceTone = {
    body: oklchToHex(whiteBodyL, c * 0.05, hue),
    edge: oklchToHex(whiteEdgeL, c * 0.32, hue),
    halo: oklchToRgba(whiteEdgeL, c * 0.32, hue, 0.24 + 0.16 * k),
    shadow: oklchToRgba(0.34, c * 0.3, hue, 0.34),
  };

  // Black pieces: dark body with an even darker edge, and a light halo so they
  // stay legible on the dark squares.
  const blackBodyL = 0.44 - 0.12 * k;
  const blackEdgeL = 0.26 - 0.09 * k;
  const black: PieceTone = {
    body: oklchToHex(blackBodyL, c * 0.3, hue),
    edge: oklchToHex(blackEdgeL, c * 0.24, hue),
    halo: oklchToRgba(0.985, c * 0.05, hue, 0.5 + 0.35 * k),
    shadow: oklchToRgba(0.28, c * 0.26, hue, 0.42),
  };

  return {
    board: {
      light,
      dark,
      selected: oklchToRgba(primaryL, c, hue, 0.4),
      lastMove: oklchToRgba(0.62, c * 0.7, (hue + 130) % 360, 0.42),
      check: oklchToRgba(0.55, 0.19, 27, 0.45),
      dot: oklchToRgba(primaryL, c, hue, 0.34),
      primary,
      lightNotation: oklchToHex(0.5, c * 0.6, hue),
      darkNotation: light,
    },
    white,
    black,
  };
}

/* ------------------------------------------------------------------ */
/* Presets                                                             */
/* ------------------------------------------------------------------ */

export type PalettePreset = {
  id: string;
  label: string;
  hue: number;
  chroma: number;
  contrast: number;
};

export const PALETTE_PRESETS: PalettePreset[] = [
  { id: "lilac", label: "Lilac", hue: 300, chroma: 55, contrast: 50 },
  { id: "ocean", label: "Ocean", hue: 235, chroma: 60, contrast: 55 },
  { id: "forest", label: "Forest", hue: 152, chroma: 52, contrast: 52 },
  { id: "sand", label: "Sand", hue: 74, chroma: 58, contrast: 48 },
  { id: "rose", label: "Rose", hue: 12, chroma: 55, contrast: 50 },
  { id: "slate", label: "Slate", hue: 265, chroma: 12, contrast: 62 },
];

export const PIECE_SETS: { id: PieceSetId; label: string; blurb: string }[] = [
  { id: "rounded", label: "Rounded", blurb: "Soft Material You silhouettes" },
  { id: "classic", label: "Classic", blurb: "Staunton shapes, smoothed" },
  { id: "geometric", label: "Geometric", blurb: "Abstract stacked forms" },
  { id: "chunky", label: "Chunky", blurb: "Bold, high-visibility" },
];

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "axchess-appearance";

const VALID_SETS = new Set<string>(PIECE_SETS.map((s) => s.id));

function clampNum(v: unknown, min: number, max: number, fallback: number) {
  const n = typeof v === "number" && Number.isFinite(v) ? v : fallback;
  return Math.min(max, Math.max(min, n));
}

export function loadAppearance(): Appearance {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    const parsed = JSON.parse(raw) as Partial<Appearance>;
    return {
      setId: VALID_SETS.has(parsed.setId as string)
        ? (parsed.setId as PieceSetId)
        : DEFAULT_APPEARANCE.setId,
      hue: clampNum(parsed.hue, 0, 360, DEFAULT_APPEARANCE.hue),
      chroma: clampNum(parsed.chroma, 0, 100, DEFAULT_APPEARANCE.chroma),
      contrast: clampNum(parsed.contrast, 0, 100, DEFAULT_APPEARANCE.contrast),
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearance(app: Appearance) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(app));
  } catch {
    /* storage unavailable */
  }
}
