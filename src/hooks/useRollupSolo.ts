"use client";

import { useCallback, useState } from "react";
import { parseEther, formatEther } from "viem";
import {
  useAccount,
  useBalance,
  usePublicClient,
  useSendTransaction,
  useSwitchChain,
} from "wagmi";
import { getAuthToken } from "@/lib/rollup/authSession";
import { battleQRollupChain } from "@/lib/rollup/chain";
import { rollupConfig } from "@/lib/rollup/config";

function formatErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    // Trim overly verbose wagmi / viem error messages
    const msg = error.message;
    if (msg.includes("User rejected")) return "Transaction rejected by user.";
    if (msg.includes("insufficient funds"))
      return "Insufficient funds in your wallet to cover the stake + gas.";
    return msg.length > 200 ? msg.slice(0, 200) + "…" : msg;
  }
  return fallback;
}

async function callAuthedApi(path: string, body: Record<string, string>) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Missing auth token. Please reconnect your wallet.");
  }

  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Rollup API call failed.");
  }

  return payload;
}

export function useRollupSolo() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: battleQRollupChain.id });
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();

  // Fetch the user's on-chain balance to display / validate
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
    chainId: battleQRollupChain.id,
  });

  const [isStakingOnChain, setIsStakingOnChain] = useState(false);
  const [isSettlingOnChain, setIsSettlingOnChain] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [stakeTxHash, setStakeTxHash] = useState<`0x${string}` | null>(null);
  const [settlementTxHash, setSettlementTxHash] = useState<`0x${string}` | null>(null);

  const clearActionError = useCallback(() => setActionError(null), []);

  /**
   * Ensure the wallet is on the correct chain before sending a tx.
   */
  const ensureCorrectChain = useCallback(async () => {
    if (chainId !== battleQRollupChain.id) {
      try {
        await switchChainAsync({ chainId: battleQRollupChain.id });
      } catch {
        throw new Error(
          `Please switch your wallet to ${rollupConfig.chainName} (Chain ID: ${battleQRollupChain.id}).`
        );
      }
    }
  }, [chainId, switchChainAsync]);

  /**
   * Send stake transaction to the treasury address, wait for confirmation,
   * and notify the backend API.
   */
  const stakeRound = useCallback(
    async (stakeAmount: number) => {
      if (!isConnected || !address) {
        throw new Error("Wallet is not connected.");
      }
      if (!publicClient) {
        throw new Error("Public client is not initialized.");
      }
      if (stakeAmount <= 0) {
        throw new Error("Stake amount must be greater than zero.");
      }

      setActionError(null);
      setIsStakingOnChain(true);

      try {
        await ensureCorrectChain();

        const amountWei = parseEther(stakeAmount.toString());

        // Pre-flight balance check
        if (balanceData && balanceData.value < amountWei) {
          throw new Error(
            `Insufficient balance. You have ${formatEther(balanceData.value)} ${rollupConfig.nativeSymbol} but need ${stakeAmount}.`
          );
        }

        const txHash = await sendTransactionAsync({
          account: address,
          chainId: battleQRollupChain.id,
          to: rollupConfig.treasuryAddress,
          value: amountWei,
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
        if (receipt.status !== "success") {
          throw new Error("Stake transaction failed on-chain.");
        }

        await callAuthedApi("/api/rollup/stake", {
          txHash,
          amountWei: amountWei.toString(),
        });

        setStakeTxHash(txHash);

        // Refresh the balance after a successful stake
        void refetchBalance();

        return txHash;
      } catch (error) {
        const message = formatErrorMessage(
          error,
          "Failed to place stake on rollup."
        );
        setActionError(message);
        throw new Error(message);
      } finally {
        setIsStakingOnChain(false);
      }
    },
    [
      address,
      isConnected,
      publicClient,
      sendTransactionAsync,
      ensureCorrectChain,
      balanceData,
      refetchBalance,
    ]
  );

  /**
   * Settle a finished round:
   * - Win → call /api/rollup/payout to receive winnings from house wallet
   * - Loss → call /api/rollup/forfeit to release the stake
   */
  const settleRound = useCallback(
    async (didWin: boolean, payoutAmount: number) => {
      setActionError(null);
      setIsSettlingOnChain(true);

      try {
        if (!didWin) {
          await callAuthedApi("/api/rollup/forfeit", {});
          setSettlementTxHash(null);
          return null;
        }

        if (payoutAmount <= 0) {
          throw new Error("Payout amount must be greater than zero.");
        }

        const amountWei = parseEther(payoutAmount.toString());
        const result = (await callAuthedApi("/api/rollup/payout", {
          amountWei: amountWei.toString(),
        })) as { txHash?: `0x${string}` };

        if (result.txHash) {
          setSettlementTxHash(result.txHash);
        }

        // Refresh balance after payout
        void refetchBalance();

        return result.txHash ?? null;
      } catch (error) {
        const message = formatErrorMessage(
          error,
          "Failed to settle result on rollup."
        );
        setActionError(message);
        throw new Error(message);
      } finally {
        setIsSettlingOnChain(false);
      }
    },
    [refetchBalance]
  );

  return {
    stakeRound,
    settleRound,
    clearActionError,
    ensureCorrectChain,
    isStakingOnChain,
    isSettlingOnChain,
    actionError,
    stakeTxHash,
    settlementTxHash,
    // Expose balance so UI can show the wallet balance
    walletBalance: balanceData
      ? {
        formatted: balanceData.formatted,
        symbol: balanceData.symbol,
        valueBigInt: balanceData.value,
      }
      : null,
    refetchBalance,
  };
}
