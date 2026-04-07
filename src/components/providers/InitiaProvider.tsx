"use client";

import { InterwovenKitProvider, injectStyles } from "@initia/interwovenkit-react";
import InterwovenKitStyles from "@initia/interwovenkit-react/styles.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState, useEffect } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { defineChain } from "viem";
import { metaMask } from "wagmi/connectors";

// Allow configuring an Initia EVM rollup via env while keeping sensible defaults.
const INITIA_CHAIN_ID = process.env.NEXT_PUBLIC_INITIA_CHAIN_ID || "initiation-2";
const INITIA_CHAIN_NAME = process.env.NEXT_PUBLIC_INITIA_CHAIN_NAME || "Initia";
const INITIA_RPC = process.env.NEXT_PUBLIC_INITIA_RPC || "https://rpc.testnet.initia.xyz";
const INITIA_REST = process.env.NEXT_PUBLIC_INITIA_REST || "https://rest.testnet.initia.xyz";
const INITIA_INDEXER = process.env.NEXT_PUBLIC_INITIA_INDEXER || "https://indexer.testnet.initia.xyz";

// EVM rollup config (for wagmi). Set NEXT_PUBLIC_INITIA_EVM_CHAIN_ID / RPC to point
// at your Initia EVM rollup; by default this uses the public testnet RPC.
const INITIA_EVM_CHAIN_ID = Number(process.env.NEXT_PUBLIC_INITIA_EVM_CHAIN_ID || 1501);
const INITIA_EVM_RPC = process.env.NEXT_PUBLIC_INITIA_EVM_RPC || INITIA_RPC;

const initiationChain = {
  chain_id: INITIA_CHAIN_ID,
  chain_name: INITIA_CHAIN_NAME,
  apis: {
    rpc: [{ address: INITIA_RPC }],
    rest: [{ address: INITIA_REST }],
    indexer: [{ address: INITIA_INDEXER }],
    "json-rpc": [{ address: INITIA_RPC }],
  },
  fees: {
    fee_tokens: [{ denom: "uinit", fixed_min_gas_price: 0.15 }],
  },
  metadata: {
    // For an EVM rollup, this should typically be false.
    is_l1: false,
  },
};

const initiaEvmChain = defineChain({
  id: INITIA_EVM_CHAIN_ID,
  name: INITIA_CHAIN_NAME,
  nativeCurrency: { name: "INIT", symbol: "INIT", decimals: 18 },
  rpcUrls: { default: { http: [INITIA_EVM_RPC] } },
});

const wagmiConfig = createConfig({
  connectors: [
    metaMask(),
  ],
  chains: [mainnet, initiaEvmChain],
  transports: {
    [mainnet.id]: http(),
    [initiaEvmChain.id]: http(),
  },
});

export function InitiaProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    injectStyles(InterwovenKitStyles);
  }, []);

  if (!mounted) return null;

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <InterwovenKitProvider
          defaultChainId={INITIA_CHAIN_ID}
          customChain={initiationChain}
        >
          {children}
        </InterwovenKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
