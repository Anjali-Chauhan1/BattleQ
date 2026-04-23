import type { NextRequest } from "next/server";
import { getSession } from "@/lib/rollup/server/memoryStore";

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export async function getAuthorizedAddress(request: NextRequest): Promise<`0x${string}` | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const session = await getSession(token);
  if (!session) return null;
  return session.address;
}
