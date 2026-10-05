import { AUTH_SESSION_KEY } from "@/lib/auth/constants";

export type AuthSession = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: string;
  countryCode: string;
  phoneNumber: string;
};

export function saveAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw =
    sessionStorage.getItem(AUTH_SESSION_KEY) ||
    localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
}