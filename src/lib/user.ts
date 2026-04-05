export function getGuestUser(): string {
  if (typeof window === "undefined") return "Explorer";
  let user = localStorage.getItem("battleq_user");
  if (!user) {
    user = `guest_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem("battleq_user", user);
  }
  return user;
}

export function clearGuestUser() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("battleq_user");
  }
}
