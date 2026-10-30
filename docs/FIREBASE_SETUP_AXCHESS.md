# AXChess Firebase setup

Project: `axchess`

## Web client configuration

The public Firebase web configuration is in `src/integrations/firebase/config.ts`.
It is intended to be included in the browser bundle. Do not add service-account JSON,
Admin SDK credentials, private keys, or other server secrets to the repository.

## Console checklist

1. Authentication: enable Email/Password and Google.
2. Authentication → Settings → Authorized domains: add
   `4ksh2574.github.io` before testing Google sign-in on GitHub Pages.
3. Firestore: create the database in the chosen region.
4. Storage: create the default bucket.
5. Publish `firebase/firestore.rules` in Firestore Rules.
6. Publish `firebase/storage.rules` in Storage Rules.

## Security model

- Player profile documents are private to their authenticated UID by default.
- Avatar uploads are scoped to `avatars/{uid}/`, limited to image MIME types and 5 MiB.
- App settings are public-read and require the Firebase Auth custom claim
  `owner: true` to write.
- Never use a client-editable username/profile field as an authorization role.
- The owner custom claim must be assigned by a trusted Admin SDK environment;
  never from browser code.

These rules are a conservative starting point. Public opponent-facing profiles
should be exposed through a separate minimal public-profile document after the
app's read requirements have been audited.
