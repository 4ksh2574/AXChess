type Props = {
  name: string;
  color: "white" | "black";
  isTurn: boolean;
  captured: string[];
  isYou?: boolean;
  avatarUrl?: string | null | undefined;
};

const GLYPHS: Record<string, string> = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
};

export function PlayerCard({ name, color, isTurn, captured, isYou, avatarUrl }: Props) {
  return (
    <div
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[24px] px-4 py-3 transition-colors ${
        isTurn ? "bg-primary/15 ring-2 ring-primary/40" : "bg-card"
      }`}
    >
      <div
        className={`grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl text-lg font-semibold ${
          color === "white"
            ? "bg-secondary text-secondary-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          name.slice(0, 1).toUpperCase()
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {name}
          {isYou ? " (you)" : ""}
        </p>
        <p className="flex min-h-5 items-center gap-0.5 truncate text-base leading-none text-muted-foreground">
          {captured.length > 0 ? (
            captured.map((piece, i) => <span key={`${piece}-${i}`}>{GLYPHS[piece] ?? ""}</span>)
          ) : (
            <span className="text-xs">{color === "white" ? "White" : "Black"}</span>
          )}
        </p>
      </div>
      {isTurn ? (
        <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          Turn
        </span>
      ) : null}
    </div>
  );
}
