"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, KeyRound, Loader2, LogOut, Shield, Wallet, Zap } from "lucide-react";
import {
  useInterwovenKit,
  useUsernameQuery,
} from "@initia/interwovenkit-react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { createAuthMessage } from "@/lib/rollup/authMessage";
import {
  clearAuthSession,
  getAuthedWallet,
  getAuthToken,
  setAuthSession,
} from "@/lib/rollup/authSession";
import { rollupConfig } from "@/lib/rollup/config";
import { setWalletUser } from "@/lib/user";

type GuardStatus =
  | "checking"
  | "needs_wallet"
  | "authenticating"
  | "ready"
  | "failed";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  // ── InterwovenKit hooks ──────────────────────────────────────
  const {
    isConnected: iwkConnected,
    openConnect,
    hexAddress: iwkHexAddress,
    initiaAddress,
    username,
    autoSign,
  } = useInterwovenKit();

  // ── Wagmi hooks (still needed for signature-based auth) ──────
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending: isConnectPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  // ── Username query (.init names) ─────────────────────────────
  const { data: initUsername } = useUsernameQuery(iwkHexAddress || address);
  const displayName = username || initUsername || null;

  const [status, setStatus] = useState<GuardStatus>("checking");
  const [errorText, setErrorText] = useState<string | null>(null);

  // Determine the active address (InterwovenKit's hex address or wagmi's)
  const activeAddress = useMemo(() => {
    if (iwkHexAddress) return iwkHexAddress as `0x${string}`;
    return address;
  }, [iwkHexAddress, address]);

  const anyConnected = iwkConnected || isConnected;

  const preferredConnector = useMemo(() => {
    return (
      connectors.find((c) =>
        c.id.toLowerCase().includes("initia") || c.id.toLowerCase().includes("privy"),
      ) ??
      connectors.find((c) => c.id.toLowerCase().includes("meta")) ??
      connectors[0]
    );
  }, [connectors]);

  // ── Auth flow ────────────────────────────────────────────────
  const authenticateWallet = useCallback(async () => {
    if (!activeAddress || !anyConnected) {
      setStatus("needs_wallet");
      clearAuthSession();
      return;
    }

    setStatus("authenticating");
    setErrorText(null);

    try {
      const token = getAuthToken();
      const sessionAddress = getAuthedWallet();

      if (
        token &&
        sessionAddress?.toLowerCase() === activeAddress.toLowerCase()
      ) {
        const sessionResponse = await fetch("/api/auth/session", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (sessionResponse.ok) {
          setWalletUser(activeAddress);
          setStatus("ready");
          return;
        }
      }

      const nonceResponse = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: activeAddress }),
      });

      const noncePayload = (await nonceResponse.json()) as {
        nonce?: string;
        error?: string;
      };
      if (!nonceResponse.ok || !noncePayload.nonce) {
        throw new Error(noncePayload.error ?? "Failed to obtain auth nonce.");
      }

      const message = createAuthMessage(activeAddress, noncePayload.nonce);
      const signature = await signMessageAsync({ message });

      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: activeAddress,
          nonce: noncePayload.nonce,
          signature,
        }),
      });

      const verifyPayload = (await verifyResponse.json()) as {
        token?: string;
        address?: string;
        error?: string;
      };

      if (
        !verifyResponse.ok ||
        !verifyPayload.token ||
        !verifyPayload.address
      ) {
        throw new Error(
          verifyPayload.error ?? "Wallet signature could not be verified.",
        );
      }

      setAuthSession(verifyPayload.token, verifyPayload.address);
      setWalletUser(verifyPayload.address);
      setStatus("ready");
    } catch (error) {
      clearAuthSession();
      setStatus("failed");
      setErrorText(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    }
  }, [activeAddress, anyConnected, signMessageAsync]);

  useEffect(() => {
    void authenticateWallet();
  }, [authenticateWallet]);

  // ── Ready → render children ──────────────────────────────────
  if (status === "ready") {
    return <>{children}</>;
  }

  // ── Auth gate UI ─────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#020203] text-white font-mono flex items-center justify-center p-6 cyber-grid">
      <div className="w-full max-w-lg border border-primary/30 bg-black/70 backdrop-blur-xl p-8 space-y-6 shadow-[0_0_50px_rgba(0,242,255,0.15)]">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">
              Wallet Authentication
            </h2>
            <p className="text-xs text-gray-400 tracking-wider uppercase">
              BattleQ Rollup: {rollupConfig.chainId}
            </p>
          </div>
        </div>

        <div className="border border-white/10 p-4 bg-white/[0.02] text-xs text-gray-300 space-y-2">
          <p className="uppercase tracking-wider">
            Chain: {rollupConfig.chainName}
          </p>
          <p className="uppercase tracking-wider">
            Treasury: {rollupConfig.treasuryAddress}
          </p>
          {displayName && (
            <p className="uppercase tracking-wider text-primary">
              Username: {displayName}
            </p>
          )}
          <p className="uppercase tracking-wider">
            Status: {status.replace("_", " ")}
          </p>
        </div>

        {/* Auto-sign status indicator */}
        {anyConnected && autoSign && (
          <div className="flex items-center gap-2 text-xs text-gray-400 border border-white/5 p-2 bg-white/[0.01]">
            <Zap className="w-3.5 h-3.5 text-secondary" />
            <span className="uppercase tracking-wider">
              Auto-Sign:{" "}
              {Object.values(autoSign.isEnabledByChain).some(Boolean) ? (
                <span className="text-green-400">Active</span>
              ) : (
                <span className="text-gray-500">Inactive</span>
              )}
            </span>
          </div>
        )}

        {(status === "checking" || status === "authenticating") && (
          <div className="flex items-center gap-3 border border-primary/20 bg-primary/5 p-3 text-primary text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            {status === "checking"
              ? "Checking wallet session..."
              : "Requesting signature authentication..."}
          </div>
        )}

        {(status === "needs_wallet" || status === "failed") && (
          <div className="space-y-4">
            {errorText && (
              <div className="flex items-start gap-2 border border-red-500/30 bg-red-500/10 p-3 text-red-300 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <span>{errorText}</span>
              </div>
            )}

            {/* Primary: InterwovenKit Connect (hackathon requirement) */}
            <button
              onClick={() => openConnect()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-black font-black uppercase tracking-widest py-3 hover:bg-white transition-colors"
            >
              <Wallet className="w-4 h-4" />
              Connect with Initia
            </button>

            {/* Fallback: direct wagmi connector */}
            <button
              onClick={() => {
                if (!preferredConnector) {
                  setErrorText("No wallet connector found.");
                  return;
                }
                setErrorText(null);
                connect({ connector: preferredConnector });
              }}
              disabled={isConnectPending}
              className="w-full flex items-center justify-center gap-2 border border-white/20 text-white/80 font-bold uppercase tracking-widest py-2.5 text-sm disabled:opacity-60 hover:border-primary/50 transition-colors"
            >
              {isConnectPending ? "Connecting..." : "Connect MetaMask"}
            </button>

            {connectError?.message && (
              <p className="text-xs text-red-300">{connectError.message}</p>
            )}
          </div>
        )}

        {anyConnected && status === "failed" && (
          <div className="flex gap-3">
            <button
              onClick={() => void authenticateWallet()}
              className="flex-1 flex items-center justify-center gap-2 border border-primary/30 text-primary py-2 text-xs uppercase tracking-widest hover:bg-primary/5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" /> Retry Signature
            </button>
            <button
              onClick={() => {
                clearAuthSession();
                disconnect();
                setStatus("needs_wallet");
              }}
              className="px-4 border border-white/20 text-white/80 py-2 text-xs uppercase tracking-widest hover:border-red-500/50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
