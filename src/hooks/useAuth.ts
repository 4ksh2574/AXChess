import { useCallback, useEffect, useState } from "react";
import { getFirebaseRuntime } from "@/integrations/firebase/client";
import {
  ensureUserProfile,
  readUserProfile,
  type FirebaseUserLike,
} from "@/integrations/firebase/profiles";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

export function resolveAvatar(path: string | null | undefined): string | null {
  if (!path || !/^https:\/\//i.test(path)) return null;
  return path;
}

export function useAuth() {
  const [user, setUser] = useState<FirebaseUserLike | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (activeUser: FirebaseUserLike) => {
    await ensureUserProfile(activeUser);
    const data = await readUserProfile(activeUser);
    const nextProfile = data
      ? {
          id: activeUser.uid,
          username: data.username,
          display_name: data.displayName,
          avatar_url: data.avatarPath,
          bio: data.bio,
        }
      : null;
    setProfile(nextProfile);
    setAvatarUrl(resolveAvatar(data?.avatarPath));
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void getFirebaseRuntime()
      .then(({ auth, authSdk }) => {
        if (!active) return;
        unsubscribe = authSdk.onAuthStateChanged(auth, async (nextUser: FirebaseUserLike | null) => {
          if (!active) return;
          setUser(nextUser);
          if (!nextUser) {
            setProfile(null);
            setAvatarUrl(null);
            setLoading(false);
            return;
          }
          setLoading(true);
          try {
            await ensureUserProfile(nextUser);
            const data = await readUserProfile(nextUser);
            if (!active) return;
            setProfile(
              data
                ? {
                    id: nextUser.uid,
                    username: data.username,
                    display_name: data.displayName,
                    avatar_url: data.avatarPath,
                    bio: data.bio,
                  }
                : null,
            );
            setAvatarUrl(resolveAvatar(data?.avatarPath));
          } catch (error) {
            console.error("[AXChess] Could not load player profile", error);
            if (active) {
              setProfile(null);
              setAvatarUrl(null);
            }
          } finally {
            if (active) setLoading(false);
          }
        });
      })
      .catch((error) => {
        console.error("[AXChess] Firebase initialization failed", error);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user);
  }, [user, loadProfile]);

  return { user, profile, avatarUrl, loading, refreshProfile };
}
