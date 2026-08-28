import {
  PALETTE_PRESETS,
  PIECE_SETS,
  deriveTheme,
  type Appearance,
  type DerivedTheme,
  type PieceSetId,
} from "@/lib/board-appearance";
import { PIECE_KEYS, PieceGlyph } from "./pieceSets";

type Props = {
  appearance: Appearance;
  theme: DerivedTheme;
  update: (patch: Partial<Appearance>) => void;
  reset: () => void;
};

/** A single piece sitting on a square of the given fill — the readability test. */
function SwatchPiece({
  setId,
  piece,
  theme,
  side,
  square,
}: {
  setId: PieceSetId;
  piece: (typeof PIECE_KEYS)[number];
  theme: DerivedTheme;
  side: "white" | "black";
  square: string;
}) {
  return (
    <div
      className="grid aspect-square place-items-center rounded-xl p-0.5"
      style={{ backgroundColor: square }}
    >
      <PieceGlyph
        setId={setId}
        piece={piece}
        tone={side === "white" ? theme.white : theme.black}
      />
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
  accent,
  hint,
  trackImage,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  accent: string;
  hint: string;
  trackImage?: string;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-xs tabular-nums text-muted-foreground">{hint}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="mt-2 h-8 w-full cursor-pointer appearance-none rounded-full bg-transparent [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:rounded-full [&::-moz-range-track]:h-3 [&::-moz-range-track]:rounded-full [&::-webkit-slider-thumb]:mt-[-7px] [&::-webkit-slider-thumb]:h-[26px] [&::-webkit-slider-thumb]:w-[26px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-card [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-[26px] [&::-moz-range-thumb]:w-[26px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-card"
        style={
          {
            "--tw-track": trackImage,
            accentColor: accent,
          } as React.CSSProperties
        }
      />
      <div
        className="-mt-[26px] mb-2 h-3 rounded-full"
        style={{
          background: trackImage ?? `linear-gradient(90deg, var(--muted), ${accent})`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export function AppearancePanel({ appearance, theme, update, reset }: Props) {
  const hueTrack = `linear-gradient(90deg, ${[0, 60, 120, 180, 240, 300, 360]
    .map((h) => deriveTheme({ ...appearance, hue: h }).board.primary)
    .join(", ")})`;

  const chromaTrack = `linear-gradient(90deg, ${deriveTheme({ ...appearance, chroma: 0 }).board.primary}, ${
    deriveTheme({ ...appearance, chroma: 100 }).board.primary
  })`;

  const contrastTrack = `linear-gradient(90deg, ${deriveTheme({ ...appearance, contrast: 0 }).board.dark}, ${
    deriveTheme({ ...appearance, contrast: 100 }).board.dark
  })`;

  return (
    <div className="flex flex-col gap-4">
      {/* ---------------- piece set ---------------- */}
      <section className="rounded-[28px] bg-card p-5 shadow-[0_8px_24px_-12px_rgba(74,68,88,0.45)]">
        <h2 className="text-lg font-semibold text-foreground">Piece set</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every set is a vector design that recolours with your palette.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {PIECE_SETS.map((set) => {
            const active = set.id === appearance.setId;
            return (
              <button
                key={set.id}
                onClick={() => update({ setId: set.id })}
                aria-pressed={active}
                className={`rounded-[20px] p-3 text-left transition-transform active:scale-[0.98] ${
                  active
                    ? "bg-primary/12 ring-2 ring-primary"
                    : "bg-muted ring-1 ring-border"
                }`}
              >
                <div
                  className="grid grid-cols-3 gap-1 rounded-2xl p-1.5"
                  style={{ backgroundColor: theme.board.dark }}
                >
                  {(["k", "n", "p"] as const).map((p) => (
                    <div key={p} className="aspect-square">
                      <PieceGlyph setId={set.id} piece={p} tone={theme.white} />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">{set.label}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{set.blurb}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------------- palette ---------------- */}
      <section className="rounded-[28px] bg-card p-5 shadow-[0_8px_24px_-12px_rgba(74,68,88,0.45)]">
        <h2 className="text-lg font-semibold text-foreground">Colour</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start from a preset, then fine-tune the tonal values.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {PALETTE_PRESETS.map((preset) => {
            const p = deriveTheme({ ...appearance, ...preset });
            const active =
              preset.hue === appearance.hue &&
              preset.chroma === appearance.chroma &&
              preset.contrast === appearance.contrast;
            return (
              <button
                key={preset.id}
                onClick={() =>
                  update({
                    hue: preset.hue,
                    chroma: preset.chroma,
                    contrast: preset.contrast,
                  })
                }
                aria-pressed={active}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-transform active:scale-95 ${
                  active
                    ? "bg-primary/15 text-primary ring-2 ring-primary"
                    : "bg-muted text-muted-foreground ring-1 ring-border"
                }`}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full ring-1 ring-border"
                  style={{ backgroundColor: p.board.primary }}
                />
                {preset.label}
              </button>
            );
          })}
        </div>

        <Slider
          label="Hue"
          value={appearance.hue}
          min={0}
          max={360}
          hint={`${Math.round(appearance.hue)}°`}
          accent={theme.board.primary}
          trackImage={hueTrack}
          onChange={(hue) => update({ hue })}
        />
        <Slider
          label="Saturation"
          value={appearance.chroma}
          min={0}
          max={100}
          hint={`${Math.round(appearance.chroma)}%`}
          accent={theme.board.primary}
          trackImage={chromaTrack}
          onChange={(chroma) => update({ chroma })}
        />
        <Slider
          label="Contrast"
          value={appearance.contrast}
          min={0}
          max={100}
          hint={`${Math.round(appearance.contrast)}%`}
          accent={theme.board.primary}
          trackImage={contrastTrack}
          onChange={(contrast) => update({ contrast })}
        />

        <button
          onClick={reset}
          className="mt-4 h-12 w-full rounded-[20px] bg-secondary text-sm font-medium text-secondary-foreground active:scale-[0.99]"
        >
          Reset to default
        </button>
      </section>

      {/* ---------------- readability ---------------- */}
      <section className="rounded-[28px] bg-card p-5 shadow-[0_8px_24px_-12px_rgba(74,68,88,0.45)]">
        <h2 className="text-lg font-semibold text-foreground">Readability check</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Both sides shown on light and dark squares.
        </p>
        <div className="mt-4 space-y-2">
          {(
            [
              { side: "white", square: theme.board.light },
              { side: "white", square: theme.board.dark },
              { side: "black", square: theme.board.light },
              { side: "black", square: theme.board.dark },
            ] as const
          ).map((row, i) => (
            <div key={i} className="grid grid-cols-6 gap-1.5">
              {PIECE_KEYS.map((p) => (
                <SwatchPiece
                  key={p}
                  setId={appearance.setId}
                  piece={p}
                  theme={theme}
                  side={row.side}
                  square={row.square}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
