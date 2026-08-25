import type { PieceRenderObject } from "react-chessboard";
import type { CSSProperties, ReactNode } from "react";

/**
 * Material You chess set — custom flat vector silhouettes with soft rounded
 * geometry, tonal fills and a subtle inner highlight so the pieces read
 * clearly on the pastel board at phone sizes.
 */

const LIGHT = {
  body: "#FFFBFF",
  edge: "#4A4458",
  accent: "#EADDFF",
};

const DARK = {
  body: "#4A4458",
  edge: "#2B2731",
  accent: "#6750A4",
};

type Tone = typeof LIGHT;

function Piece({
  children,
  tone,
  svgStyle,
}: {
  children: ReactNode;
  tone: Tone;
  svgStyle?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 45 45"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        filter: "drop-shadow(0 2px 2px rgba(74,68,88,0.32))",
        ...svgStyle,
      }}
    >
      <g
        fill={tone.body}
        stroke={tone.edge}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {children}
      </g>
    </svg>
  );
}

const Base = ({ tone }: { tone: Tone }) => (
  <>
    <rect x={9} y={33.5} width={27} height={4.2} rx={2.1} />
    <rect x={6.5} y={37} width={32} height={4.6} rx={2.3} fill={tone.body} />
  </>
);

const Pawn = ({ tone }: { tone: Tone }) => (
  <>
    <circle cx={22.5} cy={12.5} r={5.4} />
    <path d="M17 19 h11 a2 2 0 0 1 0 4 h-1.4 c1.6 4 2.6 7.6 3 11H15.4 c0.4-3.4 1.4-7 3-11H17 a2 2 0 0 1 0-4 Z" />
    <Base tone={tone} />
  </>
);

const Rook = ({ tone }: { tone: Tone }) => (
  <>
    <path d="M11 8.5 h4.6 v3.4 h4.6 V8.5 h4.6 v3.4 h4.6 V8.5 H34 v7.2 l-3 2.6 v11.4 l3 2.6 v2.2 H11 v-2.2 l3-2.6 V18.3 l-3-2.6 Z" />
    <Base tone={tone} />
  </>
);

const Knight = ({ tone }: { tone: Tone }) => (
  <>
    <path d="M20 6 l2.2 5 c6-0.6 10 3.4 11 9.2 c0.7 4 0.8 8 0.8 13.3 H15 c0-5 0.9-8.2 3.9-11.2 c-3.2 1.3-6.2 3.4-8.4 2.3 c-2.2-1.1-2-4 0-5.8 l6.4-5.4 c0.6-2 1.4-4.4 3.1-7.4 Z" />
    <circle cx={26.4} cy={16.6} r={1.5} fill={tone.edge} stroke="none" />
    <path
      d="M14.8 19.4 c1.6-0.4 3-0.2 4.2 0.6"
      fill="none"
      stroke={tone.edge}
      strokeWidth={1.3}
    />
    <Base tone={tone} />
  </>
);

const Bishop = ({ tone }: { tone: Tone }) => (
  <>
    <circle cx={22.5} cy={7.6} r={2.4} />
    <path d="M22.5 10.4 c5.6 3.6 8.4 8 8.4 12.4 c0 3.6-2.4 6.4-8.4 6.4 s-8.4-2.8-8.4-6.4 c0-4.4 2.8-8.8 8.4-12.4 Z" />
    <path
      d="M22.5 15 v7 M19 18.6 h7"
      fill="none"
      stroke={tone.edge}
      strokeWidth={1.5}
    />
    <rect x={13} y={29} width={19} height={4.4} rx={2.2} />
    <Base tone={tone} />
  </>
);

const Queen = ({ tone }: { tone: Tone }) => (
  <>
    <circle cx={8.5} cy={10} r={2.6} />
    <circle cx={15.5} cy={7} r={2.6} />
    <circle cx={22.5} cy={5.8} r={2.9} />
    <circle cx={29.5} cy={7} r={2.6} />
    <circle cx={36.5} cy={10} r={2.6} />
    <path d="M9.4 12.6 l3.6 16.4 h19 l3.6-16.4 l-6.2 5 l-3.7-8.4 h-6.4 l-3.7 8.4 Z" />
    <rect x={11.5} y={28.6} width={22} height={4.4} rx={2.2} />
    <Base tone={tone} />
  </>
);

const King = ({ tone }: { tone: Tone }) => (
  <>
    <path
      d="M22.5 2.8 v8.4 M18.3 6.4 h8.4"
      fill="none"
      stroke={tone.edge}
      strokeWidth={2.4}
    />
    <path d="M11.4 29 v-7.4 c0-6.4 4.7-10.4 11.1-10.4 s11.1 4 11.1 10.4 V29 Z" />
    <path
      d="M15.6 20.4 c2.4 2 4.6 3 6.9 3 s4.5-1 6.9-3"
      fill="none"
      stroke={tone.edge}
      strokeWidth={1.3}
    />
    <rect x={11.5} y={28.6} width={22} height={4.4} rx={2.2} />
    <Base tone={tone} />
  </>
);

const shapes = {
  p: Pawn,
  r: Rook,
  n: Knight,
  b: Bishop,
  q: Queen,
  k: King,
} as const;

type ShapeKey = keyof typeof shapes;

const entries: [string, (props?: { svgStyle?: CSSProperties }) => ReactNode][] =
  [];

for (const color of ["w", "b"] as const) {
  for (const type of Object.keys(shapes) as ShapeKey[]) {
    const tone = color === "w" ? LIGHT : DARK;
    const Shape = shapes[type];
    entries.push([
      `${color}${type}`,
      (props?: { svgStyle?: CSSProperties }) => (
        <Piece tone={tone} svgStyle={props?.svgStyle}>
          <Shape tone={tone} />
        </Piece>
      ),
    ]);
  }
}

export const materialPieces = Object.fromEntries(
  entries,
) as unknown as PieceRenderObject;

export const boardTheme = {
  light: "#F3EDF7",
  dark: "#CFC3E8",
  selected: "rgba(103, 80, 164, 0.38)",
  lastMove: "rgba(125, 172, 148, 0.42)",
  check: "rgba(179, 38, 30, 0.42)",
  dot: "rgba(103, 80, 164, 0.32)",
};
