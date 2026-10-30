import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { WatermarkText } from "@/components/chess/Watermark";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  firebaseErrorMessage,
  getFirebaseRuntime,
} from "@/integrations/firebase/client";
import { ensureUserProfile } from "@/integrations/firebase/profiles";

const PENDING_GOOGLE_KEY = "axchess-pending-google-credential";
const title = "Sign In or Create an Account — AXChess";
const description =
  "Create your AXChess player account to pick a username and keep your profile across games.";

export const Route = createFileRoute("/auth")({
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
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingGoogleLink, setPendingGoogleLink] = useState(false);

  useEffect(() => {
    let active = true;
    void getFirebaseRuntime()
      .then(async ({ auth, authSdk }) => {
        try {
          const result = await authSdk.getRedirectResult(auth);
          if (result?.user) {
            await ensureUserProfile(result.user);
            if (active) await navigate({ to: "/profile", replace: true });
            return;
          }
          if (auth.currentUser) {
            await ensureUserProfile(auth.currentUser);
            if (active) await navigate({ to: "/profile", replace: true });
          }
        } catch (redirectError) {
          const code = (redirectError as { code?: string })?.code;
          if (code === "auth/account-exists-with-different-credential") {
            const credential = authSdk.GoogleAuthProvider.credentialFromError(redirectError);
            if (credential) {
              const stored = credential.toJSON();
              try {
                sessionStorage.setItem(PENDING_GOOGLE_KEY, JSON.stringify(stored));
              } catch {
                // The same tab is needed to finish this linking flow.
              }
            }
            const conflictEmail =
              (redirectError as { customData?: { email?: string } })?.customData?.email;
            if (active) {
              if (conflictEmail) setEmail(conflictEmail);
              setPendingGoogleLink(true);
              setMessage(
                "This email already has an account. Sign in with its existing email and password below; AXChess will then link Google to that account.",
              );
            }
          } else if (active) {
            setError(firebaseErrorMessage(redirectError));
          }
        }
      })
      .catch((initError) => {
        if (active) setError(firebaseErrorMessage(initError));
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  const finishPendingGoogleLink = async (user: any, authSdk: Record<string, any>) => {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(PENDING_GOOGLE_KEY);
    } catch {
      raw = null;
    }
    if (!raw) return false;
    const saved = JSON.parse(raw) as { idToken?: string; accessToken?: string };
    const credential = authSdk.GoogleAuthProvider.credential(
      saved.idToken || undefined,
      saved.accessToken || undefined,
    );
    await authSdk.linkWithCredential(user, credential);
    try {
      sessionStorage.removeItem(PENDING_GOOGLE_KEY);
    } catch {
      // Ignore unavailable session storage.
    }
    return true;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { auth, authSdk } = await getFirebaseRuntime();
      if (mode === "signup") {
        const result = await authSdk.createUserWithEmailAndPassword(auth, email.trim(), password);
        await ensureUserProfile(result.user, username.trim());
        await navigate({ to: "/profile", replace: true });
      } else {
        const result = await authSdk.signInWithEmailAndPassword(auth, email.trim(), password);
        const linked = await finishPendingGoogleLink(result.user, authSdk);
        await ensureUserProfile(result.user);
        if (linked) setMessage("Google has been linked to your existing AXChess account.");
        await navigate({ to: "/profile", replace: true });
      }
    } catch (submitError) {
      setError(firebaseErrorMessage(submitError));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { auth, authSdk } = await getFirebaseRuntime();
      const provider = new authSdk.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await authSdk.signInWithRedirect(auth, provider);
    } catch (googleError) {
      setError(firebaseErrorMessage(googleError));
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    setError(null);
    setMessage(null);
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setBusy(true);
    try {
      const { auth, authSdk } = await getFirebaseRuntime();
      await authSdk.sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      });
      setMessage("Password reset instructions have been sent if this email has an account. Follow the email link to continue.");
    } catch (resetError) {
      setError(firebaseErrorMessage(resetError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 px-4 pb-10 pt-6">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Back"
          className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
      </header>

      <GlassCard as="form" onSubmit={submit} className="flex flex-col gap-3 rounded-[28px] bg-card p-5">
        {mode === "signup" ? (
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username (optional)"
            autoCapitalize="none"
            maxLength={24}
            className="h-14 rounded-[20px] bg-muted px-4 text-base text-foreground outline-none ring-primary/40 focus:ring-2"
          />
        ) : null}
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          required
          placeholder="Email"
          autoComplete="email"
          className="h-14 rounded-[20px] bg-muted px-4 text-base text-foreground outline-none ring-primary/40 focus:ring-2"
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          required
          minLength={6}
          placeholder="Password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          className="h-14 rounded-[20px] bg-muted px-4 text-base text-foreground outline-none ring-primary/40 focus:ring-2"
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

        <Button variant="ghost" type="submit" disabled={busy}
          className="h-14 rounded-[20px] bg-primary text-base font-medium text-primary-foreground disabled:opacity-60">
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>

        {mode === "signin" ? (
          <Button variant="ghost" type="button" disabled={busy} onClick={forgotPassword}
            className="h-10 text-sm font-medium text-primary">
            Forgot password?
          </Button>
        ) : null}

        <Button variant="ghost" type="button" disabled={busy} onClick={google}
          className="h-14 rounded-[20px] bg-secondary text-base font-medium text-secondary-foreground">
          Continue with Google
        </Button>

        <Button variant="ghost" type="button" disabled={busy}
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setMessage(null);
          }}
          className="h-12 text-sm font-medium text-muted-foreground">
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </Button>
      </GlassCard>

      <p className="text-center text-xs text-muted-foreground">
        {pendingGoogleLink
          ? "After signing in with your existing method, Google will be linked to the same account."
          : "Your player profile is synced across your signed-in devices."}
      </p>

      <footer className="mt-auto pt-8 text-center text-[11px] font-medium tracking-wide text-muted-foreground">
        <WatermarkText />
      </footer>
    </main>
  );
}
