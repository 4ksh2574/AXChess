import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
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
  Undo2,
  Palette,
  Users,
  Cpu,
  ArrowLeft,
  RotateCw,
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
import { useBoardAppearance } from "@/hooks/useBoardAppearance";
import { PlayerCard } from "./PlayerCard";
import { useAuth } from "@/hooks/useAuth";
import { User as UserIcon } from "lucide-react";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { DIFFICULTIES, requestEngineMove, type Difficulty } from "@/lib/chess-ai";
import { TIME_PRESETS, formatClock, type TimeControl } from "@/lib/time-control";

type Screen = "home" | "create" | "join" | "setup" | "game";
type Mode = "online" | "pass" | "ai";

export default function ChessApp() {
  const { theme, pieces } = useBoardAppearance();
  const { user, profile, avatarUrl } = useAuth();
  const [opponent, setOpponent] = useState<{ name: string; avatar: string | null }>({
    name: "",
    avatar: null,
  });
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<Mode>("online");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [flipBoard, setFlipBoard] = useState(true);
  const [setupMode, setSetupMode] = useState<Mode>("pass");
  const [timeControl, setTimeControl] = useState<TimeControl>(null);
  const [customMinutes, setCustomMinutes] = useState(15);
  const [clocks, setClocks] = useState<{ white: number; black: number } | null>(null);
  const [flagged, setFlagged] = useState<"white" | "black" | null>(null);
  const [thinking, setThinking] = useState(false);
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
  const [undoState, setUndoState] = useState<"idle" | "sent" | "incoming">("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const resultRef = useRef<string | null>(null);
  const myColorRef = useRef(myColor);
  myColorRef.current = myColor;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const isLocal = mode !== "online";


  const refresh = useCallback(() => setFen(gameRef.current.fen()), []);

  const showNotice = useCallback((text: string) => {
    setNotice(text);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2600);
  }, []);

  const handleMessage = useCallback(
    (msg: PeerMessage) => {
      const game = gameRef.current;
      if (msg.t === "hello") {
        sounds.connect();
        setOpponent({ name: msg.name || "", avatar: msg.avatar ?? null });
        return;
      }
      if (msg.t === "move") {
        setUndoState("idle");
        try {
          const move = game.move(
            msg.promotion
              ? { from: msg.from, to: msg.to, promotion: msg.promotion }
              : { from: msg.from, to: msg.to },
          );
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
        setUndoState("idle");
        sounds.end();
        return;
      }
      if (msg.t === "undo-request") {
        if (resultRef.current) {
          peerSendRef.current?.({ t: "undo-decline" });
          return;
        }
        setUndoState("incoming");
        sounds.check();
        return;
      }
      if (msg.t === "undo-accept") {
        game.load(msg.fen);
        setLastMove(null);
        setSelected(null);
        setUndoState("idle");
        setResultDismissed(false);
        sounds.move();
        refresh();
        showNotice("Undo accepted");
        return;
      }
      if (msg.t === "undo-decline") {
        setUndoState("idle");
        showNotice("Undo request declined");
        return;
      }
      if (msg.t === "rematch") {
        gameRef.current = new Chess();
        setLastMove(null);
        setSelected(null);
        setResigned(null);
        setResultDismissed(false);
        setUndoState("idle");
        refresh();
      }
    },
    [refresh, showNotice],
  );

  const peer = usePeerGame({
    onMessage: handleMessage,
    onOpen: (role) => {
      sounds.connect();
      setScreen("game");
      const game = gameRef.current;
      peerSendRef.current?.({
        t: "hello",
        name: identityRef.current.name || (role === "host" ? "Host" : "Guest"),
        avatar: identityRef.current.avatar ?? undefined,
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
  const identityRef = useRef<{ name: string; avatar: string | null }>({ name: "", avatar: null });
  useEffect(() => {
    identityRef.current = {
      name: profile?.display_name || profile?.username || "",
      avatar: avatarUrl,
    };
  }, [profile, avatarUrl]);
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
  const isMyTurn = isLocal
    ? mode === "pass" || turn === myColor
    : turn === myColor && peer.status === "connected";


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
      styles[lastMove.from] = { backgroundColor: theme.board.lastMove };
      styles[lastMove.to] = { backgroundColor: theme.board.lastMove };
    }
    if (selected) {
      styles[selected] = {
        backgroundColor: theme.board.selected,
        boxShadow: `inset 0 0 0 4px ${theme.board.selectedRing}`,
      };
    }
    for (const target of legalTargets) {
      const hasPiece = game.get(target as Square);
      styles[target] = {
        ...styles[target],
        background: hasPiece
          ? `radial-gradient(circle, transparent 56%, ${theme.board.dot} 58%)`
          : `radial-gradient(circle, ${theme.board.dot} 22%, transparent 24%)`,
      };
    }
    if (game.isCheck()) {
      const kingColor = game.turn();
      for (const row of game.board()) {
        for (const sq of row) {
          if (sq && sq.type === "k" && sq.color === kingColor) {
            styles[sq.square] = {
              ...styles[sq.square],
              backgroundColor: theme.board.check,
              borderRadius: "50%",
            };
          }
        }
      }
    }
    return styles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, selected, lastMove, legalTargets, theme]);

  const commitMove = useCallback(
    (from: Square, to: Square, promotion?: string) => {
      const current = gameRef.current;
      let move;
      try {
        move = current.move(promotion ? { from, to, promotion } : { from, to });
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
      if (modeRef.current === "online") {
        peer.send({
          t: "move",
          from,
          to,
          ...(promotion ? { promotion } : {}),
          fen: current.fen(),
          moveCount: current.history().length,
        });
      }
      return true;
    },
    [peer, refresh],
  );

  /** Which colour the human at the device may move right now. */
  const movableColor = useCallback((): "white" | "black" | null => {
    const current = gameRef.current;
    const side = current.turn() === "w" ? "white" : "black";
    if (modeRef.current === "pass") return side;
    return side === myColorRef.current ? side : null;
  }, []);

  const tryMove = useCallback(
    (from: Square, to: Square) => {
      const current = gameRef.current;
      if (!movableColor()) return false;
      const options = current.moves({ square: from, verbose: true });
      const match = options.find((m) => m.to === to);
      if (!match) return false;
      if (match.promotion) {
        setPendingPromotion({ from, to });
        return true;
      }
      return commitMove(from, to);
    },
    [commitMove, movableColor],
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
      const allowed = movableColor();
      if (piece && allowed && (piece.color === "w" ? "white" : "black") === allowed) {
        setSelected(sq);
      } else {
        setSelected(null);
      }
    },
    [selected, tryMove, movableColor],
  );


  const resetClocks = useCallback((tc: TimeControl) => {
    if (!tc) {
      setClocks(null);
      return;
    }
    const ms = tc.minutes * 60_000;
    setClocks({ white: ms, black: ms });
  }, []);

  const startHost = async () => {
    unlockAudio();
    setMode("online");
    modeRef.current = "online";
    gameRef.current = new Chess();
    refresh();
    setMyColor("white");
    setLastMove(null);
    setResigned(null);
    setFlagged(null);
    resetClocks(null);
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
    setMode("online");
    modeRef.current = "online";
    gameRef.current = new Chess();
    refresh();
    setMyColor("black");
    setLastMove(null);
    setResigned(null);
    setFlagged(null);
    resetClocks(null);
    await peer.join(code);
  };

  /** Kick off an offline game (pass & play or vs the built-in engine). */
  const startLocal = () => {
    unlockAudio();
    peer.destroy();
    clearGame();
    setMode(setupMode);
    modeRef.current = setupMode;
    gameRef.current = new Chess();
    refresh();
    setLastMove(null);
    setSelected(null);
    setResigned(null);
    setFlagged(null);
    setResultDismissed(false);
    setUndoState("idle");
    setOpponent({
      name: setupMode === "ai" ? `Computer (${difficulty})` : "Player 2",
      avatar: null,
    });
    resetClocks(timeControl);
    setScreen("game");
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
    setMode("online");
    modeRef.current = "online";
    setLastMove(null);
    setSelected(null);
    setResigned(null);
    setFlagged(null);
    setClocks(null);
    setUndoState("idle");
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const resign = () => {
    const loser = isLocal ? (gameRef.current.turn() === "w" ? "white" : "black") : myColor;
    setResigned(loser);
    setResultDismissed(false);
    setUndoState("idle");
    if (!isLocal) peer.send({ t: "resign", color: myColor });
    sounds.end();
  };

  const localUndo = () => {
    const current = gameRef.current;
    if (current.history().length === 0) return;
    current.undo();
    // In engine games take back the computer's reply too.
    if (modeRef.current === "ai" && current.history().length > 0) current.undo();
    setLastMove(null);
    setSelected(null);
    setResigned(null);
    setFlagged(null);
    setResultDismissed(false);
    refresh();
    sounds.move();
  };

  const requestUndo = () => {
    unlockAudio();
    if (gameRef.current.history().length === 0) return;
    if (isLocal) {
      localUndo();
      return;
    }
    peer.send({ t: "undo-request" });
    setUndoState("sent");
    showNotice("Undo request sent to your opponent");
  };

  const acceptUndo = () => {
    const current = gameRef.current;
    const requester = myColorRef.current === "white" ? "b" : "w";
    // Roll back until it is the requester's turn again (1 ply if they just
    // moved, 2 plies if we already replied).
    do {
      if (!current.undo()) break;
    } while (current.history().length > 0 && current.turn() !== requester);
    setLastMove(null);
    setSelected(null);
    setUndoState("idle");
    refresh();
    peer.send({ t: "undo-accept", fen: current.fen() });
    sounds.move();
  };

  const declineUndo = () => {
    peer.send({ t: "undo-decline" });
    setUndoState("idle");
  };

  const rematch = () => {
    gameRef.current = new Chess();
    setLastMove(null);
    setSelected(null);
    setResigned(null);
    setFlagged(null);
    setResultDismissed(false);
    resetClocks(timeControl && isLocal ? timeControl : null);
    refresh();
    if (!isLocal) peer.send({ t: "rematch" });
  };

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };

  const result = useMemo(() => {
    const localNames = (color: "white" | "black") =>
      mode === "ai"
        ? color === myColor
          ? "You"
          : "Computer"
        : color === "white"
          ? "White"
          : "Black";
    if (flagged) {
      const winner = flagged === "white" ? "black" : "white";
      return isLocal
        ? `${localNames(flagged)} ran out of time — ${localNames(winner)} wins`
        : flagged === myColor
          ? "Out of time — you lose"
          : "Opponent ran out of time — you win";
    }
    if (resigned) {
      if (isLocal) return `${localNames(resigned)} resigned`;
      return resigned === myColor ? "You resigned" : "Opponent resigned — you win";
    }
    if (game.isCheckmate()) {
      const loser = game.turn() === "w" ? "white" : "black";
      if (isLocal) return `Checkmate — ${localNames(loser === "white" ? "black" : "white")} wins`;
      return loser === myColor ? "Checkmate — you lose" : "Checkmate — you win!";
    }
    if (game.isStalemate()) return "Stalemate — draw";
    if (game.isInsufficientMaterial()) return "Draw — insufficient material";
    if (game.isThreefoldRepetition()) return "Draw — threefold repetition";
    if (game.isDraw()) return "Draw";
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, resigned, myColor, flagged, isLocal, mode]);
  resultRef.current = result;

  // Clocks: start ticking once the first move has been played.
  const clockActive =
    !!clocks &&
    !result &&
    screen === "game" &&
    game.history().length > 0 &&
    (isLocal || peer.status === "connected");

  useEffect(() => {
    if (!clockActive) return;
    let last = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const delta = now - last;
      last = now;
      setClocks((prev) => {
        if (!prev) return prev;
        const side = gameRef.current.turn() === "w" ? "white" : "black";
        const next = Math.max(0, prev[side] - delta);
        if (next === 0) setFlagged(side);
        return { ...prev, [side]: next };
      });
    }, 200);
    return () => window.clearInterval(id);
  }, [clockActive]);

  useEffect(() => {
    if (flagged) {
      setResultDismissed(false);
      sounds.end();
    }
  }, [flagged]);

  // Offline engine: reply whenever it is the computer's turn.
  useEffect(() => {
    if (mode !== "ai" || screen !== "game" || result) return;
    const side = gameRef.current.turn() === "w" ? "white" : "black";
    if (side === myColor) return;
    let cancelled = false;
    setThinking(true);
    const timer = window.setTimeout(() => {
      void requestEngineMove(gameRef.current.fen(), difficulty).then((move) => {
        if (cancelled) return;
        setThinking(false);
        if (move) commitMove(move.from as Square, move.to as Square, move.promotion);
      });
    }, 260);
    return () => {
      cancelled = true;
      setThinking(false);
      window.clearTimeout(timer);
    };
  }, [fen, mode, screen, result, myColor, difficulty, commitMove]);


  const statusBadge = {
    idle: { label: "Offline", tone: "bg-muted text-muted-foreground", icon: WifiOff },
    connecting: { label: "Connecting", tone: "bg-secondary text-secondary-foreground", icon: RefreshCw },
    waiting: { label: "Waiting for opponent", tone: "bg-secondary text-secondary-foreground", icon: RefreshCw },
    connected: { label: "Connected", tone: "bg-primary/15 text-primary", icon: Wifi },
    reconnecting: { label: "Reconnecting", tone: "bg-secondary text-secondary-foreground", icon: RefreshCw },
    disconnected: { label: "Disconnected", tone: "bg-destructive/15 text-destructive", icon: WifiOff },
  }[peer.status];
  const StatusIcon = statusBadge.icon;

  const myName = profile?.display_name || profile?.username || "You";
  const opponentName = opponent.name || (myColor === "white" ? "Black" : "White");
  const opponentColor: "white" | "black" = myColor === "white" ? "black" : "white";
  const orientation: "white" | "black" =
    mode === "pass" ? (flipBoard ? turn : "white") : myColor;


  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 overflow-x-hidden px-4 pb-8 pt-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <picture>
            <source srcSet={logoDark} media="(prefers-color-scheme: dark)" />
            <img
              src={logoLight}
              alt="AXChess logo"
              className="h-10 w-10 shrink-0 rounded-2xl bg-card/70 p-1 shadow-sm"
            />
          </picture>
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
            AXChess
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
        <Link
          to={user ? "/profile" : "/auth"}
          aria-label={user ? "Your profile" : "Sign in"}
          className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-secondary text-secondary-foreground active:scale-95"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Your avatar" className="h-full w-full object-cover" />
          ) : (
            <UserIcon className="h-5 w-5" />
          )}
        </Link>
        <Link
          to="/appearance"
          aria-label="Board appearance"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground active:scale-95"
        >
          <Palette className="h-5 w-5" />
        </Link>
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute sounds" : "Mute sounds"}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground active:scale-95"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        </div>
      </header>

      {screen !== "home" && screen !== "setup" && !isLocal ? (
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

      {notice ? (
        <p className="rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
          {notice}
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

          <div className="rounded-[28px] bg-card p-5 shadow-[0_8px_24px_-12px_rgba(74,68,88,0.45)]">
            <h2 className="text-lg font-semibold text-foreground">Play offline</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              No internet, no account needed — share this phone or take on the computer.
            </p>
            <button
              onClick={() => {
                unlockAudio();
                setSetupMode("pass");
                setScreen("setup");
              }}
              className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]"
            >
              <Users className="h-5 w-5" />
              Pass &amp; Play
            </button>
            <button
              onClick={() => {
                unlockAudio();
                setSetupMode("ai");
                setScreen("setup");
              }}
              className="mt-3 inline-flex h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-secondary text-base font-medium text-secondary-foreground active:scale-[0.99]"
            >
              <Cpu className="h-5 w-5" />
              Play vs Computer
            </button>
          </div>
        </section>
      ) : null}

      {screen === "setup" ? (
        <section className="rounded-[28px] bg-card p-5 shadow-[0_8px_24px_-12px_rgba(74,68,88,0.45)]">
          <h2 className="text-lg font-semibold text-foreground">
            {setupMode === "ai" ? "Play vs Computer" : "Pass & Play"}
          </h2>

          {setupMode === "ai" ? (
            <>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Difficulty
              </p>
              <div className="mt-2 grid gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={`flex items-center justify-between rounded-[20px] px-4 py-3 text-left text-sm ${
                      difficulty === d.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <span className="font-medium">{d.label}</span>
                    <span className="text-xs opacity-80">{d.blurb}</span>
                  </button>
                ))}
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                You play
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["white", "black"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setMyColor(c)}
                    className={`h-12 rounded-[20px] text-sm font-medium capitalize ${
                      myColor === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Time control
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => setTimeControl(null)}
              className={`h-11 rounded-full px-4 text-sm font-medium ${
                timeControl === null ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              No clock
            </button>
            {TIME_PRESETS.map((p) => (
              <button
                key={p.minutes}
                onClick={() => setTimeControl({ minutes: p.minutes })}
                className={`h-11 rounded-full px-4 text-sm font-medium ${
                  timeControl?.minutes === p.minutes
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setTimeControl({ minutes: customMinutes })}
              className={`h-11 rounded-full px-4 text-sm font-medium ${
                timeControl && !TIME_PRESETS.some((p) => p.minutes === timeControl.minutes)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              Custom
            </button>
          </div>

          <div className="mt-4">
            <label
              htmlFor="custom-minutes"
              className="flex items-center justify-between text-sm text-muted-foreground"
            >
              <span>Custom minutes</span>
              <span className="font-semibold text-foreground">{customMinutes} min</span>
            </label>
            <input
              id="custom-minutes"
              type="range"
              min={1}
              max={90}
              step={1}
              value={customMinutes}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCustomMinutes(v);
                setTimeControl({ minutes: v });
              }}
              className="mt-2 h-11 w-full accent-[var(--primary)]"
            />
          </div>

          <button
            onClick={startLocal}
            className="mt-5 h-14 w-full rounded-[20px] bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]"
          >
            Start game
          </button>
          <button
            onClick={() => setScreen("home")}
            className="mt-2 inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-[20px] text-sm font-medium text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
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
            avatarUrl={opponent.avatar}
            color={opponentColor}
            isTurn={turn === opponentColor && !result}
            captured={opponentColor === "white" ? captured.byWhite : captured.byBlack}
            clock={clocks ? formatClock(clocks[opponentColor]) : undefined}
            lowTime={!!clocks && clocks[opponentColor] < 30_000}
          />

          <div className="overflow-hidden rounded-[28px] bg-card p-2 shadow-[0_10px_30px_-14px_rgba(74,68,88,0.55)]">
            <div className="overflow-hidden rounded-[20px]">
              <Chessboard
                options={{
                  position: fen,
                  boardOrientation: orientation,
                  pieces,
                  squareStyles,
                  allowDragging: isMyTurn && !result && !thinking,
                  animationDurationInMs: 180,
                  lightSquareStyle: { backgroundColor: theme.board.light },
                  darkSquareStyle: { backgroundColor: theme.board.dark },
                  darkSquareNotationStyle: { color: theme.board.darkNotation },
                  lightSquareNotationStyle: { color: theme.board.lightNotation },
                  onSquareClick,
                  onPieceDrop: ({ sourceSquare, targetSquare }) => {
                    unlockAudio();
                    if (!targetSquare || result || thinking) return false;
                    return tryMove(sourceSquare as Square, targetSquare as Square);
                  },
                }}
              />
            </div>
          </div>

          <PlayerCard
            name={isLocal && mode === "pass" ? "Player 1" : myName}
            avatarUrl={mode === "pass" ? null : avatarUrl}
            color={myColor}
            isTurn={turn === myColor && !result}
            captured={myColor === "white" ? captured.byWhite : captured.byBlack}
            isYou={!isLocal || mode === "ai"}
            clock={clocks ? formatClock(clocks[myColor]) : undefined}
            lowTime={!!clocks && clocks[myColor] < 30_000}
          />

          {mode === "pass" ? (
            <button
              onClick={() => setFlipBoard((v) => !v)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[20px] bg-secondary text-sm font-medium text-secondary-foreground"
            >
              <RotateCw className="h-4 w-4" />
              {flipBoard ? "Auto-flip board: on" : "Auto-flip board: off"}
            </button>
          ) : null}

          {thinking ? (
            <p className="text-center text-xs font-medium text-muted-foreground">
              Computer is thinking…
            </p>
          ) : null}

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={requestUndo}
              disabled={
                !!result ||
                (!isLocal && peer.status !== "connected") ||
                undoState !== "idle" ||
                thinking ||
                game.history().length === 0
              }
              className="inline-flex h-13 items-center justify-center gap-1.5 rounded-[20px] bg-secondary py-3.5 text-sm font-medium text-secondary-foreground disabled:opacity-50"
            >
              <Undo2 className="h-4 w-4" />
              {undoState === "sent" ? "Sent…" : "Undo"}
            </button>
            <button
              onClick={resign}
              disabled={!!result}
              className="h-13 rounded-[20px] bg-secondary py-3.5 text-sm font-medium text-secondary-foreground disabled:opacity-50"
            >
              Resign
            </button>
            <button
              onClick={leave}
              className="inline-flex items-center justify-center gap-1.5 rounded-[20px] bg-muted py-3.5 text-sm font-medium text-muted-foreground"
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

      {undoState === "incoming" ? (
        <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 p-4">
          <div className="w-full rounded-[28px] bg-card p-6 text-center">
            <h3 className="text-lg font-semibold text-foreground">Undo requested</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your opponent wants to take back their last move.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={declineUndo}
                className="h-13 rounded-[20px] bg-secondary py-3.5 text-sm font-medium text-secondary-foreground"
              >
                Decline
              </button>
              <button
                onClick={acceptUndo}
                className="h-13 rounded-[20px] bg-primary py-3.5 text-sm font-medium text-primary-foreground"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
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
      <footer className="mt-auto pt-8 text-center text-[11px] font-medium tracking-wide text-muted-foreground">
        made by 4ksh2574
      </footer>
    </main>
  );
}
