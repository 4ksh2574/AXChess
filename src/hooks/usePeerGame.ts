import { useCallback, useEffect, useRef, useState } from "react";
import type { DataConnection, Peer } from "peerjs";
import {
  ICE_SERVERS,
  generateCode,
  peerIdForCode,
  type PeerMessage,
} from "@/lib/peer-protocol";

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "waiting"
  | "connected"
  | "reconnecting"
  | "disconnected";

type Options = {
  onMessage: (msg: PeerMessage) => void;
  onOpen?: (role: "host" | "guest") => void;
};

async function createPeer(id?: string): Promise<Peer> {
  const { default: PeerCtor } = await import("peerjs");
  return new PeerCtor(id as string, {
    debug: 0,
    config: { iceServers: ICE_SERVERS },
  });
}

export function usePeerGame({ onMessage, onOpen }: Options) {
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const roleRef = useRef<"host" | "guest" | null>(null);
  const codeRef = useRef<string | null>(null);
  const handlerRef = useRef(onMessage);
  const openRef = useRef(onOpen);
  handlerRef.current = onMessage;
  openRef.current = onOpen;

  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [code, setCode] = useState<string | null>(null);
  const [role, setRole] = useState<"host" | "guest" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bindConnection = useCallback((conn: DataConnection) => {
    connRef.current = conn;
    conn.on("open", () => {
      setStatus("connected");
      setError(null);
      openRef.current?.(roleRef.current ?? "guest");
    });
    conn.on("data", (data) => {
      try {
        const msg = (typeof data === "string" ? JSON.parse(data) : data) as PeerMessage;
        if (msg && typeof msg.t === "string") handlerRef.current(msg);
      } catch {
        /* ignore malformed payloads */
      }
    });
    conn.on("close", () => {
      if (connRef.current === conn) {
        connRef.current = null;
        setStatus("disconnected");
      }
    });
    conn.on("error", () => setStatus("disconnected"));
  }, []);

  const destroy = useCallback(() => {
    connRef.current?.close();
    connRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
    roleRef.current = null;
    codeRef.current = null;
    setRole(null);
    setCode(null);
    setStatus("idle");
  }, []);

  /** Host a game. Retries with a fresh code when the broker id is taken. */
  const host = useCallback(
    async (attempt = 0): Promise<void> => {
      if (attempt === 0) {
        peerRef.current?.destroy();
        setStatus("connecting");
        setError(null);
        roleRef.current = "host";
        setRole("host");
      }
      const newCode = generateCode();
      const peer = await createPeer(peerIdForCode(newCode));
      peerRef.current = peer;

      peer.on("open", () => {
        codeRef.current = newCode;
        setCode(newCode);
        setStatus("waiting");
      });
      peer.on("connection", (conn) => {
        if (connRef.current?.open) {
          conn.close();
          return;
        }
        bindConnection(conn);
      });
      peer.on("disconnected", () => {
        if (!peer.destroyed) peer.reconnect();
      });
      peer.on("error", (err: Error & { type?: string }) => {
        if (err.type === "unavailable-id" && attempt < 4) {
          peer.destroy();
          void host(attempt + 1);
          return;
        }
        if (err.type === "peer-unavailable") return;
        setError("Connection problem. Check your network and try again.");
        setStatus("disconnected");
      });
    },
    [bindConnection],
  );

  const join = useCallback(
    async (joinCode: string) => {
      peerRef.current?.destroy();
      setStatus("connecting");
      setError(null);
      roleRef.current = "guest";
      setRole("guest");
      codeRef.current = joinCode;
      setCode(joinCode);

      const peer = await createPeer();
      peerRef.current = peer;

      peer.on("open", () => {
        const conn = peer.connect(peerIdForCode(joinCode), { reliable: true });
        bindConnection(conn);
        window.setTimeout(() => {
          if (!connRef.current?.open) {
            setError("No game found with that code. Ask your friend for a new one.");
            setStatus("disconnected");
          }
        }, 12000);
      });
      peer.on("disconnected", () => {
        if (!peer.destroyed) peer.reconnect();
      });
      peer.on("error", (err: Error & { type?: string }) => {
        if (err.type === "peer-unavailable") {
          setError("No game found with that code. Ask your friend for a new one.");
        } else {
          setError("Connection problem. Check your network and try again.");
        }
        setStatus("disconnected");
      });
    },
    [bindConnection],
  );

  const send = useCallback((msg: PeerMessage) => {
    const conn = connRef.current;
    if (conn?.open) conn.send(msg);
  }, []);

  /** Re-establish the data channel after a mobile browser suspends WebRTC. */
  const reconnect = useCallback(async () => {
    const currentCode = codeRef.current;
    if (!currentCode || connRef.current?.open) return;
    setStatus("reconnecting");
    const peer = peerRef.current;
    if (roleRef.current === "guest") {
      if (peer && !peer.destroyed) {
        if (peer.disconnected) peer.reconnect();
        if (peer.open) {
          const conn = peer.connect(peerIdForCode(currentCode), { reliable: true });
          bindConnection(conn);
          return;
        }
      }
      await join(currentCode);
    } else if (peer && !peer.destroyed) {
      if (peer.disconnected) peer.reconnect();
      setStatus("waiting");
    } else {
      // Host peer is gone entirely: re-open the broker id for the same code.
      const fresh = await createPeer(peerIdForCode(currentCode));
      peerRef.current = fresh;
      fresh.on("open", () => setStatus("waiting"));
      fresh.on("connection", (conn) => bindConnection(conn));
      fresh.on("error", () => setStatus("disconnected"));
    }
  }, [bindConnection, join]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && codeRef.current) {
        void reconnect();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onVisibility);
    };
  }, [reconnect]);

  useEffect(() => {
    return () => {
      connRef.current?.close();
      peerRef.current?.destroy();
    };
  }, []);

  return { status, code, role, error, host, join, send, destroy, reconnect, setError };
}
