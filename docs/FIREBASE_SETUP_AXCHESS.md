# AXChess Firebase setup

Project: `axchess`

## Browser configuration

The public Firebase web configuration is stored in `src/integrations/firebase/config.ts`.
The browser app loads the official modular Firebase SDK from Google's ESM CDN.
Firebase web config is public client metadata; never add service-account JSON,
Admin SDK credentials, private keys, or other server secrets to this repository.

## Firebase Console checklist

1. Authentication: enable Email/Password and Google.
2. Authentication → Settings → Authorized domains: include
   `4ksh2574.github.io`.
3. Authentication → User account linking: choose
   **Link accounts that use the same email**.
4. Firestore: create the database.
5. Publish `firebase/firestore.rules` in Firestore → Rules.

## Storage is intentionally not required

Do not upgrade to Blaze for AXChess. Firebase Storage currently requires a
billing account for this project, so avatar uploads are disabled in the first
GitHub release. Players can use a Google profile image or an HTTPS image URL.
The file `firebase/storage.rules` is retained only as a reference for a future
Storage rollout; do not configure Storage or add billing just for this release.

## Firestore data model

- `profiles/{firebaseUid}`: private player profile fields
  (`username`, `displayName`, `bio`, `avatarPath`, timestamps).
- `usernames/{normalizedUsername}`: public username reservation containing
  only the owning Firebase UID.
- `appSettings/{document}`: public-readable settings; writes require the
  trusted Firebase custom claim `owner: true`.

Username creation and changes use Firestore transactions. Rules require the
username reservation and profile write to belong to the same authenticated UID.

## Account linking

If Google sign-in returns
`auth/account-exists-with-different-credential`, AXChess keeps the pending
Google credential in the current browser tab. The player signs in with the
existing email/password account, then the app links Google to that same Firebase
UID. Do not assume that selecting the Console setting alone performs this
linking in client code.

## Security notes

- Player profile documents are private to their authenticated UID.
- Username reservations expose only a username and UID; they do not expose email.
- App ownership is not inferred from a username. Owner-only writes require a
  custom claim assigned by a trusted Admin SDK environment.
- Never grant custom claims from browser code.
- Existing Supabase profiles/passwords are not silently assumed to be migrated.
  A controlled export and UID mapping are required to preserve old records.
