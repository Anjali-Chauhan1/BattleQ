import { rollupConfig } from "@/lib/rollup/config";

export function createAuthMessage(address: string, nonce: string): string {
  return [
    "BattleQ Wallet Authentication",
    `Address: ${address}`,
    `Nonce: ${nonce}`,
    `Rollup: ${rollupConfig.chainId}`,
    `JSON-RPC: ${rollupConfig.jsonRpc}`,
    "",
    "Sign this message to authenticate in BattleQ.",
  ].join("\n");
}
