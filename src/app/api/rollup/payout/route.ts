import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthorizedAddress } from "@/lib/rollup/server/auth";
import { clearPendingStake, getPendingStake } from "@/lib/rollup/server/memoryStore";
import { getHouseWalletClient, rollupPublicClient } from "@/lib/rollup/server/clients";

export const runtime = "nodejs";

interface PayoutPayload {
  amountWei?: string;
}

export async function POST(request: NextRequest) {
  try {
    const address = await getAuthorizedAddress(request);
    if (!address) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as PayoutPayload;
    if (!body.amountWei) {
      return NextResponse.json({ error: "Missing payout amount." }, { status: 400 });
    }

    let payoutWei: bigint;
    try {
      payoutWei = BigInt(body.amountWei);
    } catch {
      return NextResponse.json({ error: "Invalid amountWei." }, { status: 400 });
    }

    if (payoutWei <= BigInt(0)) {
      return NextResponse.json({ error: "Payout amount must be greater than zero." }, { status: 400 });
    }

    const pendingStake = await getPendingStake(address);
    if (!pendingStake) {
      return NextResponse.json({ error: "No active stake found for this wallet." }, { status: 409 });
    }

    const stakedWei = BigInt(pendingStake.amountWei);
    const maxPayout = stakedWei * BigInt(3);
    if (payoutWei > maxPayout) {
      return NextResponse.json({ error: "Payout exceeds allowed multiplier for the stake." }, { status: 400 });
    }

    const house = getHouseWalletClient();
    if (!house) {
      return NextResponse.json(
        { error: "ROLLUP_HOUSE_PRIVATE_KEY is missing or invalid. Cannot distribute winnings." },
        { status: 500 },
      );
    }

    const txHash = await house.walletClient.sendTransaction({
      account: house.account,
      to: address,
      value: payoutWei,
    });

    const receipt = await rollupPublicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== "success") {
      return NextResponse.json({ error: "Payout transaction failed." }, { status: 500 });
    }

    await clearPendingStake(address);

    return NextResponse.json({
      ok: true,
      txHash,
      payoutWei: payoutWei.toString(),
      stakedTxHash: pendingStake.txHash,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process payout." }, { status: 500 });
  }
}
