import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isHash } from "viem";
import { getAuthorizedAddress } from "@/lib/rollup/server/auth";
import { rollupConfig } from "@/lib/rollup/config";
import { rollupPublicClient } from "@/lib/rollup/server/clients";
import { setPendingStake } from "@/lib/rollup/server/memoryStore";

export const runtime = "nodejs";

interface StakePayload {
  txHash?: `0x${string}`;
  amountWei?: string;
}

export async function POST(request: NextRequest) {
  try {
    const address = await getAuthorizedAddress(request);
    if (!address) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as StakePayload;
    if (!body.txHash || !isHash(body.txHash) || !body.amountWei) {
      return NextResponse.json({ error: "Missing transaction details." }, { status: 400 });
    }

    let expectedStake: bigint;
    try {
      expectedStake = BigInt(body.amountWei);
    } catch {
      return NextResponse.json({ error: "Invalid amountWei." }, { status: 400 });
    }

    if (expectedStake <= BigInt(0)) {
      return NextResponse.json({ error: "Stake amount must be greater than zero." }, { status: 400 });
    }

    const [tx, receipt] = await Promise.all([
      rollupPublicClient.getTransaction({ hash: body.txHash }),
      rollupPublicClient.waitForTransactionReceipt({ hash: body.txHash }),
    ]);

    const txTo = tx.to?.toLowerCase();
    const txFrom = tx.from.toLowerCase();
    const treasury = rollupConfig.treasuryAddress.toLowerCase();

    if (receipt.status !== "success") {
      return NextResponse.json({ error: "Stake transaction failed." }, { status: 400 });
    }

    if (txFrom !== address.toLowerCase()) {
      return NextResponse.json({ error: "Transaction sender mismatch." }, { status: 403 });
    }

    if (!txTo || txTo !== treasury) {
      return NextResponse.json({ error: "Stake must be sent to BattleQ treasury address." }, { status: 400 });
    }

    if (tx.value < expectedStake) {
      return NextResponse.json({ error: "Staked value is lower than expected." }, { status: 400 });
    }

    await setPendingStake(address, {
      amountWei: expectedStake.toString(),
      txHash: body.txHash,
      stakedAt: Date.now(),
    });

    return NextResponse.json({
      ok: true,
      stakedWei: expectedStake.toString(),
      txHash: body.txHash,
    });
  } catch {
    return NextResponse.json({ error: "Failed to verify stake transaction." }, { status: 500 });
  }
}
