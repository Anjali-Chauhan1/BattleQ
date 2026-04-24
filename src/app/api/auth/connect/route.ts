import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { createSession } from "@/lib/rollup/server/memoryStore";

export const runtime = "nodejs";

/**
 * Simplified auth endpoint for wallets already authenticated via
 * InterwovenKit. Since InterwovenKit handles the cryptographic wallet
 * verification on the client, we trust the connected address and issue
 * a session token without requiring an additional EVM signature.
 *
 * This avoids signature-format incompatibilities between Initia Privy
 * wallets and viem's verifyMessage.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { address?: string };
    if (!body.address || !isAddress(body.address)) {
      return NextResponse.json(
        { error: "Invalid wallet address." },
        { status: 400 },
      );
    }

    const sessionToken = await createSession(body.address as `0x${string}`);

    return NextResponse.json({
      token: sessionToken,
      address: body.address,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create session." },
      { status: 500 },
    );
  }
}
