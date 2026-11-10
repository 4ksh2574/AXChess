# AXChess

A mobile-first chess experience built with React, TanStack Start, chess.js, react-chessboard and PeerJS. Play with a friend online or enjoy a local game.

**Play AXChess:** https://4ksh2574.github.io/AXChess/  
**Project information:** https://4ksh2574.github.io/AXChess/project/  
**Android downloads:** https://github.com/4ksh2574/AXChess/releases/latest

## Features

- Online peer-to-peer matches with a friend.
- Local chess gameplay.
- Responsive, touch-friendly board and controls.
- Player accounts and profiles powered by Firebase Authentication and Cloud Firestore.
- Custom board appearance, themes, and piece sets.
- Installable web app and Android APK distribution.

## GitHub Pages

The live web app is published at the project URL above. The Pages workflow builds the TanStack Start single-page app, publishes the app shell as both `index.html` and `404.html`, and validates that its bundled JavaScript and CSS assets exist.

GitHub Pages must use **Settings → Pages → Build and deployment → GitHub Actions**. The workflow runs on pushes and pull requests to `main`, and can also be started manually.

## Android APK

The Android package is a Capacitor shell containing the standalone app build. To build and publish an APK, push a version tag or run the **Build AXChess Android APK** workflow manually. The workflow generates the Android project, builds a debug-signed APK, and attaches it to a GitHub Release. The APK is intended for testing and direct installation; it is not a Play Store production-signed package.

## Development

Requirements: Bun, Node.js, and a supported browser.

```sh
git clone https://github.com/4ksh2574/AXChess.git
cd AXChess
bun install
bun run dev
```

Useful build commands:

```sh
bun run build:pages
bun run build:mobile
```

Firebase's public web configuration is maintained in `src/integrations/firebase/config.ts`. Never commit service-account credentials, private keys, or other server secrets.
