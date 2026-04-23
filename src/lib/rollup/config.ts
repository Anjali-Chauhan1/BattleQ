export interface RollupRuntimeConfig {
  chainId: string;
  rpc: string;
  rest: string;
  jsonRpc: string;
  jsonRpcWs: string;
  grpc: string;
  evmChainId: number;
  nativeSymbol: string;
  chainName: string;
  treasuryAddress: `0x${string}`;
  /**
   * `true` when real (non-localhost) rollup endpoints are configured.
   * `false` → the game runs in credits-only demo mode without real
   * on-chain transactions, which makes it work on any deployed URL
   * even without a running rollup node.
   */
  isLiveRollup: boolean;
}

function readEnv(key: string, fallback: string): string {
  const value = process.env[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  return value;
}

function isLocalUrl(url: string): boolean {
  try {
    const lower = url.toLowerCase();
    return (
      lower.includes("localhost") ||
      lower.includes("127.0.0.1") ||
      lower.includes("0.0.0.0")
    );
  } catch {
    return true;
  }
}

const defaultTreasury = "0xa0a301021f0F51d90C2eabE4B17BbD436297E1F8" as const;

const jsonRpc = readEnv(
  "NEXT_PUBLIC_ROLLUP_JSON_RPC",
  readEnv("JSON_RPC", "http://localhost:8545"),
);

export const rollupConfig: RollupRuntimeConfig = {
  chainId: readEnv("NEXT_PUBLIC_ROLLUP_CHAIN_ID", readEnv("CHAIN_ID", "BattleQ")),
  rpc: readEnv("NEXT_PUBLIC_ROLLUP_RPC", readEnv("RPC", "http://localhost:26657")),
  rest: readEnv("NEXT_PUBLIC_ROLLUP_REST", readEnv("REST", "http://localhost:1317")),
  jsonRpc,
  jsonRpcWs: readEnv(
    "NEXT_PUBLIC_ROLLUP_JSON_RPC_WS",
    readEnv("JSON_RPC_WS", "ws://localhost:8546"),
  ),
  grpc: readEnv("NEXT_PUBLIC_ROLLUP_GRPC", readEnv("GRPC", "http://localhost:9090")),
  evmChainId: Number(readEnv("NEXT_PUBLIC_ROLLUP_EVM_CHAIN_ID", "31337")),
  nativeSymbol: readEnv("NEXT_PUBLIC_ROLLUP_NATIVE_SYMBOL", "INIT"),
  chainName: readEnv("NEXT_PUBLIC_ROLLUP_CHAIN_NAME", "Initia Testnet"),
  treasuryAddress: readEnv("NEXT_PUBLIC_BATTLEQ_TREASURY", defaultTreasury) as `0x${string}`,
  isLiveRollup: !isLocalUrl(jsonRpc),
};
