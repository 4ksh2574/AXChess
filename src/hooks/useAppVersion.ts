import { useEffect, useState } from "react";

const KEY = "axchess-version";
const DEFAULT_VERSION = "v1.0.0";
const listeners = new Set<(version: string) => void>();

export function setAppVersionLocal(version: string) {
  try {
    localStorage.setItem(KEY, version);
  } catch {
    // Storage may be unavailable in private browsing.
  }
  listeners.forEach((listener) => listener(version));
}

/** Version label cached locally; it does not require a backend write. */
export function useAppVersion() {
  const [version, setVersion] = useState(DEFAULT_VERSION);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(KEY);
      if (cached) setVersion(cached);
    } catch {
      // Keep the default version when storage is unavailable.
    }
    listeners.add(setVersion);
    return () => {
      listeners.delete(setVersion);
    };
  }, []);

  return version;
}
