# AXChess

A mobile-first chess experience built with React, TanStack Start, chess.js, react-chessboard and PeerJS. Play with a friend online or enjoy a local game.

**Play now:** https://axchess.lovable.app  
**Play on GitHub Pages:** https://4ksh2574.github.io/AXChess/  
**Project information:** https://4ksh2574.github.io/AXChess/project/  
**Android downloads:** https://github.com/4ksh2574/AXChess/releases/latest

## Distribution

### GitHub Pages project site

The playable GitHub Pages app is built from the TanStack Start SPA configuration in `vite.config.pages.ts`. The deployment workflow publishes the generated app shell as both `index.html` and `404.html`, so the project root always opens the game and client-side routes can recover on refresh. The separate static project information page is published at `/project/` from `docs/index.html`.

GitHub Pages must use **Settings → Pages → Build and deployment → GitHub Actions**. The Pages workflow runs on every push to `main` (not only selected folders), on pull requests for build validation, and manually through `workflow_dispatch`. Before deployment it checks that the root app shell and its local JavaScript/CSS assets exist; a failed check blocks publication.

The Lovable-hosted app at `https://axchess.lovable.app` remains a separate deployment target. Changes to this repository do not automatically publish to Lovable.

### Android APK

The Android package is a lightweight Capacitor shell that opens the same live AXChess app. This keeps the Android experience aligned with the Lovable-hosted version without maintaining a second copy of the chess and multiplayer code. An internet connection is required to load the live game.

To build and publish an APK, push a version tag:

```sh
git tag v1.0.0
git push origin v1.0.0
```

The `Build AXChess Android APK` workflow generates the Android project, builds an installable debug-signed APK, and attaches it to a GitHub Release. The APK is suitable for direct testing and installation; it is not a Play Store production-signed package.

## Development

This project is built with [Lovable](https://lovable.dev). Continue editing in the [Lovable project](https://lovable.dev/projects/4edac26a-a1ea-4d1f-b8e2-e414e88c1599); commits pushed to the connected repository remain available to Lovable.

```sh
git clone https://github.com/4ksh2574/AXChess.git
cd AXChess
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in your Supabase project URL and publishable key for local development. Never commit real environment files or service-role secrets.
