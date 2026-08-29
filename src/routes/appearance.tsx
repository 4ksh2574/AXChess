import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AppearanceStudio = lazy(() => import("@/components/chess/AppearanceStudio"));

const title = "Board Appearance — AXChess";
const description =
  "Customise your AXChess board: pick a piece set and tune hue, saturation and contrast with a live preview.";

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

function Skeleton() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 px-4 pt-6">
      <div className="h-10 w-40 animate-pulse rounded-2xl bg-muted" />
      <div className="aspect-square w-full animate-pulse rounded-[28px] bg-muted" />
    </div>
  );
}

function AppearanceRoute() {
  return (
    <ClientOnly fallback={<Skeleton />}>
      <Suspense fallback={<Skeleton />}>
        <AppearanceStudio />
      </Suspense>
    </ClientOnly>
  );
}
