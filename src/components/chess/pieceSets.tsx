import type { PieceRenderObject } from "react-chessboard";
import type { CSSProperties, ReactNode } from "react";
import type { DerivedTheme, PieceSetId, PieceTone } from "@/lib/board-appearance";

/**
 * Material You chess piece sets.
 *
 * Every set is authored as flat vector silhouettes on a 45x45 grid. A set only
 * supplies geometry — all colour comes from the active palette's `PieceTone`,
 * so switching hue/chroma/contrast re-renders the vectors instantly.
 *
 * Readability: each piece is drawn in three passes —
 *   1. a wide `halo` ring behind the silhouette (dark behind white pieces,
 *      light behind black pieces) so the piece separates from a square of
 *      similar lightness,
 *   2. the filled silhouette with its own `edge` outline,
 *   3. interior detail strokes.
 * Combined with a soft drop shadow this keeps every piece legible on both the
 * light and the dark squares at phone sizes.
 */

export type PieceKey = "p" | "r" | "n" | "b" | "q" | "k";

type ShapeDef = {
  /** Silhouette paths. These inherit fill/stroke so they can be halo-passed. */
  body: ReactNode;
  /** Interior lines / dots drawn on top with explicit colours. */
  details?: (tone: PieceTone) => ReactNode;
};

type ShapeSet = {
  strokeWidth: number;
  shapes: Record<PieceKey, ShapeDef>;
};

/* ------------------------------------------------------------------ */
/* Shared bases                                                        */
/* ------------------------------------------------------------------ */

const SoftBase = (
  <>
    <rect x={9} y={33.5} width={27} height={4.2} rx={2.1} />
    <rect x={6.5} y={37} width={32} height={4.6} rx={2.3} />
  </>
);

const FlatBase = (
  <>
    <rect x={9.4} y={32.4} width={26.2} height={3.4} rx={1.7} />
    <rect x={6.8} y={35.4} width={31.4} height={4.8} rx={2.4} />
  </>
);

const WideBase = (
  <>
    <rect x={8} y={31.8} width={29} height={4.2} rx={2.1} />
    <rect x={5} y={35.4} width={35} height={5.4} rx={2.7} />
  </>
);

/* ------------------------------------------------------------------ */
/* 1. Rounded — soft Material You silhouettes                          */
/* ------------------------------------------------------------------ */

const rounded: ShapeSet = {
  strokeWidth: 1.6,
  shapes: {
    p: {
      body: (
        <>
          <circle cx={22.5} cy={12.5} r={5.4} />
          <path d="M17 19 h11 a2 2 0 0 1 0 4 h-1.4 c1.6 4 2.6 7.6 3 11H15.4 c0.4-3.4 1.4-7 3-11H17 a2 2 0 0 1 0-4 Z" />
          {SoftBase}
        </>
      ),
    },
    r: {
      body: (
        <>
          <path d="M11 8.5 h4.6 v3.4 h4.6 V8.5 h4.6 v3.4 h4.6 V8.5 H34 v7.2 l-3 2.6 v11.4 l3 2.6 v2.2 H11 v-2.2 l3-2.6 V18.3 l-3-2.6 Z" />
          {SoftBase}
        </>
      ),
    },
    n: {
      body: (
        <>
          <path d="M20 6 l2.2 5 c6-0.6 10 3.4 11 9.2 c0.7 4 0.8 8 0.8 13.3 H15 c0-5 0.9-8.2 3.9-11.2 c-3.2 1.3-6.2 3.4-8.4 2.3 c-2.2-1.1-2-4 0-5.8 l6.4-5.4 c0.6-2 1.4-4.4 3.1-7.4 Z" />
          {SoftBase}
        </>
      ),
      details: (t) => (
        <>
          <circle cx={26.4} cy={16.6} r={1.5} fill={t.edge} />
          <path
            d="M14.8 19.4 c1.6-0.4 3-0.2 4.2 0.6"
            fill="none"
            stroke={t.edge}
            strokeWidth={1.3}
            strokeLinecap="round"
          />
        </>
      ),
    },
    b: {
      body: (
        <>
          <circle cx={22.5} cy={7.6} r={2.4} />
          <path d="M22.5 10.4 c5.6 3.6 8.4 8 8.4 12.4 c0 3.6-2.4 6.4-8.4 6.4 s-8.4-2.8-8.4-6.4 c0-4.4 2.8-8.8 8.4-12.4 Z" />
          <rect x={13} y={29} width={19} height={4.4} rx={2.2} />
          {SoftBase}
        </>
      ),
      details: (t) => (
        <path
          d="M22.5 15 v7 M19 18.6 h7"
          fill="none"
          stroke={t.edge}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ),
    },
    q: {
      body: (
        <>
          <circle cx={8.5} cy={10} r={2.6} />
          <circle cx={15.5} cy={7} r={2.6} />
          <circle cx={22.5} cy={5.8} r={2.9} />
          <circle cx={29.5} cy={7} r={2.6} />
          <circle cx={36.5} cy={10} r={2.6} />
          <path d="M9.4 12.6 l3.6 16.4 h19 l3.6-16.4 l-6.2 5 l-3.7-8.4 h-6.4 l-3.7 8.4 Z" />
          <rect x={11.5} y={28.6} width={22} height={4.4} rx={2.2} />
          {SoftBase}
        </>
      ),
    },
    k: {
      body: (
        <>
          <path d="M11.4 29 v-7.4 c0-6.4 4.7-10.4 11.1-10.4 s11.1 4 11.1 10.4 V29 Z" />
          <rect x={11.5} y={28.6} width={22} height={4.4} rx={2.2} />
          {SoftBase}
        </>
      ),
      details: (t) => (
        <>
          <path
            d="M22.5 2.8 v8.4 M18.3 6.4 h8.4"
            fill="none"
            stroke={t.edge}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <path
            d="M15.6 20.4 c2.4 2 4.6 3 6.9 3 s4.5-1 6.9-3"
            fill="none"
            stroke={t.edge}
            strokeWidth={1.3}
            strokeLinecap="round"
          />
        </>
      ),
    },
  },
};

