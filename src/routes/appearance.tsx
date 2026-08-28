import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AppearanceStudio = lazy(() => import("@/components/chess/AppearanceStudio"));

const title = "Board Style — Customise Your AXChess Pieces";
const description =
  "Preview Material You chess piece sets, scrub the tonal palette, and tune contrast until every piece reads perfectly on both light and dark squares.";

export const Route = createFileRoute("/appearance")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppearanceRoute,
});

function StudioSkeleton() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 px-4 pt-6">
      <div className="h-10 w-40 animate-pulse rounded-2xl bg-muted" />
      <div className="aspect-square w-full animate-pulse rounded-[28px] bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-[28px] bg-muted" />
    </div>
  );
}

function AppearanceRoute() {
  return (
    <ClientOnly fallback={<StudioSkeleton />}>
      <Suspense fallback={<StudioSkeleton />}>
        <AppearanceStudio />
      </Suspense>
    </ClientOnly>
  );
}
