import { useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Shuffle } from "lucide-react";
import { useBoardAppearance } from "@/hooks/useBoardAppearance";
import { AppearancePanel } from "./AppearancePanel";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

/** A lively middle-game position so every piece type is visible at once. */
const PREVIEW_POSITIONS = [
  "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1",
  "r2q1rk1/pp1nbppp/2p1bn2/3p4/3P1B2/2N1PN2/PPQ1BPPP/R4RK1 w - - 0 1",
  "2kr3r/ppp2ppp/2n1bq2/3p4/3P1B2/2PB1N2/PP3PPP/R2Q1RK1 w - - 0 1",
];

export default function AppearanceStudio() {
  const { appearance, theme, pieces, update, reset } = useBoardAppearance();
  const [posIndex, setPosIndex] = useState(0);
  const position = PREVIEW_POSITIONS[posIndex] ?? PREVIEW_POSITIONS[0]!;

  const boardOptions = useMemo(
    () => ({
      position,
      pieces,
      allowDragging: false,
      animationDurationInMs: 220,
      lightSquareStyle: { backgroundColor: theme.board.light },
      darkSquareStyle: { backgroundColor: theme.board.dark },
      darkSquareNotationStyle: { color: theme.board.darkNotation },
      lightSquareNotationStyle: { color: theme.board.lightNotation },
    }),
    [position, pieces, theme],
  );

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 overflow-x-hidden px-4 pb-8 pt-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <Link
          to="/"
          aria-label="Back to lobby"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <picture>
            <source srcSet={logoDark} media="(prefers-color-scheme: dark)" />
            <img
              src={logoLight}
              alt=""
              className="h-8 w-8 shrink-0 rounded-xl bg-card/70 p-1"
            />
          </picture>
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
            Board style
          </h1>
        </div>
        <button
          onClick={() => setPosIndex((i) => (i + 1) % PREVIEW_POSITIONS.length)}
          aria-label="Show another position"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground active:scale-95"
        >
          <Shuffle className="h-5 w-5" />
        </button>
      </header>

      {/* live preview */}
      <div className="sticky top-2 z-10 overflow-hidden rounded-[28px] bg-card p-2 shadow-[0_10px_30px_-14px_rgba(74,68,88,0.55)]">
        <div className="overflow-hidden rounded-[20px]">
          <Chessboard options={boardOptions} />
        </div>
      </div>

      <AppearancePanel appearance={appearance} theme={theme} update={update} reset={reset} />

      <Link
        to="/"
        className="grid h-14 w-full place-items-center rounded-[20px] bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]"
      >
        Done
      </Link>

      <footer className="mt-auto pt-8 text-center text-[11px] font-medium tracking-wide text-muted-foreground">
        made by 4ksh2574
      </footer>
    </main>
  );
}