/* ------------------------------------------------------------------ */
/* 2. Classic — Staunton proportions with smoothed corners             */
/* ------------------------------------------------------------------ */

const classic: ShapeSet = {
  strokeWidth: 1.45,
  shapes: {
    p: {
      body: (
        <>
          <circle cx={22.5} cy={11} r={4.6} />
          <path d="M18.4 15.8 h8.2 c-0.5 2.2 0.4 3.7 1.5 5.1 c1.9 2.5 3 5.3 3.3 8.6 H13.6 c0.3-3.3 1.4-6.1 3.3-8.6 c1.1-1.4 2-2.9 1.5-5.1 Z" />
          <rect x={13.2} y={29} width={18.6} height={3.6} rx={1.8} />
          {FlatBase}
        </>
      ),
    },
    r: {
      body: (
        <>
          <path d="M10.6 8.6 h5 v3.6 h4.4 V8.6 h5 v3.6 h4.4 V8.6 h5 v8.2 l-2.8 2.4 v9.4 l2.8 2.6 H10.6 l2.8-2.6 v-9.4 l-2.8-2.4 Z" />
          {FlatBase}
        </>
      ),
      details: (t) => (
        <path
          d="M13.4 19.2 h18.2 M13.4 28.6 h18.2"
          fill="none"
          stroke={t.edge}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      ),
    },
    n: {
      body: (
        <>
          <path d="M14 31.6 c0-6.2 1.7-10.4 5.2-13.8 c-2.1 0.6-3.9 2-5.3 4 c-1.3 1.7-3.6 1.5-4.2-0.6 c-0.6-2 0.4-3.7 1.9-5.3 l6.5-6.9 c1-1 1.6-2.2 1.8-3.6 l0.4-2.5 l2.8 2 c5.7 1.4 9.8 5.3 11.2 10.8 c1 4.1 1.2 9.7 1.2 15.9 Z" />
          {FlatBase}
        </>
      ),
      details: (t) => (
        <>
          <circle cx={25.6} cy={14.2} r={1.4} fill={t.edge} />
          <path
            d="M27.6 18.4 c2 1.4 3.2 3.6 3.6 6.6"
            fill="none"
            stroke={t.edge}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        </>
      ),
    },
    b: {
      body: (
        <>
          <circle cx={22.5} cy={6.6} r={2.2} />
          <path d="M22.5 9 c5 3.4 8.2 8 8.2 12.6 c0 3.4-2.6 5.8-8.2 5.8 s-8.2-2.4-8.2-5.8 c0-4.6 3.2-9.2 8.2-12.6 Z" />
          <rect x={12.6} y={27} width={19.8} height={4} rx={2} />
          {FlatBase}
        </>
      ),
      details: (t) => (
        <path
          d="M22.5 12.6 c-2.1 2.3-3.4 4.6-3.8 6.9"
          fill="none"
          stroke={t.edge}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      ),
    },
    q: {
      body: (
        <>
          <circle cx={22.5} cy={5} r={2.3} />
          <path d="M9 11.8 l3.4 5 l2.9-7.6 l3.6 7 l3.6-8.2 l3.6 8.2 l3.6-7 l2.9 7.6 l3.4-5 l-2.5 16.4 H11.5 Z" />
          <rect x={11} y={28} width={23} height={4} rx={2} />
          {FlatBase}
        </>
      ),
      details: (t) => (
        <path
          d="M13.4 24.4 h18.2"
          fill="none"
          stroke={t.edge}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      ),
    },
    k: {
      body: (
        <>
          <path d="M12 28 v-6.4 c0-4.1 2.5-6.9 5.6-6.9 c2 0 3.7 1 4.9 2.8 c1.2-1.8 2.9-2.8 4.9-2.8 c3.1 0 5.6 2.8 5.6 6.9 V28 Z" />
          <rect x={11} y={28} width={23} height={4} rx={2} />
          {FlatBase}
        </>
      ),
      details: (t) => (
        <path
          d="M22.5 2.4 v9.2 M18.6 5.8 h7.8"
          fill="none"
          stroke={t.edge}
          strokeWidth={2.3}
          strokeLinecap="round"
        />
      ),
    },
  },
};

