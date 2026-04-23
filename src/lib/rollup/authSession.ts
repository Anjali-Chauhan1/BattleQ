const AUTH_TOKEN_KEY = "battleq_auth_token";
const WALLET_ADDRESS_KEY = "battleq_wallet_address";

export function setAuthSession(token: string, address: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(WALLET_ADDRESS_KEY, address);
  localStorage.setItem("battleq_user", `${address.slice(0, 6)}...${address.slice(-4)}`);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getAuthedWallet(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WALLET_ADDRESS_KEY);
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(WALLET_ADDRESS_KEY);
  localStorage.removeItem("battleq_user");
}
