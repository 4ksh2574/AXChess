// GitHub Pages build: keep the normal Lovable config untouched.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // GitHub Pages serves this repository below /AXChess/.
  vite: {
    base: "/AXChess/",
  },
  tanstackStart: {
    server: { entry: "server" },
    // Produce a static client shell; GitHub Pages has no server runtime.
    spa: { enabled: true },
  },
  // The Lovable wrapper normally enables Nitro. It is intentionally disabled
  // for this static deployment; server functions/API routes cannot run here.
  nitro: false,
});
