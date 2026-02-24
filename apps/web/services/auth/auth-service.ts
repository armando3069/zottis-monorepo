import type {AuthUser,SignupPayload,LoginPayload} from "@/services/auth/auth-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const TOKEN_KEY = "auth_token";


export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── API calls ────────────────────────────────────────────────────────────────

export async function signup(payload: SignupPayload): Promise<string> {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? "Signup failed");
  }

  const { access_token } = await res.json();
  saveToken(access_token);
  return access_token;
}

export async function login(payload: LoginPayload): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? "Login failed");
  }

  const { access_token } = await res.json();
  saveToken(access_token);
  return access_token;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const token = getToken();
  if (!token) throw new Error("No auth token");

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch current user");
  }

  return res.json();
}

export function logout(): void {
  clearToken();
}

export function startGoogleLogin(): void {
  window.location.href = `${API_URL}/auth/google`;
}

export function startSlackLogin(): void {
  window.location.href = `${API_URL}/auth/slack`;
}

// ── Utility: attach auth header for protected API calls ──────────────────────

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
