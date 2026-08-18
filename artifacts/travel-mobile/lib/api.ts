/**
 * API client for TravelCraft Mobile.
 *
 * Routes:
 *   Expo app → Replit proxy → Next.js (travel-next) → /spring rewrite → Spring Boot :8099
 *
 * URL shape: https://{EXPO_PUBLIC_DOMAIN}/travel-next/spring/{path}
 */

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? '';
export const API_BASE = `https://${DOMAIN}/travel-next/spring`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberDetail {
  userId: number;
  displayName: string;
}

export interface Trip {
  tripId: number;
  userId: number;
  title: string;
  startDate?: string;
  endDate?: string;
  isOwner?: boolean;
  isCompleted?: boolean;
  companionNames?: string[];
  memberDetails?: MemberDetail[];
  createdAt?: string;
}

export interface UserProfile {
  userId: number;
  userName?: string;
  email?: string;
}

// ─── Request helper ───────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  token: string | null = null,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}${text ? ': ' + text : ''}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── API surface ──────────────────────────────────────────────────────────────

export const api = {
  users: {
    me: (token: string) => request<UserProfile>('/users/me', {}, token),
  },
  trips: {
    list: (token: string) => request<Trip[]>('/trips', {}, token),
    get: (tripId: number, token: string) =>
      request<Trip>(`/trips/${tripId}`, {}, token),
    removeMember: (tripId: number, userId: number, token: string) =>
      request<void>(`/trips/${tripId}/members/${userId}`, { method: 'DELETE' }, token),
  },
};
