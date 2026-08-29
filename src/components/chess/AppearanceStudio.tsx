import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Shuffle } from "lucide-react";
import { Chessboard } from "react-chessboard";
import { AppearancePanel } from "./AppearancePanel";
import { useBoardAppearance } from "@/hooks/useBoardAppearance";

const POSITIONS = [
  "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1",
  "r2q1rk1/pp1nbppp/2p1bn2/3p4/3P1B2/2NBPN2/PPQ2PPP/R3K2R w KQ - 0 1",
  "2kr3r/ppp2ppp/2n1bq2/3p4/3P1B2/2P1PN2/PP3PPP/R2Q1RK1 b - - 0 1",
];

export default function AppearanceStudio() {
  const { theme, pieces } = useBoardAppearance();
  const [index, setIndex] = useState(0);

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 overflow-x-hidden px-4 pb-10 pt-6">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Back to game"
          className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Board appearance</h1>
      </header>

      <div className="sticky top-2 z-10">
        <div
          className="overflow-hidden rounded-[28px] p-2 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.5)]"
          style={{ backgroundColor: theme.board.light }}
        >
          <div className="overflow-hidden rounded-[20px]">
            <Chessboard
              options={{
                position: POSITIONS[index] as string,
                pieces,
                allowDragging: false,
                lightSquareStyle: { backgroundColor: theme.board.light },
                darkSquareStyle: { backgroundColor: theme.board.dark },
                darkSquareNotationStyle: { color: theme.board.darkNotation },
                lightSquareNotationStyle: { color: theme.board.lightNotation },
              }}
            />
          </div>
        </div>
        <button
          onClick={() => setIndex((i) => (i + 1) % POSITIONS.length)}
          className="mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium text-secondary-foreground"
        >
          <Shuffle className="h-4 w-4" />
          Shuffle position
        </button>
      </div>

      <AppearancePanel />

      <footer className="mt-auto pt-8 text-center text-[11px] font-medium tracking-wide text-muted-foreground">
        made by 4ksh2574
      </footer>
    </main>
  );
}
