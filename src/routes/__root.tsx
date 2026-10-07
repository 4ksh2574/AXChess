import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { registerOfflineSupport } from "../lib/pwa";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: import("@tanstack/react-router").ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
      },
      { title: "AXChess" },
      { name: "description", content: "Peer-to-peer chess you can play with a friend instantly." },
      { name: "theme-color", content: "#F7F2FA" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-dark-surface" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    registerOfflineSupport();
  }, []);

  // Dynamic liquid glass: the highlight on glass surfaces follows the pointer/finger.
  useEffect(() => {
    let frame = 0;
    let last: { x: number; y: number; target: EventTarget | null } | null = null;
    const root = document.documentElement;
    let tilted: HTMLElement | null = null;
    const apply = () => {
      frame = 0;
      const e = last;
      if (!e) return;
      root.style.setProperty("--gx", `${e.x}px`);
      root.style.setProperty("--gy", `${e.y}px`);
      if (!(e.target instanceof Element)) return;
      const el = e.target.closest<HTMLElement>(".bg-card, .bg-popover, .bg-secondary, .bg-muted, .bg-primary");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mouse-x", `${e.x - r.left}px`);
      el.style.setProperty("--mouse-y", `${e.y - r.top}px`);
      // 3D tilt from cursor delta on interactive glass (max 6deg).
      const btn = e.target.closest<HTMLElement>("button, a, [role='button']");
      if (tilted && tilted !== btn) {
        tilted.style.removeProperty("--rx");
        tilted.style.removeProperty("--ry");
        tilted = null;
      }
      if (btn && !btn.closest("[data-board]") && matchMedia("(hover: hover)").matches) {
        const b = btn.getBoundingClientRect();
        const dx = ((e.x - b.left) / b.width - 0.5) * 2;
        const dy = ((e.y - b.top) / b.height - 0.5) * 2;
        btn.style.setProperty("--rx", `${(-dy * 6).toFixed(2)}deg`);
        btn.style.setProperty("--ry", `${(dx * 6).toFixed(2)}deg`);
        tilted = btn;
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onPointer = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY, target: e.target };
      schedule();
    };
    // Touch drags that scroll cancel pointer events, so follow the finger via touchmove too.
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      last = { x: t.clientX, y: t.clientY, target: document.elementFromPoint(t.clientX, t.clientY) };
      schedule();
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("touchmove", onTouch);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}

