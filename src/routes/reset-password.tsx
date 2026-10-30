import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getFirebaseRuntime, firebaseErrorMessage } from "@/integrations/firebase/client";

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
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const actionCode = params.get("oobCode") || "";
    if (params.get("mode") !== "resetPassword" || !actionCode) {
      setError("Open the password-reset link from your email to set a new password.");
      return;
    }
    setCode(actionCode);
    void getFirebaseRuntime()
      .then(({ auth, authSdk }) => authSdk.verifyPasswordResetCode(auth, actionCode))
      .then((verifiedEmail: string) => {
        setEmail(verifiedEmail);
        setVerified(true);
      })
      .catch((verifyError) => setError(firebaseErrorMessage(verifyError)));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!verified || !code) return setError("This reset link is not valid.");
    if (password.length < 6) return setError("Use at least 6 characters.");
    if (password !== confirm) return setError("The passwords don't match.");
    setBusy(true);
    try {
      const { auth, authSdk } = await getFirebaseRuntime();
      await authSdk.confirmPasswordReset(auth, code, password);
      await navigate({ to: "/auth", replace: true });
    } catch (submitError) {
      setError(firebaseErrorMessage(submitError));
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "h-14 rounded-[20px] bg-muted px-4 text-base text-foreground outline-none ring-primary/40 focus:ring-2";

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 px-4 pb-10 pt-6">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Set a new password</h1>
      {email ? <p className="text-sm text-muted-foreground">For {email}</p> : null}
      <GlassCard as="form" onSubmit={submit} className="flex flex-col gap-3 rounded-[28px] bg-card p-5">
        <input type="password" required minLength={6} placeholder="New password" autoComplete="new-password"
          value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
        <input type="password" required minLength={6} placeholder="Repeat new password" autoComplete="new-password"
          value={confirm} onChange={(event) => setConfirm(event.target.value)} className={inputClass} />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button variant="ghost" type="submit" disabled={busy || !verified}
          className="h-14 rounded-[20px] bg-primary text-base font-medium text-primary-foreground disabled:opacity-60">
          {busy ? "Saving…" : "Save new password"}
        </Button>
      </GlassCard>
    </main>
  );
}
