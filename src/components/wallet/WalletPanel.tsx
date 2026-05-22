"use client";

import React, { useState, useEffect } from "react";
import { parseEther, formatEther } from "viem";
import { useAccount, useBalance, useChainId, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Wallet, LogOut, Send, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { parseAbi } from "viem";

const BTQ_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function buy() external payable",
  "function sell(uint256 btqAmount) external",
  "function rate() view returns (uint256)",
]);

export function WalletPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const [buyAmount, setBuyAmount] = useState<number>(1);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [buyStatus, setBuyStatus] = useState<string | null>(null);
  const [withdrawStatus, setWithdrawStatus] = useState<string | null>(null);
  const minWithdrawBtq = 150;

  const contractAddressByChain: Record<number, string | undefined> = {
    46630: process.env.NEXT_PUBLIC_BTQ_ADDRESS_ROBINHOOD,
    421614: process.env.NEXT_PUBLIC_BTQ_ADDRESS_ARBITRUM_SEPOLIA,
  };
  const contractAddress =
    contractAddressByChain[chainId] || process.env.NEXT_PUBLIC_BTQ_ADDRESS || "";
  const nativePerBTQ = Number(process.env.NEXT_PUBLIC_BTQ_RATE_NATIVE_PER_BTQ || 0.001);
  const isSupportedChain = chainId === 46630 || chainId === 421614;

  // Read native token balance
  const { data: nativeBalanceData } = useBalance({
    address: address,
    query: { enabled: isConnected && !!address },
  });
  const nativeBalance = nativeBalanceData ? Number(formatEther(nativeBalanceData.value)) : 0;
  const nativeSymbol = nativeBalanceData?.symbol || "ETH";

  // Max BTQ you can buy with current native balance (leave ~0.001 for gas)
  const gasReserve = 0.001;
  const maxBuyable = Math.max(0, Math.floor((nativeBalance - gasReserve) / nativePerBTQ));

  // Read BTQ balance (polls every 4s to stay fresh after tx)
  const { data: balanceRaw, refetch: refetchBtq } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: BTQ_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: isConnected && !!contractAddress && !!address && isSupportedChain,
      refetchInterval: 4000,
    },
  });

  const btqBalance = balanceRaw ? Number(formatEther(balanceRaw as bigint)) : 0;
  const requiredNative = (buyAmount || 0) * nativePerBTQ;
  const hasEnoughFunds = nativeBalance >= requiredNative + gasReserve;

  // Single writeContract hook for both operations
  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = React.useState<`0x${string}` | undefined>(undefined);
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Track which operation is in progress
  const [operation, setOperation] = useState<"buy" | "withdraw" | null>(null);

  // Update statuses based on operation
  useEffect(() => {
    if (isPending || isTxLoading) {
      if (operation === "buy") {
        setBuyStatus("Transaction pending...");
      } else if (operation === "withdraw") {
        setWithdrawStatus("Transaction pending...");
      }
    }
    if (isTxSuccess) {
      if (operation === "buy") {
        setBuyStatus("✓ Purchase successful!");
        setTimeout(() => { setShowBuyModal(false); setBuyStatus(null); }, 1500);
      } else if (operation === "withdraw") {
        setWithdrawStatus("✓ Withdraw successful!");
        setTimeout(() => { setShowWithdrawModal(false); setWithdrawStatus(null); }, 1500);
      }
      setOperation(null);
    }
  }, [isPending, isTxLoading, isTxSuccess, operation]);

  const handleBuy = async () => {
    if (!contractAddress) {
      setBuyStatus(`Contract address not configured for chain ${chainId}.`);
      return;
    }
    if (!isSupportedChain) {
      setBuyStatus(`Unsupported chain ${chainId}. Switch to Robinhood Testnet (46630) or Arbitrum Sepolia (421614).`);
      return;
    }
    if (!buyAmount || buyAmount <= 0) {
      setBuyStatus("Please enter a valid amount.");
      return;
    }
    if (!hasEnoughFunds) {
      setBuyStatus(`Insufficient funds. You have ${nativeBalance.toFixed(6)} ${nativeSymbol} but need ~${(requiredNative + gasReserve).toFixed(6)} (${requiredNative.toFixed(6)} + gas). Max you can buy: ${maxBuyable} BTQ.`);
      return;
    }
    
    try {
      const valueWei = parseEther(requiredNative.toFixed(18));
      setBuyStatus("Sending transaction...");
      setOperation("buy");

      const hash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: BTQ_ABI,
        functionName: "buy",
        value: valueWei,
      });
      setTxHash(hash);
      setBuyStatus(`Transaction sent!`);
      console.log("buy tx hash:", hash);
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || String(err);
      setBuyStatus(`Error: ${msg}`);
      setOperation(null);
      console.error("buy error:", err);
    }
  };

  const handleWithdraw = async () => {
    if (!contractAddress) {
      setWithdrawStatus(`Contract address not configured for chain ${chainId}.`);
      return;
    }
    if (!isSupportedChain) {
      setWithdrawStatus(`Unsupported chain ${chainId}. Switch to Robinhood Testnet (46630) or Arbitrum Sepolia (421614).`);
      return;
    }
    if (btqBalance < minWithdrawBtq || !balanceRaw) {
      setWithdrawStatus(`Minimum withdraw is ${minWithdrawBtq} BTQ.`);
      return;
    }
    
    try {
      setWithdrawStatus("Selling BTQ for native tokens...");
      setOperation("withdraw");

      // Pass the raw on-chain balance (full precision) to sell all BTQ
      const hash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: BTQ_ABI,
        functionName: "sell",
        args: [balanceRaw as bigint],
      });
      setTxHash(hash);
      setWithdrawStatus(`Transaction sent!`);
      console.log("sell tx hash:", hash);
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || String(err);
      setWithdrawStatus(`Error: ${msg}`);
      setOperation(null);
      console.error("sell error:", err);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 rounded-lg">
      {/* Header with Balance */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-primary" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">BTQ Balance</span>
            <span className="text-2xl font-black text-white italic tracking-tighter">{btqBalance.toFixed(2)}</span>
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/30 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-600/30 transition-all rounded-lg"
        >
          <LogOut className="w-4 h-4" />
          LOGOUT
        </button>
      </div>

      {/* Address + Native Balance Display */}
      <div className="flex items-center justify-between bg-black/20 px-3 py-2 rounded border border-white/5">
        <span className="text-[11px] text-white/50 font-mono">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <span className="text-[10px] text-primary/80 font-black">
          {nativeBalance.toFixed(6)} {nativeSymbol}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowBuyModal(!showBuyModal)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-primary/20 border border-primary/40 text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/30 transition-all rounded-lg"
        >
          <Plus className="w-4 h-4" />
          BUY BTQ
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowWithdrawModal(!showWithdrawModal)}
          disabled={btqBalance < minWithdrawBtq}
          className={`flex items-center justify-center gap-2 px-4 py-3 border font-black uppercase text-[10px] tracking-widest rounded-lg transition-all ${
            btqBalance >= minWithdrawBtq
              ? "bg-secondary/20 border-secondary/40 text-secondary hover:bg-secondary/30"
              : "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          <Send className="w-4 h-4" />
          SELL BTQ
        </motion.button>
      </div>

      <p className="text-[9px] text-white/50 font-black uppercase tracking-widest">
        Minimum withdraw: {minWithdrawBtq} BTQ
      </p>

      {/* Buy Modal */}
      <AnimatePresence>
        {showBuyModal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/40 border border-primary/20 rounded-lg p-4 space-y-3"
          >
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Buy BTQ</h4>
            <p className="text-[9px] text-white/60">Rate: 1 BTQ = {nativePerBTQ} {nativeSymbol}</p>

            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={maxBuyable}
                value={buyAmount}
                onChange={(e) => setBuyAmount(Math.max(0, Number(e.target.value)))}
                className="bg-black/60 border border-white/10 px-3 py-2 text-white rounded flex-1 text-[10px]"
                placeholder="Amount"
              />
              <button
                onClick={() => setBuyAmount(maxBuyable)}
                className="px-3 py-2 bg-white/10 border border-white/20 text-white/80 font-black text-[9px] tracking-widest rounded hover:bg-white/20 transition-all"
              >
                MAX
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBuy}
                disabled={isPending || isTxLoading || operation === "buy" || !hasEnoughFunds || buyAmount <= 0}
                className="px-4 py-2 bg-primary text-black font-bold rounded hover:bg-white transition-all disabled:opacity-50"
              >
                {(isPending || isTxLoading) && operation === "buy" ? "..." : "BUY"}
              </motion.button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[9px] text-white/60">Cost: ~{requiredNative.toFixed(6)} {nativeSymbol}</p>
              <p className={`text-[9px] font-bold ${hasEnoughFunds ? 'text-emerald-400' : 'text-red-400'}`}>
                {hasEnoughFunds ? `✓ Affordable (max ${maxBuyable})` : `✗ Need more ${nativeSymbol} (max ${maxBuyable})`}
              </p>
            </div>

            {(isPending || isTxLoading) && operation === "buy" && <p className="text-[9px] text-white/80">Waiting for confirmation...</p>}
            {isTxSuccess && operation === null && <p className="text-[9px] text-emerald-300">Purchase successful!</p>}
            {buyStatus && <p className="text-[9px] text-red-400">{buyStatus}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/40 border border-secondary/20 rounded-lg p-4 space-y-3"
          >
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest">Sell BTQ</h4>
            <p className="text-[9px] text-white/60">Withdraw {btqBalance.toFixed(2)} BTQ to native currency</p>
            <p className="text-[9px] text-white/50">Minimum withdraw: {minWithdrawBtq} BTQ</p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleWithdraw}
              disabled={isTxLoading || isPending || operation === "withdraw" || btqBalance < minWithdrawBtq}
              className="w-full px-4 py-2 bg-secondary text-white font-bold rounded hover:bg-secondary/90 transition-all disabled:opacity-50"
            >
              {(isTxLoading || isPending) && operation === "withdraw" ? "Processing..." : "WITHDRAW ALL"}
            </motion.button>

            {(isTxLoading || isPending) && operation === "withdraw" && <p className="text-[9px] text-white/80">Waiting for confirmation...</p>}
            {isTxSuccess && operation === null && <p className="text-[9px] text-emerald-300">Withdraw successful!</p>}
            {withdrawStatus && <p className="text-[9px] text-red-400">{withdrawStatus}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WalletPanel;
