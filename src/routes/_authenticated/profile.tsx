import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { WatermarkText } from "@/components/chess/Watermark";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getFirebaseRuntime, firebaseErrorMessage } from "@/integrations/firebase/client";
import { saveUserProfile } from "@/integrations/firebase/profiles";

const title = "Your Player Profile — AXChess";
const description =
  "Edit your AXChess player profile: display name, username, picture URL and a short bio.";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, avatarUrl, loading, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [pictureUrl, setPictureUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name);
    setUsername(profile.username);
    setBio(profile.bio ?? "");
    setPictureUrl(profile.avatar_url ?? "");
  }, [profile]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await saveUserProfile(user, {
        username,
        displayName,
        bio,
        avatarPath: pictureUrl.trim() || null,
      });
      await refreshProfile();
      setStatus("Profile saved");
    } catch (saveError) {
      const message = firebaseErrorMessage(saveError);
      setError(message.includes("already taken") ? message : message || "Could not save changes.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    try {
      const { auth, authSdk } = await getFirebaseRuntime();
      await authSdk.signOut(auth);
      await navigate({ to: "/", replace: true });
    } catch (signOutError) {
      setError(firebaseErrorMessage(signOutError));
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-md px-4 pt-6">
        <div className="h-40 w-full animate-pulse rounded-[28px] bg-muted" />
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 px-4 pb-10 pt-6">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Back to game"
          className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Your profile</h1>
        <Button variant="ghost" onClick={signOut} aria-label="Sign out"
          className="ml-auto grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <GlassCard as="section" className="flex items-center gap-4 rounded-[28px] bg-card p-5">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-2xl font-semibold text-foreground">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Your avatar" className="h-full w-full object-cover" />
          ) : (
            (displayName || username || "?").slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">{displayName || username}</p>
          <p className="truncate text-sm text-muted-foreground">@{username}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </GlassCard>

      <GlassCard as="form" onSubmit={save} className="flex flex-col gap-3 rounded-[28px] bg-card p-5">
        <label className="text-sm font-medium text-foreground">
          Display name
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)}
            maxLength={40}
            className="mt-2 h-14 w-full rounded-[20px] bg-muted px-4 text-base outline-none ring-primary/40 focus:ring-2" />
        </label>
        <label className="text-sm font-medium text-foreground">
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)}
            autoCapitalize="none" maxLength={24}
            className="mt-2 h-14 w-full rounded-[20px] bg-muted px-4 text-base outline-none ring-primary/40 focus:ring-2" />
        </label>
        <label className="text-sm font-medium text-foreground">
          Bio
          <textarea value={bio} onChange={(event) => setBio(event.target.value)}
            rows={3} maxLength={160}
            className="mt-2 w-full rounded-[20px] bg-muted px-4 py-3 text-base outline-none ring-primary/40 focus:ring-2" />
        </label>
        <label className="text-sm font-medium text-foreground">
          Profile picture URL
          <input type="url" inputMode="url" placeholder="https://example.com/avatar.jpg"
            value={pictureUrl} onChange={(event) => setPictureUrl(event.target.value)}
            className="mt-2 h-14 w-full rounded-[20px] bg-muted px-4 text-base outline-none ring-primary/40 focus:ring-2" />
          <span className="mt-1 block text-xs text-muted-foreground">
            Use an HTTPS image link. File uploads are paused because Firebase Storage requires billing.
          </span>
        </label>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

        <Button variant="ghost" type="submit" disabled={busy}
          className="h-14 rounded-[20px] bg-primary text-base font-medium text-primary-foreground disabled:opacity-60">
          {busy ? "Saving…" : "Save profile"}
        </Button>
      </GlassCard>

      <ChangePasswordPanel user={user} />
      <footer className="mt-auto pt-8 text-center text-[11px] font-medium tracking-wide text-muted-foreground">
        <WatermarkText />
      </footer>
    </main>
  );
}

function ChangePasswordPanel({ user }: {
  user: { email?: string | null; providerData?: Array<{ providerId: string }> } | null;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hasPasswordProvider = !!user?.providerData?.some((provider) => provider.providerId === "password");

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (next.length < 6) return setError("Use at least 6 characters.");
    setBusy(true);
    try {
      const { auth, authSdk } = await getFirebaseRuntime();
      const activeUser = auth.currentUser;
      if (!activeUser?.email) throw new Error("Your signed-in account does not have an email address.");
      if (hasPasswordProvider) {
        const credential = authSdk.EmailAuthProvider.credential(activeUser.email, current);
        await authSdk.reauthenticateWithCredential(activeUser, credential);
        await authSdk.updatePassword(activeUser, next);
        setMessage("Password changed");
      } else {
        const credential = authSdk.EmailAuthProvider.credential(activeUser.email, next);
        await authSdk.linkWithCredential(activeUser, credential);
        setMessage("Email/password sign-in added to your Google account.");
      }
      setCurrent("");
      setNext("");
    } catch (changeError) {
      setError(firebaseErrorMessage(changeError));
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "mt-2 h-14 w-full rounded-[20px] bg-muted px-4 text-base outline-none ring-primary/40 focus:ring-2";

  return (
    <GlassCard as="form" onSubmit={save} className="flex flex-col gap-3 rounded-[28px] bg-card p-5">
      <p className="text-sm font-semibold text-foreground">
        {hasPasswordProvider ? "Change password" : "Add email/password sign-in"}
      </p>
      {!hasPasswordProvider ? (
        <p className="text-xs text-muted-foreground">
          Add a password to your Google account so you can use either sign-in method.
        </p>
      ) : (
        <label className="text-sm font-medium text-foreground">
          Current password
          <input type="password" autoComplete="current-password" value={current}
            onChange={(event) => setCurrent(event.target.value)} className={inputClass} />
        </label>
      )}
      <label className="text-sm font-medium text-foreground">
        {hasPasswordProvider ? "New password" : "Create password"}
        <input type="password" required minLength={6} autoComplete="new-password" value={next}
          onChange={(event) => setNext(event.target.value)} className={inputClass} />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button variant="ghost" type="submit" disabled={busy}
        className="h-14 rounded-[20px] bg-secondary text-base font-medium text-secondary-foreground disabled:opacity-60">
        {busy ? "Updating…" : hasPasswordProvider ? "Update password" : "Add password"}
      </Button>
    </GlassCard>
  );
}
