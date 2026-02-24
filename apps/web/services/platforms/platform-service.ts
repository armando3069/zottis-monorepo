const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export interface PlatformAccount {
  id: number;
  user_id: number;
  platform: string;
  external_app_id: string;
  settings?: { username?: string; first_name?: string; [key: string]: unknown };
  created_at: string;
}

export interface PlatformAccountsResponse {
  total: number;
  accounts: PlatformAccount[];
}

export async function getPlatformAccounts(token: string): Promise<PlatformAccountsResponse> {
  const res = await fetch(`${API_URL}/platform-accounts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  // 404 means the user has no accounts yet — treat as empty list.
  if (res.status === 404) return { total: 0, accounts: [] };
  if (!res.ok) throw new Error(`Failed to fetch platform accounts (${res.status})`);
  return res.json();
}

export async function connectTelegram(token: string, botToken: string): Promise<void> {
  const res = await fetch(`${API_URL}/telegram/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ botToken }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string })?.message ?? "Failed to connect Telegram");
  }
}
