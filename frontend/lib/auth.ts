import { api } from "./api";
import type { User } from "./types";

export function saveUser(user: User) {
  localStorage.setItem("voucher_user", JSON.stringify(user));
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("voucher_user");
  return raw ? JSON.parse(raw) : null;
}

export async function ensureUser(): Promise<User> {
  const stored = getStoredUser();
  if (stored) return stored;
  const user = await api.me();
  saveUser(user);
  return user;
}
