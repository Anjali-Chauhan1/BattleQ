import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthorizedAddress } from "@/lib/rollup/server/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const address = await getAuthorizedAddress(request);
  if (!address) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({ address });
}