/* ------------------------------------------------------------------ */
/* 3. Geometric — abstract stacked primitives                          */
/* ------------------------------------------------------------------ */

const geometric: ShapeSet = {
  strokeWidth: 1.5,
  shapes: {
    p: {
      body: (
        <>
          <circle cx={22.5} cy={13.5} r={5.6} />
          <path d="M16.4 21.8 h12.2 a1.8 1.8 0 0 1 1.8 2.1 l-1.5 8.8 H16.1 l-1.5-8.8 a1.8 1.8 0 0 1 1.8-2.1 Z" />
          {SoftBase}
        </>
      ),
    },
    r: {
      body: (
        <>
          <rect x={11} y={8} width={5.6} height={7.4} rx={1.7} />
          <rect x={19.7} y={8} width={5.6} height={7.4} rx={1.7} />
          <rect x={28.4} y={8} width={5.6} height={7.4} rx={1.7} />
          <rect x={11} y={13} width={23} height={19.4} rx={3.6} />
          {SoftBase}
        </>
      ),
    },
    n: {
      body: (
        <>
          <path d="M31.6 32.4 V20.6 c0-6.2-4.6-10.9-10.6-11 l2.1-4.5 l-8.6 3.1 l2.3 4.3 c-2.7 2-4.4 5.1-4.4 8.8 v11.1 Z" />
          {SoftBase}
        </>
      ),
      details: (t) => (
        <circle cx={25.8} cy={17.4} r={1.6} fill={t.edge} />
      ),
    },
    b: {
      body: (
        <>
          <path d="M22.5 7.4 c6.1 5.6 9.1 10 9.1 14.2 c0 4.5-4.1 7.5-9.1 7.5 s-9.1-3-9.1-7.5 c0-4.2 3-8.6 9.1-14.2 Z" />
          <rect x={13.4} y={29} width={18.2} height={4} rx={2} />
          {SoftBase}
        </>
      ),
      details: (t) => (
        <circle cx={22.5} cy={19.6} r={3.1} fill="none" stroke={t.edge} strokeWidth={1.4} />
      ),
    },
    q: {
      body: (
        <>
          <circle cx={10.6} cy={9.6} r={2.5} />
          <circle cx={16.5} cy={6.8} r={2.5} />
          <circle cx={22.5} cy={5.6} r={2.8} />
          <circle cx={28.5} cy={6.8} r={2.5} />
          <circle cx={34.4} cy={9.6} r={2.5} />
          <circle cx={22.5} cy={21.4} r={9.4} />
          {SoftBase}
        </>
      ),
      details: (t) => (
        <circle cx={22.5} cy={21.4} r={4.4} fill="none" stroke={t.edge} strokeWidth={1.4} />
      ),
    },
    k: {
      body: (
        <>
          <circle cx={22.5} cy={7} r={3.2} />
          <rect x={11.6} y={12.4} width={21.8} height={20} rx={4.4} />
          {SoftBase}
        </>
      ),
      details: (t) => (
        <path
          d="M22.5 16.6 v11.4 M16.9 22.3 h11.2"
          fill="none"
          stroke={t.edge}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      ),
    },
  },
};

/* ------------------------------------------------------------------ */
/* 4. Chunky — bold, high-visibility forms                             */
/* ------------------------------------------------------------------ */

