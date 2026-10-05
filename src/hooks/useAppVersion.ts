import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const KEY = "axchess-version";
const listeners = new Set<(v: string) => void>();

export function setAppVersionLocal(v: string) {
  try {
    localStorage.setItem(KEY, v);
  } catch {}
  listeners.forEach((l) => l(v));
}

/** Current app version from settings, cached for offline use. */
export function useAppVersion() {
  const [version, setVersion] = useState("v1.0.0");
  useEffect(() => {
    try {
      const cached = localStorage.getItem(KEY);
      if (cached) setVersion(cached);
    } catch {}
    listeners.add(setVersion);
    void supabase
      .from("app_settings")
      .select("version")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.version) setAppVersionLocal(data.version);
      });
    return () => {
      listeners.delete(setVersion);
    };
  }, []);
  return version;
}

export const OWNER_USERNAMES = ["aksh", "axchess"];
