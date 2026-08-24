import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import {
  Check,
  Copy,
  Link2,
  LogOut,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { usePeerGame } from "@/hooks/usePeerGame";
import {
  clearGame,
  codeFromHash,
  displayCode,
  inviteLink,
  loadGame,
  normalizeCode,
  saveGame,
  type PeerMessage,
} from "@/lib/peer-protocol";
import { sounds, unlockAudio, setMuted } from "@/lib/sounds";
import { boardTheme, materialPieces } from "./MaterialPieces";
import { PlayerCard } from "./PlayerCard";

type Screen = "home" | "create" | "join" | "game";

export default function ChessApp() {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [screen, setScreen] = useState<Screen>("home");
  const [myColor, setMyColor] = useState<"white" | "black">("white");
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const [joinInput, setJoinInput] = useState("");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [muted, setMutedState] = useState(false);
  const [resigned, setResigned] = useState<"white" | "black" | null>(null);
  const [resultDismissed, setResultDismissed] = useState(false);
  const myColorRef = useRef(myColor);
  myColorRef.current = myColor;

  const refresh = useCallback(() => setFen(gameRef.current.fen()), []);

  const handleMessage = useCallback(
    (msg: PeerMessage) => {
      const game = gameRef.current;
      if (msg.t === "hello") {
        sounds.connect();
        return;
      }
      if (msg.t === "move") {
        try {
          const move = game.move({ from: msg.from, to: msg.to, promotion: msg.promotion });
          if (move) {
            setLastMove({ from: move.from, to: move.to });
            if (move.captured) sounds.capture();
            else sounds.opponentMove();
          }
        } catch {
          game.load(msg.fen);
          setLastMove({ from: msg.from, to: msg.to });
        }
        if (game.fen().split(" ")[0] !== msg.fen.split(" ")[0]) game.load(msg.fen);
        if (game.isCheck() && !game.isGameOver()) sounds.check();
        if (game.isGameOver()) sounds.end();
        refresh();
        return;
      }
      if (msg.t === "sync") {
        if (msg.history.length > game.history().length) {
          game.load(msg.fen);
          refresh();
        }
        return;
      }
      if (msg.t === "resign") {
        setResigned(msg.color);
        setResultDismissed(false);
        sounds.end();
        return;
      }
      if (msg.t === "rematch") {
        gameRef.current = new Chess();
        setLastMove(null);
        setSelected(null);
        setResigned(null);
        setResultDismissed(false);
        refresh();
      }
    },
    [refresh],
  );

  const peer = usePeerGame({
    onMessage: handleMessage,
    onOpen: (role) => {
      sounds.connect();
      setScreen("game");
      const game = gameRef.current;
      peerSendRef.current?.({
        t: "hello",
        name: role === "host" ? "Host" : "Guest",
        color: role === "host" ? "white" : "black",
      });
      peerSendRef.current?.({
        t: "sync",
        fen: game.fen(),
        moveCount: game.history().length,
        history: game.history(),
      });
    },
  });
  const peerSendRef = useRef(peer.send);
  peerSendRef.current = peer.send;

  // Persist session for mobile suspend / accidental reloads.
  useEffect(() => {
    if (screen === "game" && peer.code && peer.role) {
      saveGame({
        code: peer.code,
        color: myColor,
        role: peer.role,
        fen,
        history: gameRef.current.history(),
        savedAt: Date.now(),
      });
    }
  }, [fen, screen, peer.code, peer.role, myColor]);

  // Restore an interrupted game or an invite link on first load.
  useEffect(() => {
    const hashCode = codeFromHash();
    if (hashCode) {
      setJoinInput(hashCode);
      setScreen("join");
      setMyColor("black");
      void peer.join(hashCode);
      return;
    }
    const saved = loadGame();
    if (saved) {
      gameRef.current.load(saved.fen);
      setFen(saved.fen);
      setMyColor(saved.color);
      setScreen("game");
      if (saved.role === "guest") void peer.join(saved.code);
      else void peer.reconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const game = gameRef.current;
  const turn = game.turn() === "w" ? "white" : "black";
  const isMyTurn = turn === myColor && peer.status === "connected";

  const captured = useMemo(() => {
    const byWhite: string[] = [];
    const byBlack: string[] = [];
    for (const m of game.history({ verbose: true })) {
      if (!m.captured) continue;
      if (m.color === "w") byWhite.push(m.captured);
      else byBlack.push(m.captured);
    }
    return { byWhite, byBlack };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  const legalTargets = useMemo(() => {
    if (!selected) return [] as string[];
    return game.moves({ square: selected, verbose: true }).map((m) => m.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, fen]);

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: boardTheme.lastMove };
      styles[lastMove.to] = { backgroundColor: boardTheme.lastMove };
    }
    if (selected) {
      styles[selected] = {
        backgroundColor: boardTheme.selected,
        boxShadow: "inset 0 0 0 4px rgba(103,80,164,0.55)",
      };
    }
    for (const target of legalTargets) {
      const hasPiece = game.get(target as Square);
      styles[target] = {
        ...styles[target],
        background: hasPiece
          ? `radial-gradient(circle, transparent 56%, ${boardTheme.dot} 58%)`
          : `radial-gradient(circle, ${boardTheme.dot} 22%, transparent 24%)`,
      };
    }
    if (game.isCheck()) {
      const kingColor = game.turn();
      for (const row of game.board()) {
        for (const sq of row) {
          if (sq && sq.type === "k" && sq.color === kingColor) {
            styles[sq.square] = {
              ...styles[sq.square],
              backgroundColor: boardTheme.check,
              borderRadius: "50%",
            };
          }
        }
      }
    }
    return styles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, selected, lastMove, legalTargets]);

  const commitMove = useCallback(
    (from: Square, to: Square, promotion?: string) => {
      const current = gameRef.current;
      let move;
      try {
        move = current.move({ from, to, promotion });
      } catch {
        return false;
      }
      if (!move) return false;
      setLastMove({ from, to });
      setSelected(null);
      if (move.captured) sounds.capture();
      else sounds.move();
      if (current.isCheck() && !current.isGameOver()) sounds.check();
      if (current.isGameOver()) sounds.end();
      refresh();
      peer.send({
        t: "move",
        from,
        to,
        promotion,
        fen: current.fen(),
        moveCount: current.history().length,
      });
      return true;
    },
    [peer, refresh],
  );

  const tryMove = useCallback(
    (from: Square, to: Square) => {
      const current = gameRef.current;
      if (turn !== myColorRef.current) return false;
      const options = current.moves({ square: from, verbose: true });
      const match = options.find((m) => m.to === to);
      if (!match) return false;
      if (match.promotion) {
        setPendingPromotion({ from, to });
        return true;
      }
      return commitMove(from, to);
    },
    [commitMove, turn],
  );

  const onSquareClick = useCallback(
    ({ square }: { square: string }) => {
      unlockAudio();
      const sq = square as Square;
      const current = gameRef.current;
      if (selected) {
        if (sq === selected) {
          setSelected(null);
          return;
        }
        if (tryMove(selected, sq)) return;
      }
      const piece = current.get(sq);
      if (piece && (piece.color === "w" ? "white" : "black") === myColorRef.current) {
        setSelected(sq);
      } else {
        setSelected(null);
      }
    },
    [selected, tryMove],
  );

  const startHost = async () => {
    unlockAudio();
    gameRef.current = new Chess();
    refresh();
    setMyColor("white");
    setLastMove(null);
    setResigned(null);
    setScreen("create");
    await peer.host();
  };

  const startJoin = async () => {
    unlockAudio();
    const code = normalizeCode(joinInput);
    if (code.length < 4) {
      peer.setError("Enter the full code, like chess-x7k9p2.");
      return;
    }
    gameRef.current = new Chess();
    refresh();
    setMyColor("black");
    setLastMove(null);
    setResigned(null);
    await peer.join(code);
  };

  const copy = async (value: string, kind: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard blocked */
    }
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const leave = () => {
    peer.destroy();
    clearGame();
    gameRef.current = new Chess();
    refresh();
    setScreen("home");
    setLastMove(null);
    setSelected(null);
    setResigned(null);
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const resign = () => {
    setResigned(myColor);
    setResultDismissed(false);
    peer.send({ t: "resign", color: myColor });
    sounds.end();
  };

  const rematch = () => {
    gameRef.current = new Chess();
    setLastMove(null);
    setSelected(null);
    setResigned(null);
    setResultDismissed(false);
    refresh();
    peer.send({ t: "rematch" });
  };

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };

  const result = useMemo(() => {
    if (resigned) {
      return resigned === myColor ? "You resigned" : "Opponent resigned — you win";
    }
    if (game.isCheckmate()) {
      const loser = game.turn() === "w" ? "white" : "black";
      return loser === myColor ? "Checkmate — you lose" : "Checkmate — you win!";
    }
    if (game.isStalemate()) return "Stalemate — draw";
    if (game.isInsufficientMaterial()) return "Draw — insufficient material";
    if (game.isThreefoldRepetition()) return "Draw — threefold repetition";
    if (game.isDraw()) return "Draw";
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, resigned, myColor]);

  const statusBadge = {
    idle: { label: "Offline", tone: "bg-muted text-muted-foreground", icon: WifiOff },
    connecting: { label: "Connecting", tone: "bg-secondary text-secondary-foreground", icon: RefreshCw },
    waiting: { label: "Waiting for opponent", tone: "bg-secondary text-secondary-foreground", icon: RefreshCw },
    connected: { label: "Connected", tone: "bg-primary/15 text-primary", icon: Wifi },
    reconnecting: { label: "Reconnecting", tone: "bg-secondary text-secondary-foreground", icon: RefreshCw },
    disconnected: { label: "Disconnected", tone: "bg-destructive/15 text-destructive", icon: WifiOff },
  }[peer.status];
  const StatusIcon = statusBadge.icon;

  const opponentName = myColor === "white" ? "Black" : "White";
  const opponentColor: "white" | "black" = myColor === "white" ? "black" : "white";

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 overflow-x-hidden px-4 pb-8 pt-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
            Pastel Chess
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            Peer-to-peer chess, no server needed
          </p>
        </div>
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute sounds" : "Mute sounds"}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground active:scale-95"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </header>

      {screen !== "home" ? (
        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${statusBadge.tone}`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {statusBadge.label}
        </div>
      ) : null}

      {peer.error ? (
        <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {peer.error}
        </p>
      ) : null}

      {screen === "home" ? (
        <section className="flex flex-col gap-4">
          <div className="rounded-[28px] bg-card p-5 shadow-[0_8px_24px_-12px_rgba(74,68,88,0.45)]">
            <h2 className="text-lg font-semibold text-foreground">Play a friend</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a game and share the code, or join with a code you were sent.
            </p>
            <button
              onClick={startHost}
              className="mt-4 h-14 w-full rounded-[20px] bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]"
            >
              Create Game
            </button>
            <button
              onClick={() => {
                unlockAudio();
                setScreen("join");
                peer.setError(null);
              }}
              className="mt-3 h-14 w-full rounded-[20px] bg-secondary text-base font-medium text-secondary-foreground active:scale-[0.99]"
            >
              Join Game
            </button>
          </div>
        </section>
      ) : null}

      {screen === "create" ? (
        <section className="rounded-[28px] bg-card p-5 shadow-[0_8px_24px_-12px_rgba(74,68,88,0.45)]">
          <h2 className="text-lg font-semibold text-foreground">Your game code</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Share this with your opponent. You play White.
          </p>
          <p className="mt-4 select-all rounded-[20px] bg-primary/10 px-4 py-5 text-center text-2xl font-semibold tracking-wide text-primary">
            {peer.code ? displayCode(peer.code) : "Generating…"}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              disabled={!peer.code}
              onClick={() => peer.code && copy(displayCode(peer.code), "code")}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-[20px] bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {copied === "code" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy Code
            </button>
            <button
              disabled={!peer.code}
              onClick={() => peer.code && copy(inviteLink(peer.code), "link")}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-[20px] bg-secondary text-sm font-medium text-secondary-foreground disabled:opacity-50"
            >
              {copied === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              Copy Link
            </button>
          </div>
          <button
            onClick={leave}
            className="mt-3 h-12 w-full rounded-[20px] text-sm font-medium text-muted-foreground"
          >
            Cancel
          </button>
        </section>
      ) : null}

      {screen === "join" ? (
        <section className="rounded-[28px] bg-card p-5 shadow-[0_8px_24px_-12px_rgba(74,68,88,0.45)]">
          <h2 className="text-lg font-semibold text-foreground">Join a game</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the code your friend sent. You play Black.
          </p>
          <input
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value)}
            placeholder="chess-x7k9p2"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="mt-4 h-14 w-full rounded-[20px] bg-muted px-4 text-base text-foreground outline-none ring-primary/40 placeholder:text-muted-foreground focus:ring-2"
          />
          <button
            onClick={startJoin}
            className="mt-3 h-14 w-full rounded-[20px] bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]"
          >
            Connect
          </button>
          <button
            onClick={leave}
            className="mt-2 h-12 w-full rounded-[20px] text-sm font-medium text-muted-foreground"
          >
            Back
          </button>
        </section>
      ) : null}

      {screen === "game" ? (
        <section className="flex flex-col gap-3">
          <PlayerCard
            name={opponentName}
            color={opponentColor}
            isTurn={turn === opponentColor && !result}
            captured={opponentColor === "white" ? captured.byWhite : captured.byBlack}
          />

          <div className="overflow-hidden rounded-[28px] bg-card p-2 shadow-[0_10px_30px_-14px_rgba(74,68,88,0.55)]">
            <div className="overflow-hidden rounded-[20px]">
              <Chessboard
                options={{
                  position: fen,
                  boardOrientation: myColor,
                  pieces: materialPieces,
                  squareStyles,
                  allowDragging: isMyTurn && !result,
                  animationDurationInMs: 180,
                  lightSquareStyle: { backgroundColor: boardTheme.light },
                  darkSquareStyle: { backgroundColor: boardTheme.dark },
                  darkSquareNotationStyle: { color: boardTheme.light },
                  lightSquareNotationStyle: { color: "#6750A4" },
                  onSquareClick,
                  onPieceDrop: ({ sourceSquare, targetSquare }) => {
                    unlockAudio();
                    if (!targetSquare || result) return false;
                    return tryMove(sourceSquare as Square, targetSquare as Square);
                  },
                }}
              />
            </div>
          </div>

          <PlayerCard
            name="You"
            color={myColor}
            isTurn={turn === myColor && !result}
            captured={myColor === "white" ? captured.byWhite : captured.byBlack}
            isYou
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={resign}
              disabled={!!result}
              className="h-13 rounded-[20px] bg-secondary py-3.5 text-sm font-medium text-secondary-foreground disabled:opacity-50"
            >
              Resign
            </button>
            <button
              onClick={leave}
              className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-muted py-3.5 text-sm font-medium text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              Leave
            </button>
          </div>

          {peer.status === "disconnected" ? (
            <button
              onClick={() => void peer.reconnect()}
              className="h-14 rounded-[20px] bg-primary text-sm font-medium text-primary-foreground"
            >
              Reconnect
            </button>
          ) : null}
        </section>
      ) : null}

      {pendingPromotion ? (
        <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 p-4">
          <div className="w-full rounded-[28px] bg-card p-5">
            <h3 className="text-base font-semibold text-foreground">Promote pawn</h3>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[
                { p: "q", glyph: "♛", label: "Queen" },
                { p: "r", glyph: "♜", label: "Rook" },
                { p: "b", glyph: "♝", label: "Bishop" },
                { p: "n", glyph: "♞", label: "Knight" },
              ].map((opt) => (
                <button
                  key={opt.p}
                  aria-label={opt.label}
                  onClick={() => {
                    commitMove(pendingPromotion.from, pendingPromotion.to, opt.p);
                    setPendingPromotion(null);
                  }}
                  className="grid h-16 place-items-center rounded-[20px] bg-primary/10 text-3xl text-primary active:scale-95"
                >
                  {opt.glyph}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {result && !resultDismissed ? (
        <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 p-4">
          <div className="w-full rounded-[28px] bg-card p-6 text-center">
            <h3 className="text-xl font-semibold text-foreground">{result}</h3>
            <div className="mt-5 grid gap-3">
              <button
                onClick={rematch}
                className="h-14 rounded-[20px] bg-primary text-base font-medium text-primary-foreground"
              >
                Rematch
              </button>
              <button
                onClick={() => setResultDismissed(true)}
                className="h-12 rounded-[20px] bg-secondary text-sm font-medium text-secondary-foreground"
              >
                View board
              </button>
              <button onClick={leave} className="h-12 text-sm font-medium text-muted-foreground">
                Leave game
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
