"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

/**
 * Determine the Socket.IO game-server URL.
 *
 * On Vercel the Next.js app runs in serverless functions – there is no
 * persistent Node process, so the Socket.IO game server MUST be deployed
 * separately (e.g. Railway, Fly.io, Render, etc.) and the URL provided
 * via `NEXT_PUBLIC_SOCKET_URL`.
 *
 * Fallback chain:
 *   1. NEXT_PUBLIC_SOCKET_URL env var  (always preferred)
 *   2. In development on localhost → http://127.0.0.1:3001
 *   3. On a deployed domain without env var → null (socket disabled)
 */
function getSocketUrl(): string | null {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocalDev = host === "localhost" || host === "127.0.0.1";

    if (isLocalDev) {
      return "http://127.0.0.1:3001";
    }

    // On a deployed domain without NEXT_PUBLIC_SOCKET_URL we
    // gracefully disable the multiplayer socket.
    return null;
  }

  return null;
}

const SOCKET_URL = getSocketUrl();

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // If no socket URL is available, skip connecting entirely.
    if (!SOCKET_URL) {
      console.warn(
        "[BattleQ] NEXT_PUBLIC_SOCKET_URL is not set. " +
          "Multiplayer / duel features are disabled. " +
          "Deploy gameServer.ts separately and set the URL.",
      );
      return;
    }

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
      });

      socketRef.current.on("connect", () => {
        setIsConnected(true);
        console.log("Connected to game server at", SOCKET_URL);
      });

      socketRef.current.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message, "URL:", SOCKET_URL);
      });

      socketRef.current.on("disconnect", () => {
        setIsConnected(false);
        console.log("Disconnected from game server");
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
  };
};
