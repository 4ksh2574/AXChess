import { getFirebaseRuntime } from "./client";

export type FirebaseUserLike = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
};

export type StoredProfile = {
  username: string;
  displayName: string;
  bio: string;
  avatarPath: string | null;
};

export type ProfileDraft = {
  username: string;
  displayName: string;
  bio: string;
  avatarPath: string | null;
};

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
}

function usernameBase(user: FirebaseUserLike, preferred?: string): string {
  const source =
    preferred ||
    user.displayName ||
    user.email?.split("@")[0] ||
    "player";
  return normalizeUsername(source) || "player";
}

function usernameSuffix(user: FirebaseUserLike): string {
  return user.uid.replace(/[^a-z0-9]/gi, "").slice(0, 6).toLowerCase() || "player";
}

export async function ensureUserProfile(
  user: FirebaseUserLike,
  preferredUsername?: string,
): Promise<void> {
  const { db, firestoreSdk } = await getFirebaseRuntime();
  const { doc, runTransaction, serverTimestamp } = firestoreSdk;
  const profileRef = doc(db, "profiles", user.uid);

  await runTransaction(db, async (transaction: any) => {
    const currentProfile = await transaction.get(profileRef);
    if (currentProfile.exists()) return;

    const base = usernameBase(user, preferredUsername);
    const preferredRef = doc(db, "usernames", base);
    const preferredSnapshot = await transaction.get(preferredRef);

    let username = base;
    let usernameRef = preferredRef;
    let usernameSnapshot = preferredSnapshot;

    if (preferredSnapshot.exists() && preferredSnapshot.data().uid !== user.uid) {
      const fallback = `${base.slice(0, 17)}_${usernameSuffix(user)}`.slice(0, 24);
      usernameRef = doc(db, "usernames", fallback);
      usernameSnapshot = await transaction.get(usernameRef);
      username = fallback;
    }

    if (usernameSnapshot.exists() && usernameSnapshot.data().uid !== user.uid) {
      throw new Error("Could not reserve a username. Please try again.");
    }

    transaction.set(usernameRef, { uid: user.uid });
    transaction.set(profileRef, {
      username,
      displayName: user.displayName?.trim() || username,
      bio: "",
      avatarPath: user.photoURL || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function readUserProfile(user: FirebaseUserLike): Promise<StoredProfile | null> {
  const { db, firestoreSdk } = await getFirebaseRuntime();
  const snapshot = await firestoreSdk.getDoc(firestoreSdk.doc(db, "profiles", user.uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    username: String(data.username ?? ""),
    displayName: String(data.displayName ?? ""),
    bio: String(data.bio ?? ""),
    avatarPath: typeof data.avatarPath === "string" ? data.avatarPath : null,
  };
}

export async function saveUserProfile(
  user: FirebaseUserLike,
  draft: ProfileDraft,
): Promise<void> {
  const username = normalizeUsername(draft.username);
  if (username.length < 3) {
    throw new Error("Username needs at least 3 letters, numbers or underscores.");
  }
  if (draft.avatarPath && !/^https:\/\//i.test(draft.avatarPath)) {
    throw new Error("Profile picture must be an HTTPS image URL.");
  }

  const { db, firestoreSdk } = await getFirebaseRuntime();
  const { doc, runTransaction, serverTimestamp } = firestoreSdk;
  const profileRef = doc(db, "profiles", user.uid);

  await runTransaction(db, async (transaction: any) => {
    const profileSnapshot = await transaction.get(profileRef);
    if (!profileSnapshot.exists()) {
      throw new Error("Your profile is still being prepared. Please try again.");
    }

    const oldProfile = profileSnapshot.data();
    const oldUsername = String(oldProfile.username ?? "");
    const nextUsernameRef = doc(db, "usernames", username);
    const nextUsernameSnapshot = await transaction.get(nextUsernameRef);
    const oldUsernameRef =
      oldUsername && oldUsername !== username
        ? doc(db, "usernames", oldUsername)
        : null;
    const oldUsernameSnapshot = oldUsernameRef
      ? await transaction.get(oldUsernameRef)
      : null;

    if (
      nextUsernameSnapshot.exists() &&
      nextUsernameSnapshot.data().uid !== user.uid
    ) {
      throw new Error("That username is already taken.");
    }

    transaction.set(nextUsernameRef, { uid: user.uid });
    transaction.update(profileRef, {
      username,
      displayName: draft.displayName.trim() || username,
      bio: draft.bio.trim().slice(0, 160),
      avatarPath: draft.avatarPath || null,
      updatedAt: serverTimestamp(),
    });

    if (
      oldUsernameRef &&
      oldUsernameSnapshot?.exists() &&
      oldUsernameSnapshot.data().uid === user.uid
    ) {
      transaction.delete(oldUsernameRef);
    }
  });
}
