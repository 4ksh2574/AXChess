import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const title = "Set a New Password — AXChess";
const description = "Choose a new password for your AXChess account.";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Use at least 6 characters.");
    if (password !== confirm) return setError("The passwords don't match.");
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError("This link has expired or is invalid. Request a new one.");
    await navigate({ to: "/profile", replace: true });
  };

  const inputCls =
    "h-14 rounded-[20px] bg-muted px-4 text-base text-foreground outline-none ring-primary/40 focus:ring-2";

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 px-4 pb-10 pt-6">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Set a new password</h1>
      <form onSubmit={submit} className="flex flex-col gap-3 rounded-[28px] bg-card p-5">
        <input type="password" required minLength={6} placeholder="New password" autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        <input type="password" required minLength={6} placeholder="Repeat new password" autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button type="submit" disabled={busy}
          className="h-14 rounded-[20px] bg-primary text-base font-medium text-primary-foreground disabled:opacity-60">
          Save new password
        </button>
      </form>
    </main>
  );
}