const chunky: ShapeSet = {
  strokeWidth: 2.1,
  shapes: {
    p: {
      body: (
        <>
          <circle cx={22.5} cy={12.8} r={6.4} />
          <path d="M15.6 21.4 h13.8 a2.4 2.4 0 0 1 2.3 3 l-2 7.4 H15.3 l-2-7.4 a2.4 2.4 0 0 1 2.3-3 Z" />
          {WideBase}
        </>
      ),
    },
    r: {
      body: (
        <>
          <path d="M10 8 h6.2 v3.8 h4.2 V8 h4.2 v3.8 h4.2 V8 H35 v8 l-3.2 2.8 v10.6 l3.2 2.6 H10 l3.2-2.6 V18.8 L10 16 Z" />
          {WideBase}
        </>
      ),
    },
    n: {
      body: (
        <>
          <path d="M19.4 4.6 l2.6 5.4 c6.6-0.4 11 4 12 10.4 c0.7 4.2 0.9 7.8 0.9 11.4 H13.6 c0-5.4 1-8.8 4.4-12 c-3.4 1.4-6.8 3.6-9.2 2.4 c-2.4-1.2-2.2-4.4 0-6.4 l7-5.8 c0.7-2.2 1.6-4.8 3.6-9.4 Z" />
          {WideBase}
        </>
      ),
      details: (t) => (
        <circle cx={27} cy={16.4} r={1.9} fill={t.edge} />
      ),
    },
    b: {
      body: (
        <>
          <circle cx={22.5} cy={6.8} r={3} />
          <path d="M22.5 10.2 c6.4 4 9.6 8.8 9.6 13.4 c0 4-2.8 6.8-9.6 6.8 s-9.6-2.8-9.6-6.8 c0-4.6 3.2-9.4 9.6-13.4 Z" />
          {WideBase}
        </>
      ),
      details: (t) => (
        <path
          d="M22.5 15.4 v7.6 M18.6 19.2 h7.8"
          fill="none"
          stroke={t.edge}
          strokeWidth={2.1}
          strokeLinecap="round"
        />
      ),
    },
    q: {
      body: (
        <>
          <circle cx={8.6} cy={10.4} r={3.1} />
          <circle cx={15.5} cy={6.8} r={3.1} />
          <circle cx={22.5} cy={5.4} r={3.4} />
          <circle cx={29.5} cy={6.8} r={3.1} />
          <circle cx={36.4} cy={10.4} r={3.1} />
          <path d="M9.6 13.4 l3.4 17.4 h19 l3.4-17.4 l-6.4 5.6 l-3.7-9 h-5.6 l-3.7 9 Z" />
          {WideBase}
        </>
      ),
    },
    k: {
      body: (
        <>
          <path d="M11 30.8 v-8.2 c0-6.8 5-11 11.5-11 s11.5 4.2 11.5 11 v8.2 Z" />
          {WideBase}
        </>
      ),
      details: (t) => (
        <path
          d="M22.5 1.8 v9.4 M17.6 5.8 h9.8"
          fill="none"
          stroke={t.edge}
          strokeWidth={3.1}
          strokeLinecap="round"
        />
      ),
    },
  },
};

const SETS: Record<PieceSetId, ShapeSet> = { rounded, classic, geometric, chunky };

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

export function PieceGlyph({
  setId,
  piece,
  tone,
  svgStyle,
}: {
  setId: PieceSetId;
  piece: PieceKey;
  tone: PieceTone;
  svgStyle?: CSSProperties | undefined;
}) {
  const set = SETS[setId] ?? rounded;
  const shape = set.shapes[piece];
  const sw = set.strokeWidth;

  return (
    <svg
      viewBox="0 0 45 45"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        filter: `drop-shadow(0 2px 2.4px ${tone.shadow})`,
        ...svgStyle,
      }}
    >
      {/* contrast ring — keeps the piece readable on same-lightness squares */}
      <g
        fill="none"
        stroke={tone.halo}
        strokeWidth={sw + 2.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {shape.body}
      </g>
      {/* silhouette */}
      <g
        fill={tone.body}
        stroke={tone.edge}
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {shape.body}
      </g>
      {shape.details?.(tone)}
    </svg>
  );
}

export const PIECE_KEYS: PieceKey[] = ["k", "q", "r", "b", "n", "p"];

/** Build the `pieces` map react-chessboard expects for the given appearance. */
export function createPieceSet(setId: PieceSetId, theme: DerivedTheme): PieceRenderObject {
  const entries: [string, (props?: { svgStyle?: CSSProperties }) => ReactNode][] = [];

  for (const color of ["w", "b"] as const) {
    const tone = color === "w" ? theme.white : theme.black;
    for (const piece of PIECE_KEYS) {
      entries.push([
        `${color}${piece}`,
        (props?: { svgStyle?: CSSProperties }) => (
          <PieceGlyph setId={setId} piece={piece} tone={tone} svgStyle={props?.svgStyle} />
        ),
      ]);
    }
  }

  return Object.fromEntries(entries) as unknown as PieceRenderObject;
}
