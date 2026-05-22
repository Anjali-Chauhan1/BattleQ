export function getWalletUser(): string {
  if (typeof window === "undefined") return "Wallet_User";
  return localStorage.getItem("battleq_user") || "Wallet_User";
}

export function getWalletId(): string {
  if (typeof window === "undefined") return "Wallet_User";
  return localStorage.getItem("battleq_wallet_id") || localStorage.getItem("battleq_user") || "Wallet_User";
}

export function getWalletIdVariants(): string[] {
  if (typeof window === "undefined") return ["Wallet_User"];

  const variants = [
    localStorage.getItem("battleq_wallet_id"),
    localStorage.getItem("battleq_user"),
    "Wallet_User",
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => value.toLowerCase());

  return Array.from(new Set(variants));
}

export function getPracticeRoundKey(level: number, walletId?: string): string {
  const id = walletId ?? getWalletId();
  return `battleq_practice_complete:${id.toLowerCase()}:${level}`;
}

export function getPracticeRoundKeys(level: number): string[] {
  return getWalletIdVariants().map((walletId) => getPracticeRoundKey(level, walletId));
}

export function hasCompletedPracticeRound(level: number): boolean {
  if (typeof window === "undefined") return false;
  return getPracticeRoundKeys(level).some((key) => localStorage.getItem(key) === "true");
}

export function getPracticeUnlockedLevel(): number {
  if (typeof window === "undefined") return 1;

  const completed1 = hasCompletedPracticeRound(1);
  const completed2 = hasCompletedPracticeRound(2);
  const completed3 = hasCompletedPracticeRound(3);

  if (completed1 && completed2 && completed3) return 4;
  if (completed1 && completed2) return 3;
  if (completed1) return 2;
  return 1;
}

export function getBtqSettlementKey(): string {
  return `battleq_btq_settlement_delta:${getWalletId().toLowerCase()}`;
}

export function getBtqSettlementDelta(): number {
  if (typeof window === "undefined") return 0;
  const raw = Number(localStorage.getItem(getBtqSettlementKey()) || 0);
  return Number.isFinite(raw) ? raw : 0;
}

export function getBtqSettlementMarkerKey(roomId: string): string {
  return `battleq_duel_settled:${getWalletId().toLowerCase()}:${roomId}`;
}

export function applyDuelSettlement(roomId: string, delta: number): boolean {
  if (typeof window === "undefined") return false;

  const markerKey = getBtqSettlementMarkerKey(roomId);
  if (localStorage.getItem(markerKey) === "true") return false;

  const currentDelta = getBtqSettlementDelta();
  localStorage.setItem(getBtqSettlementKey(), String(currentDelta + delta));
  localStorage.setItem(markerKey, "true");
  return true;
}

export function markPracticeRoundComplete(level: number) {
  if (typeof window !== "undefined") {
    getPracticeRoundKeys(level).forEach((key) => {
      localStorage.setItem(key, "true");
    });
  }
}

export function clearWalletUser() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("battleq_user");
    localStorage.removeItem("battleq_wallet_id");
  }
}
