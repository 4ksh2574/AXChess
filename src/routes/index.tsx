import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const ChessApp = lazy(() => import("@/components/chess/ChessApp"));

const title = "AXChess — Play Chess With a Friend, No Signup";
const description =
  "Free peer-to-peer chess for phones. Create a game code, share the link, and play a friend instantly — no accounts, no servers.";

export const Route = createFileRoute("/")({
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
  component: Index,
});

function BoardSkeleton() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 px-4 pt-6">
      <div className="h-10 w-40 animate-pulse rounded-2xl bg-muted" />
      <div className="aspect-square w-full animate-pulse rounded-[28px] bg-muted" />
    </div>
  );
}

function Index() {
  return (
    <ClientOnly fallback={<BoardSkeleton />}>
      <Suspense fallback={<BoardSkeleton />}>
        <ChessApp />
      </Suspense>
    </ClientOnly>
  );
}
