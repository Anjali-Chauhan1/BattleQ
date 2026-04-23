export function formatWalletAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getGuestUser(): string {
  if (typeof window === "undefined") return "Explorer";
  let user = localStorage.getItem("battleq_user");
  if (!user) {
    user = `guest_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem("battleq_user", user);
  }
  return user;
}

export function setWalletUser(address: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("battleq_user", formatWalletAddress(address));
}

export function clearGuestUser() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("battleq_user");
  }
}
