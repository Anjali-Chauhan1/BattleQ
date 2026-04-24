import { NextResponse } from "next/server";
import { isAddress, verifyMessage } from "viem";
import { createAuthMessage } from "@/lib/rollup/authMessage";
import { consumeNonce, createSession } from "@/lib/rollup/server/memoryStore";

export const runtime = "nodejs";

interface VerifyPayload {
  address?: string;
  nonce?: string;
  signature?: `0x${string}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyPayload;
    if (!body.address || !isAddress(body.address)) {
      return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
    }

    if (!body.nonce || !body.signature) {
      return NextResponse.json({ error: "Missing nonce or signature." }, { status: 400 });
    }

    const nonceAccepted = await consumeNonce(body.address, body.nonce);
    if (!nonceAccepted) {
      return NextResponse.json({ error: "Nonce is expired or invalid." }, { status: 401 });
    }

    const message = createAuthMessage(body.address, body.nonce);
    const valid = await verifyMessage({
      address: body.address,
      message,
      signature: body.signature,
    });

    if (!valid) {
      return NextResponse.json({ error: "Signature verification failed." }, { status: 401 });
    }

    const sessionToken = await createSession(body.address as `0x${string}`);

    return NextResponse.json({
      token: sessionToken,
      address: body.address,
    });
  } catch {
    return NextResponse.json({ error: "Authentication failed." }, { status: 500 });
  }
}
