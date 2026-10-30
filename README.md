# AXChess

A mobile-first chess experience built with React, TanStack Start, chess.js, react-chessboard and PeerJS. Play with a friend online or enjoy a local game.

**Play now:** https://axchess.lovable.app  
**Project site:** https://4ksh2574.github.io/AXChess/  
**Android downloads:** https://github.com/4ksh2574/AXChess/releases/latest

## Distribution

### GitHub Pages project site

The polished project portal is published from the `docs/` folder by `.github/workflows/pages.yml`. It links to the live game and the latest Android release.

After merging this setup, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source if it is not already selected. The Pages workflow then deploys automatically when `docs/` changes on `main`.

> The current game uses TanStack Start server rendering and Lovable's hosted runtime. The Pages site is a static project portal; it does not pretend to host the server-rendered game itself. The Play button opens the existing live app so multiplayer, authentication and Lovable deployments continue to use the same application.

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
