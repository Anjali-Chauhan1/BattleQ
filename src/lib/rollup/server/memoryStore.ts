import { randomBytes } from "node:crypto";
import { Redis } from "@upstash/redis";

type NonceRecord = {
  nonce: string;
  expiresAt: number;
};

type SessionRecord = {
  address: `0x${string}`;
  expiresAt: number;
};

type StakeRecord = {
  amountWei: string;
  txHash: `0x${string}`;
  stakedAt: number;
};

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

if (!redis && typeof process !== "undefined") {
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;
  if (isVercel) {
    console.warn(
      "[BattleQ] ⚠️  UPSTASH_REDIS_REST_URL / TOKEN not set. " +
        "In-memory store will NOT persist across serverless invocations. " +
        "Auth and staking will break in production. Configure Upstash Redis.",
    );
  }
}

const storePrefix = process.env.ROLLUP_STORE_PREFIX ?? "battleq";

const nonces = new Map<string, NonceRecord>();
const sessions = new Map<string, SessionRecord>();
const pendingStakes = new Map<string, StakeRecord>();

const NONCE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const STAKE_TTL_MS = 6 * 60 * 60 * 1000;

function now(): number {
  return Date.now();
}

function nonceKey(address: string): string {
  return `${storePrefix}:nonce:${address.toLowerCase()}`;
}

function sessionKey(token: string): string {
  return `${storePrefix}:session:${token}`;
}

function stakeKey(address: `0x${string}`): string {
  return `${storePrefix}:stake:${address.toLowerCase()}`;
}

function cleanupExpired(): void {
  const ts = now();
  for (const [address, record] of nonces.entries()) {
    if (record.expiresAt < ts) nonces.delete(address);
  }
  for (const [token, record] of sessions.entries()) {
    if (record.expiresAt < ts) sessions.delete(token);
  }
}

export async function saveNonce(address: string, nonce: string): Promise<void> {
  if (redis) {
    await redis.set(
      nonceKey(address),
      { nonce, expiresAt: now() + NONCE_TTL_MS } satisfies NonceRecord,
      { ex: Math.ceil(NONCE_TTL_MS / 1000) },
    );
    return;
  }

  cleanupExpired();
  nonces.set(address.toLowerCase(), {
    nonce,
    expiresAt: now() + NONCE_TTL_MS,
  });
}

export async function consumeNonce(address: string, nonce: string): Promise<boolean> {
  if (redis) {
    const key = nonceKey(address);
    const record = await redis.get<NonceRecord>(key);
    if (!record) return false;
    await redis.del(key);
    return record.nonce === nonce;
  }

  cleanupExpired();
  const key = address.toLowerCase();
  const record = nonces.get(key);
  if (!record) return false;
  nonces.delete(key);
  return record.nonce === nonce;
}

export async function createSession(address: `0x${string}`): Promise<string> {
  const token = randomBytes(32).toString("hex");

  if (redis) {
    await redis.set(
      sessionKey(token),
      { address, expiresAt: now() + SESSION_TTL_MS } satisfies SessionRecord,
      { ex: Math.ceil(SESSION_TTL_MS / 1000) },
    );
    return token;
  }

  cleanupExpired();
  sessions.set(token, {
    address,
    expiresAt: now() + SESSION_TTL_MS,
  });
  return token;
}

export async function getSession(token: string): Promise<SessionRecord | null> {
  if (redis) {
    const key = sessionKey(token);
    const record = await redis.get<SessionRecord>(key);
    if (!record) return null;
    if (record.expiresAt < now()) {
      await redis.del(key);
      return null;
    }
    return record;
  }

  cleanupExpired();
  const record = sessions.get(token);
  return record ?? null;
}

export async function setPendingStake(address: `0x${string}`, stake: StakeRecord): Promise<void> {
  if (redis) {
    await redis.set(stakeKey(address), stake, { ex: Math.ceil(STAKE_TTL_MS / 1000) });
    return;
  }

  pendingStakes.set(address.toLowerCase(), stake);
}

export async function getPendingStake(address: `0x${string}`): Promise<StakeRecord | null> {
  if (redis) {
    const record = await redis.get<StakeRecord>(stakeKey(address));
    return record ?? null;
  }

  return pendingStakes.get(address.toLowerCase()) ?? null;
}

export async function clearPendingStake(address: `0x${string}`): Promise<void> {
  if (redis) {
    await redis.del(stakeKey(address));
    return;
  }

  pendingStakes.delete(address.toLowerCase());
}
