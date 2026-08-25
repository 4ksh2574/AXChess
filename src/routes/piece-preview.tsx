import { createFileRoute } from "@tanstack/react-router";
import { materialPieces, boardTheme } from "@/components/chess/MaterialPieces";

export const Route = createFileRoute("/piece-preview")({
  component: Preview,
});

function Preview() {
  const keys = ["wk", "wq", "wr", "wb", "wn", "wp", "bk", "bq", "br", "bb", "bn", "bp"];
  return (
    <div className="grid grid-cols-6" style={{ width: 384 }}>
      {keys.map((k, i) => {
        const Render = (materialPieces as Record<string, any>)[k];
        const dark = (i + Math.floor(i / 6)) % 2 === 0;
        return (
          <div key={k} style={{ background: dark ? boardTheme.dark : boardTheme.light, width: 64, height: 64, padding: 4 }}>
            <Render />
          </div>
        );
      })}
    </div>
  );
}
