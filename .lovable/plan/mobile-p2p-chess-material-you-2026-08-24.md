# Mobile P2P Chess — Material You

A phone-first, serverless multiplayer chess app. Two players connect directly over WebRTC with a short game code — no backend, no hosting cost.

## What gets built

**Home screen (`/`)**
- Material You styled card: app title, "Create Game" and "Join Game".
- Create → generates a random code like `chess-x7k9p2`, shown large with a one-tap "Copy Code" button, a "Copy Invite Link" button (`/#game=x7k9p2`), and a waiting-for-opponent state.
- Join → text field for the code + "Connect" button, with clear error feedback for a bad/taken/expired code. Opening an invite link prefills the code and auto-connects.

**Game screen**
- Opponent profile card above the board, own profile card below (avatar, name, color, captured pieces, move count).
- Interactive board: drag-and-drop plus tap-to-select-then-tap-to-move for touch.
- Legal-move dots, last-move highlight, selection ring, check highlight on the king, capture flash.
- Board auto-flips so the joining player sees the game from Black's side.
- Connection status badge (Connected / Reconnecting / Disconnected) pinned near the top.
- Result sheet for checkmate / stalemate / draw / resign, with "New Game".
- Pawn promotion picker as a bottom sheet with large touch targets.
- Sound effects for move, capture, check, and game end, with a mute toggle.

**Rules & sync**
- chess.js is the single source of truth for legality (en passant, castling, promotion, checkmate, stalemate, repetition, 50-move).
- Moves sent over PeerJS as small JSON messages (from/to/promotion) plus the resulting FEN; the receiver validates and only applies legal moves, then reconciles FEN.
- Host is White, joiner is Black. Handshake exchanges names and colors on connect.

## Design

Material Design 3 (Material You): pastel tonal palette, 20–28px corner radii, elevated floating surfaces with soft shadows, tonal buttons and chips, clean geometric typography. The board uses matching tonal light/dark squares with soft borders so it reads as part of the theme rather than a classic wooden board. Everything sized for a phone: no horizontal scroll, 48px+ touch targets, board sized to viewport width.

## Technical notes

- Add `chess.js`, `react-chessboard`, `peerjs`.
- Route structure: `src/routes/index.tsx` (lobby + game, single-screen flow driven by state) with game state in a `useChessGame` hook and a `usePeer` hook wrapping PeerJS.
- PeerJS uses its free public broker; the game code maps to a PeerJS peer id, so no signalling server is needed.
- **P2P Reliability:** Use 6-character random codes (`chess-[a-z0-9]{6}`) and support direct URL sharing (`/#game=[code]`). Configure PeerJS with standard public STUN/TURN servers (`stun:stun.l.google.com:19302`). Handle the `unavailable-id` error by regenerating a code instead of crashing.
- **Mobile State Recovery:** Persist active game FEN, room code, and assigned color in `localStorage`. Listen for `visibilitychange` events to automatically attempt data channel re-establishment if the mobile browser suspends WebRTC. On reconnect both sides exchange FEN + move count and adopt the longer history.
- **Theme Consistency:** Override `react-chessboard` piece rendering using `customPieces` to apply Material You primary/secondary SVG fill colors to pieces, keeping them unified with the board background.
- PeerJS and react-chessboard are browser-only: load them client-side after hydration so SSR/prerender doesn't break.
- Sounds generated via the Web Audio API (short synthesized tones) to avoid asset downloads and autoplay issues; unlocked on first user gesture.
- Per-route head metadata with a chess-specific title/description.
