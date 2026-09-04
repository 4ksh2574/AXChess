# AXChess

Role: You are an expert front-end engineer building a production-ready, mobile-first web app.
Goal: Build a 100% free-to-host, serverless multiplayer chess web app inspired by Chess.com.
Core Architecture & Engine Requirements:
Framework & Engine: Use React, Vite, chess.js for strict chess rules (en passant, castling, pawn promotion, checkmate, stalemate), and react-chessboard for interactive drag-and-drop piece animations.
P2P Serverless Multiplayer: Use peerjs (WebRTC) so no paid backend server is needed.
Host Flow: Player 1 clicks "Create Game", which generates a short, readable unique Game Code (e.g., chess-8823). Provide a one-tap "Copy Code" button.
Join Flow: Player 2 inputs the code in a text box and taps "Connect".
State Sync: Sync move data (FEN strings) instantly over the PeerJS connection. Automatically flip the board view so Player 2 plays as Black from their perspective. Include a connection status badge (Connected / Disconnected).
Design System (Material You / MD3):
Use a cohesive Material Design 3 (Material You) theme featuring pastel tonal colors, heavily rounded corners (20px+ radii), elevated floating cards, and clean typography.
Apply a matching, smooth Material You color palette to the chessboard, board borders, piece selection highlights, and UI elements.
Mobile Responsiveness & Touch:
Optimize the entire layout strictly for phone screens: zero horizontal scrolling, large touch targets, touch-friendly drag-and-drop, tap-to-select alternative move option, and player profile cards stacked neatly above and below the board.
Include sound effects or visual indicators for legal moves, captures, and checks.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://axchess.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4edac26a-a1ea-4d1f-b8e2-e414e88c1599).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
