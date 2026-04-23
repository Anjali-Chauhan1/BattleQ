import { defineChain, type Chain } from "viem";
import { rollupConfig } from "@/lib/rollup/config";

export const battleQRollupChain: Chain = defineChain({
  id: rollupConfig.evmChainId,
  name: rollupConfig.chainName,
  nativeCurrency: {
    name: `${rollupConfig.chainName} Token`,
    symbol: rollupConfig.nativeSymbol,
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [rollupConfig.jsonRpc],
      webSocket: [rollupConfig.jsonRpcWs],
    },
    public: {
      http: [rollupConfig.jsonRpc],
      webSocket: [rollupConfig.jsonRpcWs],
    },
  },
  blockExplorers: {
    default: {
      name: "Local Rollup Explorer",
      url: rollupConfig.rest,
    },
  },
  testnet: true,
});
