import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthorizedAddress } from "@/lib/rollup/server/auth";
import { clearPendingStake, getPendingStake } from "@/lib/rollup/server/memoryStore";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const address = await getAuthorizedAddress(request);
  if (!address) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pendingStake = await getPendingStake(address);
  if (!pendingStake) {
    return NextResponse.json({ ok: true, forfeited: false });
  }

  await clearPendingStake(address);
  return NextResponse.json({ ok: true, forfeited: true, txHash: pendingStake.txHash });
}
