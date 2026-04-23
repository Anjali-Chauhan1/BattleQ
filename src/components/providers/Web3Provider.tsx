"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useEffect, useState } from "react";
import { createConfig, WagmiProvider, http } from "wagmi";
import { injected } from "wagmi/connectors";
import {
  InterwovenKitProvider,
  initiaPrivyWalletConnector,
  injectStyles,
  TESTNET,
} from "@initia/interwovenkit-react";
import interwovenKitStyles from "@initia/interwovenkit-react/styles.js";
import { battleQRollupChain } from "@/lib/rollup/chain";
import { rollupConfig } from "@/lib/rollup/config";

// ── Wagmi Config ──────────────────────────────────────────────────
// InterwovenKit requires wagmi; we register the Initia Privy wallet
// connector (required by hackathon rules) alongside a generic injected
// connector for MetaMask / other browser wallets.
const wagmiConfig = createConfig({
  chains: [battleQRollupChain],
  connectors: [
    initiaPrivyWalletConnector,
    injected({ shimDisconnect: true }),
  ],
  transports: {
    [battleQRollupChain.id]: http(rollupConfig.jsonRpc),
  },
  ssr: true,
});

// ── Provider ──────────────────────────────────────────────────────
export function Web3Provider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  // Inject InterwovenKit ShadowDOM styles on mount
  useEffect(() => {
    injectStyles(interwovenKitStyles);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <InterwovenKitProvider
          defaultChainId={rollupConfig.chainId}
          theme="dark"
          enableAutoSign={true}
        >
          {children}
        </InterwovenKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
