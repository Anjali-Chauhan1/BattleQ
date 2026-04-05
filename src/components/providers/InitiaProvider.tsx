"use client";

import { InterwovenKitProvider, injectStyles } from "@initia/interwovenkit-react";
import InterwovenKitStyles from "@initia/interwovenkit-react/styles.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState, useEffect } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { defineChain } from "viem";
import { metaMask } from "wagmi/connectors";

const initiation2Chain = {
  chain_id: "initiation-2",
  chain_name: "Initia",
  apis: {
    rpc: [{ address: "https://rpc.testnet.initia.xyz" }],
    rest: [{ address: "https://rest.testnet.initia.xyz" }],
    indexer: [{ address: "https://indexer.testnet.initia.xyz" }],
    "json-rpc": [{ address: "https://rpc.testnet.initia.xyz" }],
  },
  fees: {
    fee_tokens: [{ denom: "uinit", fixed_min_gas_price: 0.15 }],
  },
  metadata: {
    is_l1: true,
  },
};

const initiation2Wagmi = defineChain({
  id: 1501,
  name: "Initia",
  nativeCurrency: { name: "INIT", symbol: "INIT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.initia.xyz"] } },
});

const wagmiConfig = createConfig({
  connectors: [
    metaMask(),
  ],
  chains: [mainnet, initiation2Wagmi],
  transports: {
    [mainnet.id]: http(),
    [initiation2Wagmi.id]: http(),
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
          defaultChainId="initiation-2"
          customChain={initiation2Chain}
        >
          {children}
        </InterwovenKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
