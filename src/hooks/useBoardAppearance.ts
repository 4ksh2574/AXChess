import { useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_APPEARANCE,
  deriveTheme,
  loadAppearance,
  saveAppearance,
  type AppearanceState,
  type BoardTheme,
} from "@/lib/board-appearance";
import { buildPieces } from "@/components/chess/pieceSets";

/**
 * Tiny external store so the lobby, the board and the appearance studio all
 * update together the instant a slider moves.
 */

let state: AppearanceState = DEFAULT_APPEARANCE;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function syncCssVars(theme: BoardTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.accent);
  root.style.setProperty("--ring", theme.accent);
}

function subscribe(listener: () => void) {
  if (!hydrated) {
    hydrated = true;
    state = loadAppearance();
    syncCssVars(deriveTheme(state));
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;
const getServerSnapshot = () => DEFAULT_APPEARANCE;

export function setAppearance(patch: Partial<AppearanceState>) {
  state = { ...state, ...patch };
  saveAppearance(state);
  syncCssVars(deriveTheme(state));
  emit();
}

export function useBoardAppearance() {
  const appearance = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const theme = useMemo(() => deriveTheme(appearance), [appearance]);
  const pieces = useMemo(
    () => buildPieces(appearance.pieceSet, theme),
    [appearance.pieceSet, theme],
  );
  return { appearance, theme, pieces, setAppearance };
}
