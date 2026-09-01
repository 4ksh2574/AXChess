import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, resolveAvatar } from "@/hooks/useAuth";

const title = "Your Player Profile — AXChess";
const description =
  "Edit your AXChess player profile: display name, username, avatar picture and a short bio your opponents can see.";

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
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name);
    setUsername(profile.username);
    setBio(profile.bio ?? "");
  }, [profile]);

  useEffect(() => setPreview(avatarUrl), [avatarUrl]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (clean.length < 3) {
      setError("Username needs at least 3 letters, numbers or underscores.");
      setBusy(false);
      return;
    }
    const { error: err } = await supabase
      .from("profiles")
      .update({
        username: clean,
        display_name: displayName.trim() || clean,
        bio: bio.trim() || null,
      })
      .eq("id", user.id);
    if (err) {
      setError(
        err.code === "23505" ? "That username is already taken." : "Could not save changes.",
      );
    } else {
      setUsername(clean);
      setStatus("Profile saved");
      await refreshProfile();
    }
    setBusy(false);
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setBusy(true);
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setError("Upload failed. Try a smaller image.");
      setBusy(false);
      return;
    }
    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ avatar_url: path })
      .eq("id", user.id);
    if (dbErr) setError("Could not save the new picture.");
    else {
      setPreview(await resolveAvatar(path));
      setStatus("Picture updated");
      await refreshProfile();
    }
    setBusy(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await navigate({ to: "/", replace: true });
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
        <button
          onClick={signOut}
          aria-label="Sign out"
          className="ml-auto grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <section className="flex items-center gap-4 rounded-[28px] bg-card p-5">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-2xl font-semibold text-foreground"
          aria-label="Change profile picture"
        >
          {preview ? (
            <img src={preview} alt="Your avatar" className="h-full w-full object-cover" />
          ) : (
            (displayName || username || "?").slice(0, 1).toUpperCase()
          )}
          <span className="absolute bottom-0 grid h-6 w-full place-items-center bg-primary/85 text-primary-foreground">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </button>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">
            {displayName || username}
          </p>
          <p className="truncate text-sm text-muted-foreground">@{username}</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadAvatar(file);
          }}
        />
      </section>

      <form onSubmit={save} className="flex flex-col gap-3 rounded-[28px] bg-card p-5">
        <label className="text-sm font-medium text-foreground">
          Display name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
            className="mt-2 h-14 w-full rounded-[20px] bg-muted px-4 text-base outline-none ring-primary/40 focus:ring-2"
          />
        </label>
        <label className="text-sm font-medium text-foreground">
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            maxLength={24}
            className="mt-2 h-14 w-full rounded-[20px] bg-muted px-4 text-base outline-none ring-primary/40 focus:ring-2"
          />
        </label>
        <label className="text-sm font-medium text-foreground">
          Bio
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={160}
            className="mt-2 w-full rounded-[20px] bg-muted px-4 py-3 text-base outline-none ring-primary/40 focus:ring-2"
          />
        </label>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="h-14 rounded-[20px] bg-primary text-base font-medium text-primary-foreground disabled:opacity-60"
        >
          Save profile
        </button>
      </form>

      <footer className="mt-auto pt-8 text-center text-[11px] font-medium tracking-wide text-muted-foreground">
        made by 4ksh2574
      </footer>
    </main>
  );
}
