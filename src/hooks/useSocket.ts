"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  if (typeof window !== "undefined") {
    const isProd = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
    // In production, if no URL provided, we assume the server is on the same host but port 3001
    // or properly proxied. For now, defaulting to same host :3001 is a better bet than localhost.
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;

    // If we're on a real domain, use that domain with port 3001 as fallback
    if (isProd) {
      return `${protocol}//${hostname}:3001`;
    }
  }

  return "http://127.0.0.1:3001";
};

const SOCKET_URL = getSocketUrl();

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
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
