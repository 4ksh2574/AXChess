# AXChess: Firebase + GitHub Pages migration

## Goal

Make this repository the source of truth for the complete AXChess web app. The production web app must build and run from GitHub-hosted source without requiring Lovable hosting or a Lovable runtime. Keep the existing Lovable project usable during the transition; do not remove its dependencies or change its current production path until the replacement has passed verification.

## Current architecture audit (2026-10-30)

- React 19 + Vite 8 + TanStack Start/Router; the current Vite config is supplied by `@lovable.dev/vite-tanstack-config` and includes a Nitro/TanStack Start server build.
- Authentication and profile data currently use Supabase. `src/hooks/useAuth.ts` reads `profiles`, and `src/routes/auth.tsx` uses Supabase email/password plus Lovable's Google OAuth bridge.
- `src/routes/_authenticated/route.tsx` performs a Supabase session check.
- `src/routes/_authenticated/profile.tsx` updates profile fields, uploads avatars to the Supabase `avatars` bucket, reads/writes `app_settings`, changes passwords, and signs out.
- `src/hooks/useAppVersion.ts` reads `app_settings` and currently treats usernames `aksh` and `axchess` as owner identifiers.
- `src/components/chess/Watermark.tsx` renders the in-app text “made by 4ksh2574 · <version>”. This is app branding, not the injected Lovable badge; retain it unless explicitly requested otherwise.
- The Capacitor config currently points at `https://axchess.lovable.app`; the existing APK is therefore a remote web wrapper, not a bundled independent app.
- The chess UI/engine and PeerJS multiplayer should remain intact during the first backend migration.

## Target architecture

- Static React/Vite frontend deployed under `https://4ksh2574.github.io/AXChess/`.
- Firebase Authentication for email/password and Google sign-in.
- Cloud Firestore for player profiles and app settings.
- Firebase Storage for avatars.
- Keep PeerJS/WebRTC chess-room networking unchanged initially.
- Capacitor packages the built frontend assets for the Android app; no Lovable URL in the final production config.
- Lovable remains a development/preview compatibility target during migration, but is not a production dependency.

## Migration sequence

1. **Stabilize the build:** identify all server-only TanStack Start/Nitro routes and APIs; determine whether the current app can be exported as a static SPA. Add a dedicated static GitHub Pages build with the repository base path and deep-link fallback. Keep the existing Lovable build unchanged until parity is proven.
2. **Introduce Firebase behind adapters:** add a Firebase client module and typed auth/profile/settings interfaces. Avoid scattering Firebase SDK calls through UI components.
3. **Migrate authentication:** support email/password, Google sign-in, password reset, and auth-state restoration. Configure Firebase authorized domains for the GitHub Pages origin and any required Capacitor origin.
4. **Migrate user data:** map Supabase `profiles` to Firestore documents keyed by Firebase UID; preserve usernames with a uniqueness strategy; map `app_settings` to a protected settings document; move avatar objects to Firebase Storage.
5. **Secure owner functions:** do not use a user-editable username as authorization. Replace `OWNER_USERNAMES` checks with a trusted Firebase custom claim or a server-managed allowlist. Client rules must prevent users from granting themselves owner access or changing privileged fields.
6. **Verify chess functionality:** test local/pass-and-play, computer play, online PeerJS rooms, profile display, account flows, avatar upload, and app version display.
7. **Build distribution:** point Capacitor at the local static build output, create a new APK release, and verify install/launch on Android.
8. **Cut over:** only after successful verification, update README links and retire Supabase/Lovable runtime dependencies. Keep rollback instructions until the new deployment is stable.

## Data and account migration notes

- Profile records and avatar files can be migrated after a controlled export from Supabase.
- Password migration is not assumed. Existing password hashes may not be importable without the exact source hash algorithm and parameters; if a safe bulk import is not supported, users will need a Firebase password reset or account re-authentication.
- Do not place Firebase service-account credentials, private keys, Supabase service-role keys, or other server secrets in the browser bundle, Git history, or chat.
- Firebase web app configuration is intended for client initialization, but access must still be protected by Authentication, Firestore rules, Storage rules, and appropriate App Check policy.

## Inputs needed before live Firebase wiring

- The Firebase project to use for AXChess (recommended: a separate project from the user's unrelated OpenRole Firebase project).
- Firebase web-app config values (public client config only; never a service-account key).
- Whether existing accounts/usernames must be preserved. Default recommendation: preserve profile data and usernames; handle passwords separately if necessary.
- Access to the existing Supabase project for controlled export of profiles and avatar files if preservation is required.

## Acceptance criteria

- GitHub Pages serves the actual playable AXChess app, not just a project landing page.
- No production request depends on Lovable hosting, Lovable cloud auth, or Lovable-only build plugins.
- Existing chess modes and PeerJS multiplayer still work.
- Firebase sign-in, profile editing, username uniqueness, avatar upload, and protected app settings work.
- Android APK launches the bundled app and does not load `axchess.lovable.app`.
- Lovable preview remains usable during the transition, or any unavoidable incompatibility is documented before cutover.
