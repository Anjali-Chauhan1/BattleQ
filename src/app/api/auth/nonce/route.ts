import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { saveNonce } from "@/lib/rollup/server/memoryStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { address?: string };
    if (!body.address || !isAddress(body.address)) {
      return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
    }

    const nonce = crypto.randomUUID();
    await saveNonce(body.address, nonce);

    return NextResponse.json({ nonce });
  } catch {
    return NextResponse.json({ error: "Failed to generate nonce." }, { status: 500 });
  }
}
