import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { battleQRollupChain } from "@/lib/rollup/chain";
import { rollupConfig } from "@/lib/rollup/config";

export const rollupPublicClient = createPublicClient({
  chain: battleQRollupChain,
  transport: http(rollupConfig.jsonRpc),
});

export function getHouseWalletClient() {
  const privateKey = process.env.ROLLUP_HOUSE_PRIVATE_KEY;
  if (!privateKey || !privateKey.startsWith("0x") || privateKey.length !== 66) {
    return null;
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: battleQRollupChain,
    transport: http(rollupConfig.jsonRpc),
  });

  return { account, walletClient };
}
