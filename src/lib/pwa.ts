/**
 * Guarded service-worker registration.
 *
 * The worker runs only on the published web app. Capacitor's local WebView
 * origin is deliberately excluded; the APK already bundles its app assets.
 */

const SW_URL = `${import.meta.env.BASE_URL}sw.js`;

function isPreviewHost(hostname: string) {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

async function unregisterApp() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((registration) =>
        (registration.active?.scriptURL ?? registration.installing?.scriptURL ?? "").endsWith(SW_URL),
      )
      .map((registration) => registration.unregister()),
  );
}

export function registerOfflineSupport() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const isWebOrigin =
    window.location.protocol === "https:" || window.location.protocol === "http:";
  if (!isWebOrigin) return;

  const refused =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    isPreviewHost(window.location.hostname) ||
    new URLSearchParams(window.location.search).has("sw");

  if (refused) {
    void unregisterApp();
    return;
  }

  void navigator.serviceWorker.register(SW_URL, { scope: import.meta.env.BASE_URL }).catch(() => {
    /* offline support unavailable */
  });
}
