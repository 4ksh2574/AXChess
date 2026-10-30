// Firebase is loaded from Google's official ESM CDN so the Pages build
// does not need a generated lockfile or a server-side Firebase credential.
import { firebaseConfig } from "./config";

const FIREBASE_SDK_VERSION = "13.1.0";
type SdkModule = Record<string, any>;

export type FirebaseRuntime = {
  app: any;
  auth: any;
  db: any;
  authSdk: SdkModule;
  firestoreSdk: SdkModule;
};

let runtimePromise: Promise<FirebaseRuntime> | null = null;

function loadSdkModule(name: "app" | "auth" | "firestore"): Promise<SdkModule> {
  const url = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-${name}.js`;
  return import(/* @vite-ignore */ url) as Promise<SdkModule>;
}

export function getFirebaseRuntime(): Promise<FirebaseRuntime> {
  if (!runtimePromise) {
    runtimePromise = Promise.all([
      loadSdkModule("app"),
      loadSdkModule("auth"),
      loadSdkModule("firestore"),
    ])
      .then(([appSdk, authSdk, firestoreSdk]) => {
        const app = appSdk.getApps().length
          ? appSdk.getApp()
          : appSdk.initializeApp(firebaseConfig);
        return {
          app,
          auth: authSdk.getAuth(app),
          db: firestoreSdk.getFirestore(app),
          authSdk,
          firestoreSdk,
        };
      })
      .catch((error) => {
        runtimePromise = null;
        throw error;
      });
  }
  return runtimePromise;
}

/** Wait until Firebase has restored its persisted session before guarding a route. */
export async function waitForCurrentUser(): Promise<any | null> {
  const { auth, authSdk } = await getFirebaseRuntime();
  return new Promise((resolve, reject) => {
    let unsubscribe: (() => void) | undefined;
    unsubscribe = authSdk.onAuthStateChanged(
      auth,
      (user: any) => {
        unsubscribe?.();
        resolve(user ?? null);
      },
      (error: unknown) => {
        unsubscribe?.();
        reject(error);
      },
    );
  });
}

export function firebaseErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "The email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account already uses this email. Try signing in instead.";
    case "auth/weak-password":
      return "Choose a stronger password (at least 6 characters).";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a little and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before it finished.";
    case "auth/account-exists-with-different-credential":
      return "This email already has another sign-in method. Sign in with it first to link Google.";
    default:
      return error instanceof Error ? error.message : "Something went wrong. Please try again.";
  }
}
