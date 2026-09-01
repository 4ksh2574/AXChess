import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const title = "Sign In or Create an Account — AXChess";
const description =
  "Create your AXChess player account to pick a username, upload an avatar and keep your profile across games.";

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

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/profile", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username.trim() || undefined },
          },
        });
        if (err) throw err;
        if (data.session) await navigate({ to: "/profile", replace: true });
        else setMessage("Check your email to confirm your account, then sign in.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        await navigate({ to: "/profile", replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in failed. Try again.");
      return;
    }
    if (result.redirected) return;
    await navigate({ to: "/profile", replace: true });
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

      <form
        onSubmit={submit}
        className="flex flex-col gap-3 rounded-[28px] bg-card p-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]"
      >
        {mode === "signup" ? (
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoCapitalize="none"
            className="h-14 rounded-[20px] bg-muted px-4 text-base text-foreground outline-none ring-primary/40 focus:ring-2"
          />
        ) : null}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          placeholder="Email"
          autoComplete="email"
          className="h-14 rounded-[20px] bg-muted px-4 text-base text-foreground outline-none ring-primary/40 focus:ring-2"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          minLength={6}
          placeholder="Password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          className="h-14 rounded-[20px] bg-muted px-4 text-base text-foreground outline-none ring-primary/40 focus:ring-2"
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="h-14 rounded-[20px] bg-primary text-base font-medium text-primary-foreground disabled:opacity-60"
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button
          type="button"
          onClick={google}
          className="h-14 rounded-[20px] bg-secondary text-base font-medium text-secondary-foreground"
        >
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setMessage(null);
          }}
          className="h-12 text-sm font-medium text-muted-foreground"
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </form>

      <footer className="mt-auto pt-8 text-center text-[11px] font-medium tracking-wide text-muted-foreground">
        made by 4ksh2574
      </footer>
    </main>
  );
}
