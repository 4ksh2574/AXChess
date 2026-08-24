import { defaultPieces, type PieceRenderObject } from "react-chessboard";

/**
 * Material You themed pieces: reuse the default SVG geometry but override the
 * fill so pieces match the app's tonal palette instead of the stock wood/plastic look.
 */
const WHITE_FILL = "#FFFBFF";
const BLACK_FILL = "#4A4458";

export const materialPieces: PieceRenderObject = Object.fromEntries(
  Object.entries(defaultPieces).map(([key, Render]) => {
    const isWhite = key.startsWith("w");
    return [
      key,
      (props?: { square?: string; svgStyle?: React.CSSProperties }) =>
        Render({
          ...props,
          fill: isWhite ? WHITE_FILL : BLACK_FILL,
          svgStyle: {
            filter: isWhite
              ? "drop-shadow(0 2px 2px rgba(74,68,88,0.35))"
              : "drop-shadow(0 2px 2px rgba(74,68,88,0.25))",
            ...props?.svgStyle,
          },
        }),
    ];
  }),
) as PieceRenderObject;

export const boardTheme = {
  light: "#F3EDF7",
  dark: "#CFC3E8",
  selected: "rgba(103, 80, 164, 0.38)",
  lastMove: "rgba(125, 172, 148, 0.42)",
  check: "rgba(179, 38, 30, 0.42)",
  dot: "rgba(103, 80, 164, 0.32)",
};
