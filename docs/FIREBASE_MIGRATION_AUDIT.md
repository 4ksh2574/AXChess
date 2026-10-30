# AXChess Firebase + GitHub Pages migration audit

Branch: `migration/firebase-github-pages`

## Current state

- The GitHub Pages static-build groundwork and Firebase project configuration are committed on this migration branch.
- Firebase Authentication is configured by the project owner for Email/Password and Google.
- The GitHub Pages host `4ksh2574.github.io` is present in Firebase Authorized domains.
- User account linking is configured to link accounts that use the same email.
- Firebase Storage is intentionally excluded because the project is on the no-cost Spark plan and Storage currently prompts for a Blaze billing account.
- The existing Lovable-hosted application and default branch are not being changed by this migration branch.

## Source audit findings

The current application still uses Supabase in several user-facing paths:

| Area | Current dependency | Required Firebase replacement |
|---|---|---|
| Auth state | `src/hooks/useAuth.ts` uses Supabase sessions and auth listeners | Firebase `onAuthStateChanged` and Firebase User |
| Email sign-in/sign-up | `src/routes/auth.tsx` uses Supabase Auth | Firebase email/password methods |
| Google sign-in | `src/routes/auth.tsx` uses the Lovable OAuth bridge | Firebase Google provider; prefer redirect-compatible flow on mobile |
| Account linking | No explicit Supabase-to-Firebase equivalent exists | Preserve pending OAuth credential, reauthenticate with existing provider, then call `linkWithCredential` |
| Protected routes | `src/routes/_authenticated/route.tsx` calls Supabase `getUser()` | Firebase current-user check; route guard must wait for auth initialization |
| Profiles | `src/hooks/useAuth.ts` and `src/routes/_authenticated/profile.tsx` query/update Supabase `profiles` | Firestore profile documents keyed by Firebase UID |
| Avatars | Profile route uploads to Supabase Storage and resolves signed URLs | No upload path in the first Firebase release; keep a validated external image URL or show initials |
| Password reset | `src/routes/auth.tsx` and `src/routes/reset-password.tsx` use Supabase reset links | Firebase `sendPasswordResetEmail`; handle Firebase action links |
| Password change | Profile route calls Supabase `updateUser` | Firebase `reauthenticateWithCredential` + `updatePassword` |
| App version | `src/hooks/useAppVersion.ts` reads Supabase `app_settings` | Firestore setting with owner-only authorization, or static version until trusted owner claims are provisioned |

## Security decisions

1. Never use a client-side username such as `aksh` or `axchess` as proof of app ownership. Owner-only writes must use a trusted Firebase custom claim set by a trusted Admin SDK environment, never by browser code.
2. Do not allow a user to claim a username solely by writing an arbitrary profile document. Username reservation must use a Firestore transaction and rules that bind the reservation to the authenticated UID.
3. Keep profile fields private by default until the app's opponent-facing/public profile requirements are explicitly modeled. Do not expose email addresses in public profile documents.
4. Firebase web configuration is public client configuration. Never commit service-account JSON, Admin SDK credentials, private keys, or other server secrets.
5. Account linking must be an explicit recovery flow. The configured same-email policy can return `auth/account-exists-with-different-credential`; the app must retain the pending credential, ask the user to authenticate with the existing method, then link it. Do not assume `auth.currentUser` is already authenticated in the error handler.
6. Do not migrate passwords by copying client-side credentials. Existing Supabase users may need a controlled account migration or password reset; preserve their game/profile data by a deliberate UID mapping rather than assuming Supabase and Firebase UIDs match.

## Implementation sequence

1. Add the Firebase Web SDK and update the Bun lockfile in a reproducible CI/build environment.
2. Create a Firebase client module with the existing public web config and Auth/Firestore initialization.
3. Replace the auth hook and protected-route guard, preserving a loading state while Firebase restores the session.
4. Replace sign-up, sign-in, Google sign-in, account linking, password reset, and password change flows.
5. Implement Firestore profile creation and updates with transactional username reservation.
6. Replace the Supabase app-version read path; defer owner writes until a trusted custom-claim provisioning process exists.
7. Audit every remaining Supabase/Lovable import and all multiplayer/game-data persistence before removing Supabase dependencies.
8. Validate GitHub Pages deep links, auth redirects, Firestore rules, mobile browser behavior, PWA assets, and standalone Capacitor packaging.
9. Keep the migration PR unmerged until these checks pass. Do not change the production Lovable app during this work.

## Current limitation

The migration is not yet a working Firebase conversion. The app source still imports Supabase, and the Firebase SDK has not yet been added. The existing successful Pages workflow only proves that the current static build step completes; it does not prove that the deployed app is fully independent of Lovable or that Firebase sign-in works.
