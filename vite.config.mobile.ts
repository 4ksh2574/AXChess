// Standalone Capacitor build. Assets use root-relative paths because
// Capacitor serves the bundled site from its local WebView origin.
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/",
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: "src",
      spa: { enabled: true },
    }),
    react(),
  ],
});
