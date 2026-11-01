import { useMemo, useSyncExternalStore } from "react";
import {
  BACKGROUNDS,
  DEFAULT_APPEARANCE,
  deriveTheme,
  loadAppearance,
  loadCustomBackground,
  saveAppearance,
  saveCustomBackground,
  type AppearanceState,
  type BoardTheme,
} from "@/lib/board-appearance";
import { buildPieces } from "@/components/chess/pieceSets";

/**
 * Tiny external store so the lobby, the board and the appearance studio all
 * update together the instant a slider moves.
 */

let state: AppearanceState = DEFAULT_APPEARANCE;
let customBg: string | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function syncCssVars(current: AppearanceState, theme: BoardTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary", "#10B8A0");
  root.style.setProperty("--ring", "#10B8A0");

  const option = BACKGROUNDS.find((b) => b.id === current.background) ?? BACKGROUNDS[0]!;
  const url = current.background === "custom" ? customBg : option.url;
  root.style.setProperty("--app-bg-image", url ? `url("${url}")` : "none");
  root.style.setProperty("--app-bg-scrim", option.scrim);
  const mode = current.themeMode ?? "dark";
  root.classList.toggle("bg-dark-surface", mode === "dark");
  root.classList.toggle("theme-chatgpt", false);
  root.classList.toggle("theme-liquid", mode === "dark");
  root.classList.toggle("theme-light", mode === "light");
}

function subscribe(listener: () => void) {
  if (!hydrated) {
    hydrated = true;
    state = loadAppearance();
    customBg = loadCustomBackground();
    syncCssVars(state, deriveTheme(state));
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;
const getServerSnapshot = () => DEFAULT_APPEARANCE;

export function setAppearance(patch: Partial<AppearanceState>) {
  state = { ...state, ...patch };
  saveAppearance(state);
  syncCssVars(state, deriveTheme(state));
  emit();
}

/** Store (or clear) a photo from the user's gallery as the app background. */
export function setCustomBackground(dataUrl: string | null) {
  customBg = dataUrl;
  saveCustomBackground(dataUrl);
  setAppearance(dataUrl ? { background: "custom" } : { background: "midnight" });
}

export function getCustomBackground() {
  return customBg;
}

export function useBoardAppearance() {
  const appearance = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const theme = useMemo(() => deriveTheme(appearance), [appearance]);
  const pieces = useMemo(
    () => buildPieces(appearance.pieceSet, theme),
    [appearance.pieceSet, theme],
  );
  return {
    appearance,
    theme,
    pieces,
    setAppearance,
    setCustomBackground,
    customBackground: customBg,
  };
}
