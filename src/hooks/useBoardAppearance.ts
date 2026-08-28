import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_APPEARANCE,
  deriveTheme,
  loadAppearance,
  saveAppearance,
  type Appearance,
} from "@/lib/board-appearance";
import { createPieceSet } from "@/components/chess/pieceSets";

/**
 * Tiny external store so the lobby, the board and the appearance page all
 * observe the same palette and update together the moment a slider moves.
 */

let state: Appearance | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Appearance {
  if (!state) state = loadAppearance();
  return state;
}

function getServerSnapshot(): Appearance {
  return DEFAULT_APPEARANCE;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function write(next: Appearance) {
  state = next;
  saveAppearance(next);
  for (const l of listeners) l();
}

export function useBoardAppearance() {
  const appearance = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const theme = useMemo(() => deriveTheme(appearance), [appearance]);
  const pieces = useMemo(() => createPieceSet(appearance.setId, theme), [appearance.setId, theme]);

  const update = useCallback((patch: Partial<Appearance>) => {
    write({ ...getSnapshot(), ...patch });
  }, []);

  const reset = useCallback(() => write(DEFAULT_APPEARANCE), []);

  // Keep the app's accent tokens in step with the chosen tonal palette.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", theme.board.primary);
    root.style.setProperty("--ring", theme.board.primary);
    root.style.setProperty("--sidebar-primary", theme.board.primary);
  }, [theme]);

  return { appearance, theme, pieces, update, reset };
}
