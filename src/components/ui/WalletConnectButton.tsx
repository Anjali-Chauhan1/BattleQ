"use client";

import { Wallet } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function WalletConnectButton() {
  const { address, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const handleConnect = () => {
    if (connectors.length === 0) return;
    const connector = connectors[0];
    connect({ connector });
  };

  if (address) {
    return (
      <button
        onClick={() => disconnect()}
        className="flex items-center gap-2 px-4 py-2 glass-panel border-white/10 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-[0.2em]"
      >
        <Wallet className="w-4 h-4 text-primary" />
        <span>{shortAddress}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-4 py-2 glass-panel border-primary/40 bg-primary/10 hover:bg-primary/20 rounded-xl text-xs font-black uppercase tracking-[0.2em] disabled:opacity-60"
    >
      <Wallet className="w-4 h-4 text-primary" />
      <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
    </button>
  );
}
