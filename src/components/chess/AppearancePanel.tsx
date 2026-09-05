import { useRef } from "react";
import { PIECE_SETS, PieceSvg } from "./pieceSets";
import {
  BACKGROUNDS,
  FIXED_PALETTES,
  PRESETS,
  type PieceSetId,
} from "@/lib/board-appearance";
import { useBoardAppearance } from "@/hooks/useBoardAppearance";

/** Downscale a gallery photo so it fits comfortably in local storage. */
async function toStoredDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxW = 900;
  const scale = Math.min(1, maxW / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}


function Slider({
  label,
  value,
  min,
  max,
  gradient,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  gradient: string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm font-medium text-foreground">
        {label}
        <span className="text-xs text-muted-foreground">{Math.round(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-3 w-full cursor-pointer appearance-none rounded-full outline-none"
        style={{ background: gradient }}
      />
    </label>
  );
}

export function AppearancePanel() {
  const { appearance, theme, setAppearance, setCustomBackground, customBackground } =
    useBoardAppearance();
  const fileRef = useRef<HTMLInputElement>(null);


  const hueGradient = `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360]
    .map((h) => `hsl(${h} 70% 62%)`)
    .join(", ")})`;

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="text-sm font-semibold text-foreground">Piece set</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(Object.keys(PIECE_SETS) as PieceSetId[]).map((id) => {
            const active = appearance.pieceSet === id;
            return (
              <button
                key={id}
                onClick={() => setAppearance({ pieceSet: id })}
                className={`rounded-[22px] p-3 text-left transition ${
                  active ? "bg-primary/15 ring-2 ring-primary" : "bg-card"
                }`}
              >
                <div
                  className="grid grid-cols-3 gap-1 rounded-[16px] p-2"
                  style={{ backgroundColor: theme.board.dark }}
                >
                  {(["k", "n", "p"] as const).map((p, i) => (
                    <div
                      key={p}
                      className="aspect-square rounded-md"
                      style={{
                        backgroundColor: i % 2 ? theme.board.light : theme.board.dark,
                      }}
                    >
                      <PieceSvg
                        setId={id}
                        piece={p}
                        color={i % 2 ? "b" : "w"}
                        theme={theme}
                      />
                    </div>
                  ))}
                </div>
                <span className="mt-2 block text-sm font-medium text-foreground">
                  {PIECE_SETS[id].label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground">Palette</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(FIXED_PALETTES).map(([id, palette]) => (
            <button
              key={id}
              onClick={() => setAppearance({ paletteId: id })}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${
                appearance.paletteId === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground"
              }`}
            >
              <span className="flex h-4 w-4 overflow-hidden rounded-full">
                <span
                  className="h-full w-1/2"
                  style={{ backgroundColor: palette.theme.board.light }}
                />
                <span
                  className="h-full w-1/2"
                  style={{ backgroundColor: palette.theme.board.dark }}
                />
              </span>
              {palette.label}
            </button>
          ))}
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() =>
                setAppearance({
                  paletteId: "custom",
                  hue: preset.hue,
                  saturation: preset.saturation,
                  contrast: preset.contrast,
                })
              }
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${
                appearance.paletteId === "custom" && appearance.hue === preset.hue
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground"
              }`}
            >
              <span
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: `oklch(0.6 ${0.02 + (preset.saturation / 100) * 0.11} ${preset.hue})` }}
              />
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground">Background</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {BACKGROUNDS.map((bg) => {
            const preview = bg.id === "custom" ? customBackground : bg.url;
            const active = appearance.background === bg.id;
            return (
              <button
                key={bg.id}
                onClick={() => {
                  if (bg.id === "custom" && !customBackground) {
                    fileRef.current?.click();
                    return;
                  }
                  setAppearance({ background: bg.id });
                }}
                className={`overflow-hidden rounded-[22px] p-1 text-left transition ${
                  active ? "bg-primary/15 ring-2 ring-primary" : "bg-card"
                }`}
              >
                <span
                  className="block h-20 w-full rounded-[18px] bg-muted bg-cover bg-center"
                  style={preview ? { backgroundImage: `url("${preview}")` } : undefined}
                />
                <span className="mt-2 block px-2 pb-1 text-sm font-medium text-foreground">
                  {bg.label}
                </span>
              </button>
            );
          })}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              setCustomBackground(await toStoredDataUrl(file));
            } catch {
              /* unreadable image */
            }
          }}
        />
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="h-11 flex-1 rounded-full bg-secondary text-sm font-medium text-secondary-foreground"
          >
            {customBackground ? "Change my photo" : "Use a photo"}
          </button>
          {customBackground ? (
            <button
              onClick={() => setCustomBackground(null)}
              className="h-11 rounded-full px-4 text-sm font-medium text-muted-foreground"
            >
              Remove
            </button>
          ) : null}
        </div>
      </section>


      <section className="flex flex-col gap-4 rounded-[22px] bg-card p-4">
        <Slider
          label="Hue"
          value={appearance.hue}
          min={0}
          max={360}
          gradient={hueGradient}
          onChange={(hue) => setAppearance({ hue })}
        />
        <Slider
          label="Saturation"
          value={appearance.saturation}
          min={0}
          max={100}
          gradient={`linear-gradient(to right, #d8d5da, ${theme.accent})`}
          onChange={(saturation) => setAppearance({ saturation })}
        />
        <Slider
          label="Contrast"
          value={appearance.contrast}
          min={0}
          max={100}
          gradient={`linear-gradient(to right, ${theme.board.light}, ${theme.board.dark})`}
          onChange={(contrast) => setAppearance({ contrast })}
        />
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground">Readability check</h3>
        <div className="mt-3 grid grid-cols-4 overflow-hidden rounded-[22px]">
          {(["w", "b"] as const).map((color) =>
            (["light", "dark"] as const).map((sq) =>
              (["k", "q"] as const).map((p) => (
                <div
                  key={`${color}${sq}${p}`}
                  className="aspect-square"
                  style={{ backgroundColor: theme.board[sq] }}
                >
                  <PieceSvg setId={appearance.pieceSet} piece={p} color={color} theme={theme} />
                </div>
              )),
            ),
          )}
        </div>
      </section>
    </div>
  );
}
