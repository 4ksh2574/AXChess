# AXChess: Firebase + GitHub Pages migration

## Goal

Make this GitHub repository the source of truth for the complete AXChess web
app. GitHub Pages must serve the actual app without requiring Lovable hosting
or Lovable's browser auth bridge. Keep the current Lovable-hosted app intact
until the replacement has passed build and runtime checks.

## Architecture decisions

- React 19, Vite 8 and TanStack Start/Router remain the app framework.
- GitHub Pages uses a dedicated Vite config based on TanStack's official Vite
  plugin. It does not use the Lovable Vite wrapper or a Nitro server runtime.
- Firebase Authentication handles Email/Password and Google sign-in.
- Cloud Firestore stores private player profiles and username reservations.
- Firebase Storage is not part of the first release because the project is on
  the no-cost Spark plan. Avatar uploads are replaced by Google photo URLs or
  HTTPS image URLs.
- Multiplayer remains PeerJS/WebRTC; the inspected game hook does not depend on
  Supabase Realtime. PeerJS room networking is being retained.
- Capacitor must package local built assets. The previous release APK still
  points to the Lovable site and is not the final standalone APK.

## Implemented on `migration/firebase-github-pages`

- Static GitHub Pages build configuration with repository base path.
- Firebase client configuration for project `axchess`.
- Browser Firebase SDK bootstrap using Google's modular ESM CDN.
- Firebase Auth state hook and authenticated route guard.
- Email/password sign-up and sign-in.
- Google sign-in redirect flow.
- Same-email account-conflict flow that preserves a pending Google credential
  and links it after the user signs in with the existing email/password account.
- Firestore profile creation, reads and updates.
- Transactional username reservation and matching Firestore rule checks.
- Password reset and password-change UI paths.
- Local cached app version; no client-side username-based owner authorization.
- Removed Supabase auth middleware from the client-independent Start bootstrap.

## Still requires verification

1. Run and pass the GitHub Pages workflow after these changes.
2. Test Email/Password signup, sign-in, password reset, Google redirect and
   same-email linking on the actual GitHub Pages domain.
3. Publish the updated `firebase/firestore.rules` from this branch in Firebase
   Console, then test profile creation and username uniqueness.
4. Verify account persistence across browsers/devices.
5. Test local play, AI play, pass-and-play, PeerJS room creation/join, reconnect,
   undo, resignation and rematch.
6. Create a mobile build that outputs the actual app into Capacitor's
   `android-web` directory, remove the Lovable remote URL, build an APK and
   test install/launch.
7. Audit remaining unused legacy Supabase/Lovable files and dependencies only
   after the new build is stable.

## Existing-account migration

The current source does not contain an approved Supabase data export or a
trusted Supabase Admin credential. Firebase Auth UIDs will therefore not
automatically match the old Supabase UIDs. Existing profiles and passwords
must not be described as migrated until a controlled export and explicit UID
mapping have been completed. Password migration may require reset/re-authentication.

## Safety and rollback

- Work stays on `migration/firebase-github-pages` and PR #2.
- Do not merge PR #2 until workflows and live tests pass.
- Do not change the existing Lovable project or production URL during migration.
- Never commit Firebase service-account keys, Admin SDK credentials, Supabase
  service-role keys or other secrets.
