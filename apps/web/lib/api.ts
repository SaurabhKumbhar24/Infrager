/**
 * Client for the Infrager API (apps/api). Auth is a JWT sent as a Bearer
 * header — no cookies. The token lives in localStorage, so all data fetching
 * happens client-side; server components never see auth state.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const TOKEN_KEY = "infrager_token";
const USER_KEY = "infrager_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): { email: string; name: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeSession(token: string, user: { email: string; name: string }): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify({ email: user.email, name: user.name }));
}

export function clearSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

/**
 * fetch wrapper: prefixes API_URL, attaches the Bearer token and JSON
 * headers. Returns null on network failure so callers can treat it like a
 * failed response.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response | null> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    return null;
  }
}
