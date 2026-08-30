import type { PieceRenderObject } from "react-chessboard";
import type { CSSProperties, ReactElement } from "react";
import type { BoardTheme, PieceSetId } from "@/lib/board-appearance";

/**
 * Four colour-free vector piece sets. Geometry is pure path data so every set
 * recolours instantly from the active palette.
 *
 * Each piece renders in three passes:
 *   1. a wide contrast halo behind the silhouette (dark behind white pieces,
 *      light behind black ones) — this is what keeps pieces readable when the
 *      square lightness is close to the piece lightness,
 *   2. the filled silhouette with its outline,
 *   3. interior detail strokes.
 */

export type PieceKey = "p" | "r" | "n" | "b" | "q" | "k";

type Detail = { d: string; width?: number; fill?: boolean };
type Geometry = { shape: string[]; details?: Detail[] };
type SetGeometry = Record<PieceKey, Geometry>;

/* -------- path helpers -------- */

const circle = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;

const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} h ${w - r * 2} a ${r} ${r} 0 0 1 ${r} ${r} v ${h - r * 2} a ${r} ${r} 0 0 1 ${-r} ${r} h ${-(w - r * 2)} a ${r} ${r} 0 0 1 ${-r} ${-r} v ${-(h - r * 2)} a ${r} ${r} 0 0 1 ${r} ${-r} Z`;

const roundBase = [rrect(9, 33.2, 27, 4.4, 2.2), rrect(6.2, 36.8, 32.6, 4.8, 2.4)];
const flatBase = [
  "M 10 33 h 25 v 4.4 h -25 Z",
  "M 6.6 37 h 31.8 v 4.6 h -31.8 Z",
];
const chunkyBase = [rrect(7.5, 32.4, 30, 5, 2.5), rrect(4.6, 36.8, 35.8, 5.4, 2.7)];

/* -------- Rounded: soft Material-You silhouettes -------- */

const rounded: SetGeometry = {
  p: {
    shape: [
      circle(22.5, 12.6, 5.4),
      "M 17 19 h 11 a 2 2 0 0 1 0 4 h -1.4 c 1.6 4 2.6 7.6 3 11 H 15.4 c 0.4 -3.4 1.4 -7 3 -11 H 17 a 2 2 0 0 1 0 -4 Z",
      ...roundBase,
    ],
  },
  r: {
    shape: [
      "M 11 8.5 h 4.6 v 3.4 h 4.6 V 8.5 h 4.6 v 3.4 h 4.6 V 8.5 H 34 v 7.2 l -3 2.6 v 11.4 l 3 2.6 v 2.2 H 11 v -2.2 l 3 -2.6 V 18.3 l -3 -2.6 Z",
      ...roundBase,
    ],
    details: [{ d: "M 14 18.3 h 17 M 14 29.7 h 17", width: 1.2 }],
  },
  n: {
    shape: [
      "M 20 6 l 2.2 5 c 6 -0.6 10 3.4 11 9.2 c 0.7 4 0.8 8 0.8 13.3 H 15 c 0 -5 0.9 -8.2 3.9 -11.2 c -3.2 1.3 -6.2 3.4 -8.4 2.3 c -2.2 -1.1 -2 -4 0 -5.8 l 6.4 -5.4 c 0.6 -2 1.4 -4.4 3.1 -7.4 Z",
      ...roundBase,
    ],
    details: [
      { d: circle(26.4, 16.6, 1.5), fill: true },
      { d: "M 14.8 19.4 c 1.6 -0.4 3 -0.2 4.2 0.6", width: 1.3 },
    ],
  },
  b: {
    shape: [
      circle(22.5, 7.6, 2.4),
      "M 22.5 10.4 c 5.6 3.6 8.4 8 8.4 12.4 c 0 3.6 -2.4 6.4 -8.4 6.4 s -8.4 -2.8 -8.4 -6.4 c 0 -4.4 2.8 -8.8 8.4 -12.4 Z",
      rrect(13, 28.8, 19, 4.4, 2.2),
      ...roundBase,
    ],
    details: [{ d: "M 22.5 15 v 7 M 19 18.6 h 7", width: 1.5 }],
  },
  q: {
    shape: [
      circle(8.5, 10, 2.6),
      circle(15.5, 7, 2.6),
      circle(22.5, 5.8, 2.9),
      circle(29.5, 7, 2.6),
      circle(36.5, 10, 2.6),
      "M 9.4 12.6 l 3.6 16.4 h 19 l 3.6 -16.4 l -6.2 5 l -3.7 -8.4 h -6.4 l -3.7 8.4 Z",
      rrect(11.5, 28.4, 22, 4.4, 2.2),
      ...roundBase,
    ],
  },
  k: {
    shape: [
      "M 11.4 29 v -7.4 c 0 -6.4 4.7 -10.4 11.1 -10.4 s 11.1 4 11.1 10.4 V 29 Z",
      rrect(11.5, 28.4, 22, 4.4, 2.2),
      ...roundBase,
    ],
    details: [
      { d: "M 22.5 2.6 v 8.6 M 18.3 6.4 h 8.4", width: 2.4 },
      { d: "M 15.6 20.4 c 2.4 2 4.6 3 6.9 3 s 4.5 -1 6.9 -3", width: 1.3 },
    ],
  },
};

/* -------- Classic: staunton-inspired -------- */

const classic: SetGeometry = {
  p: {
    shape: [
      circle(22.5, 11.5, 4.6),
      "M 19.4 16.4 h 6.2 l -0.7 2.6 c 2.4 2.6 3.6 6.4 4 10.4 H 16.1 c 0.4 -4 1.6 -7.8 4 -10.4 Z",
      rrect(13.6, 29, 17.8, 4.2, 1.6),
      ...roundBase,
    ],
  },
  r: {
    shape: [
      "M 10.4 8 h 5 v 3.2 h 4.6 V 8 h 5.4 v 3.2 h 4.6 V 8 h 4.6 v 8 l -2.6 2.4 h -18.6 L 10.4 16 Z",
      "M 15.4 18.4 h 14.2 l 1.4 10.6 h -17 Z",
      rrect(12, 29, 21, 4.2, 1.6),
      ...roundBase,
    ],
    details: [{ d: "M 13.8 16 h 17.4", width: 1.2 }],
  },
  n: {
    shape: [
      "M 21.4 5.4 c 6.6 0.6 12.4 5.6 12.6 15.4 c 0.1 4.4 0.2 8.4 0.2 12.4 H 13 c -0.2 -6 1.8 -9.6 5.6 -12.8 c -2.8 1.6 -5.8 3.6 -8 2.4 c -2 -1.2 -1.6 -3.8 0.4 -5.6 l 6.6 -5.8 c 0.8 -2.6 2 -4.6 3.8 -6 Z",
      ...roundBase,
    ],
    details: [
      { d: circle(26, 15.8, 1.4), fill: true },
      { d: "M 13.4 19.6 c 1.8 -0.6 3.4 -0.4 4.6 0.4", width: 1.2 },
      { d: "M 24.6 10.4 c 2.6 1 4.4 3 5.2 5.6", width: 1.2 },
    ],
  },
  b: {
    shape: [
      circle(22.5, 6.4, 2.2),
      "M 22.5 9 c 6 4.4 8.8 9 8.8 13.6 c 0 3 -3.4 5.2 -8.8 5.2 s -8.8 -2.2 -8.8 -5.2 C 13.7 18 16.5 13.4 22.5 9 Z",
      rrect(13.4, 27.6, 18.2, 5, 2),
      ...roundBase,
    ],
    details: [
      { d: "M 22.5 13.4 v 7.4 M 18.8 17.2 h 7.4", width: 1.5 },
      { d: "M 16.4 24.6 h 12.2", width: 1.1 },
    ],
  },
  q: {
    shape: [
      circle(22.5, 5, 2.6),
      "M 22.5 8 c 4.4 0 7.6 3.2 7.6 7 c 0 3 -1 6.4 -1.8 11 H 16.7 c -0.8 -4.6 -1.8 -8 -1.8 -11 c 0 -3.8 3.2 -7 7.6 -7 Z",
      "M 13.4 26.2 h 18.2 l 1.4 6.4 H 12 Z",
      ...roundBase,
    ],
    details: [{ d: "M 15.6 22.6 h 13.8", width: 1.2 }],
  },
  k: {
    shape: [
      "M 22.5 10 c 5 0 8.6 3.4 8.6 7.6 c 0 3.4 -1.2 7 -2.2 10.4 H 16.1 c -1 -3.4 -2.2 -7 -2.2 -10.4 C 13.9 13.4 17.5 10 22.5 10 Z",
      "M 12.6 28.2 h 19.8 l 1.6 4.6 H 11 Z",
      ...roundBase,
    ],
    details: [
      { d: "M 22.5 1.8 v 8 M 19 5 h 7", width: 2.2 },
      { d: "M 17.4 18.4 h 10.2", width: 1.2 },
    ],
  },
};

/* -------- Geometric: flat angular facets -------- */

const geometric: SetGeometry = {
  p: {
    shape: ["M 22.5 7 l 6 6 l -3 4 l 4 12 H 15.5 l 4 -12 l -3 -4 Z", ...flatBase],
  },
  r: {
    shape: ["M 11 8 h 23 l -3 6 v 15 h 3 v 4 H 11 v -4 h 3 V 14 Z", ...flatBase],
    details: [{ d: "M 19 8 v 6 M 26 8 v 6 M 14 20 h 17", width: 1.2 }],
  },
  n: {
    shape: [
      "M 19 5 l 14 8 l 1 20 H 13 l 1 -9 l -4 2 l -1 -5 l 8 -6 Z",
      ...flatBase,
    ],
    details: [
      { d: circle(26.5, 14.5, 1.4), fill: true },
      { d: "M 14 20 l 5 -1", width: 1.2 },
      { d: "M 22 26 l 8 -4", width: 1.2 },
    ],
  },
  b: {
    shape: ["M 22.5 4 l 9 13 l -4 6 l 4 6 v 4 h -18 v -4 l 4 -6 l -4 -6 Z", ...flatBase],
    details: [{ d: "M 22.5 12 v 7 M 19 15.5 h 7", width: 1.5 }],
  },
  q: {
    shape: [
      "M 8 8 l 5 6 l 4.5 -8 l 5 8 l 5 -8 l 4.5 8 l 5 -6 l -4 25 H 12 Z",
      ...flatBase,
    ],
    details: [{ d: "M 13.5 25 h 18", width: 1.2 }],
  },
  k: {
    shape: ["M 22.5 8 l 11 6 l -3 19 h -16 l -3 -19 Z", ...flatBase],
    details: [
      { d: "M 22.5 1.4 v 7 M 19 4.6 h 7", width: 2.2 },
      { d: "M 16 20 l 6.5 4 l 6.5 -4", width: 1.4 },
    ],
  },
};

/* -------- Chunky: thick, toy-like -------- */

const chunky: SetGeometry = {
  p: {
    shape: [
      circle(22.5, 12, 6.6),
      "M 15.2 21 h 14.6 c 1.4 4 2.4 7.6 2.8 11.4 H 12.4 c 0.4 -3.8 1.4 -7.4 2.8 -11.4 Z",
      ...chunkyBase,
    ],
  },
  r: {
    shape: [
      rrect(8.6, 7, 27.8, 9.4, 3),
      "M 12.6 16.4 h 19.8 v 16 H 12.6 Z",
      ...chunkyBase,
    ],
    details: [
      { d: "M 17.4 7.4 v 8.4 M 27.6 7.4 v 8.4", width: 2 },
      { d: "M 13.6 23 h 17.8", width: 1.4 },
    ],
  },
  n: {
    shape: [
      "M 19.6 4.4 c 8.4 0 15 6.4 15 16 v 12 H 12.4 c -0.4 -6.4 1.6 -10 5.4 -13 c -3.2 1.8 -6.6 4.2 -8.6 2.4 c -1.8 -1.6 -0.6 -4.4 1.6 -6.2 l 6.2 -5 c 0.4 -2.6 1.2 -4.6 2.6 -6.2 Z",
      ...chunkyBase,
    ],
    details: [
      { d: circle(27, 14.6, 1.9), fill: true },
      { d: "M 12.6 19.6 c 2 -0.8 3.8 -0.6 5.2 0.4", width: 1.6 },
    ],
  },
  b: {
    shape: [
      circle(22.5, 6.6, 3.2),
      "M 22.5 9.6 c 7 4.4 10.2 9.2 10.2 14 c 0 3.8 -3.6 6 -10.2 6 s -10.2 -2.2 -10.2 -6 c 0 -4.8 3.2 -9.6 10.2 -14 Z",
      rrect(11.4, 28.4, 22.2, 4.6, 2.3),
      ...chunkyBase,
    ],
    details: [{ d: "M 22.5 14 v 8 M 18.4 18 h 8.2", width: 2 }],
  },
  q: {
    shape: [
      circle(7.6, 10.6, 3.4),
      circle(15.4, 6.6, 3.4),
      circle(22.5, 5, 3.8),
      circle(29.6, 6.6, 3.4),
      circle(37.4, 10.6, 3.4),
      "M 8.4 13.4 l 4 15.6 h 20.2 l 4 -15.6 l -7 5 l -3.6 -8 h -7 l -3.6 8 Z",
      rrect(10.4, 28.4, 24.2, 4.6, 2.3),
      ...chunkyBase,
    ],
  },
  k: {
    shape: [
      "M 10.4 29 v -7.6 c 0 -7 5.4 -11.4 12.1 -11.4 s 12.1 4.4 12.1 11.4 V 29 Z",
      rrect(10.4, 28.4, 24.2, 4.6, 2.3),
      ...chunkyBase,
    ],
    details: [
      { d: "M 22.5 1.6 v 9 M 17.6 5.6 h 9.8", width: 3 },
      { d: "M 15 20.4 c 2.8 2.4 5 3.4 7.5 3.4 s 4.7 -1 7.5 -3.4", width: 1.8 },
    ],
  },
};

export const PIECE_SETS: Record<PieceSetId, { label: string; geometry: SetGeometry }> = {
  rounded: { label: "Rounded", geometry: rounded },
  classic: { label: "Classic", geometry: classic },
  geometric: { label: "Geometric", geometry: geometric },
  chunky: { label: "Chunky", geometry: chunky },
};

export const PIECE_KEYS: PieceKey[] = ["k", "q", "r", "b", "n", "p"];

/** Render one piece as an inline SVG, coloured from the active theme. */
export function PieceSvg({
  setId,
  piece,
  color,
  theme,
  style,
}: {
  setId: PieceSetId;
  piece: PieceKey;
  color: "w" | "b";
  theme: BoardTheme;
  style?: CSSProperties | undefined;
}) {
  const geo = PIECE_SETS[setId].geometry[piece];
  const tone = theme.pieces[color];

  return (
    <svg
      viewBox="0 0 45 45"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        filter: `drop-shadow(0 2px 2px ${tone.shadow})`,
        ...style,
      }}
    >
      {/* 1. contrast halo */}
      <g
        fill={tone.halo}
        stroke={tone.halo}
        strokeWidth={4.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {geo.shape.map((d, i) => (
          <path key={`h${i}`} d={d} />
        ))}
      </g>
      {/* 2. silhouette */}
      <g
        fill={tone.body}
        stroke={tone.edge}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {geo.shape.map((d, i) => (
          <path key={`s${i}`} d={d} />
        ))}
      </g>
      {/* 3. interior details */}
      <g strokeLinecap="round" strokeLinejoin="round">
        {(geo.details ?? []).map((det, i) => (
          <path
            key={`d${i}`}
            d={det.d}
            fill={det.fill ? tone.edge : "none"}
            stroke={det.fill ? "none" : tone.edge}
            strokeWidth={det.width ?? 1.4}
          />
        ))}
      </g>
    </svg>
  );
}

/** Build the react-chessboard `pieces` map for a set + theme. */
export function buildPieces(setId: PieceSetId, theme: BoardTheme): PieceRenderObject {
  const entries: [string, (props?: { svgStyle?: CSSProperties }) => ReactElement][] = [];
  for (const color of ["w", "b"] as const) {
    for (const piece of PIECE_KEYS) {
      entries.push([
        `${color}${piece}`,
        (props?: { svgStyle?: CSSProperties }) => (
          <PieceSvg
            setId={setId}
            piece={piece}
            color={color}
            theme={theme}
            style={props?.svgStyle}
          />
        ),
      ]);
    }
  }
  return Object.fromEntries(entries) as unknown as PieceRenderObject;
}
