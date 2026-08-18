// ─── Auth helpers ──────────────────────────────────────────────────────────

/** Returns stored Firebase ID token, or null if not logged in. */
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("__firebase_token");
}

/** Stores token so API calls can use it without re-initialising Firebase. */
export function storeToken(token: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("__firebase_token", token);
  }
}

/** Clears stored token and session cookie, then sends browser to /login. */
export function signOutAndRedirect(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("__firebase_token");
  document.cookie = "__session=; path=/; max-age=0; SameSite=Lax";
  window.location.href = "/login";
}

// ─── Token helpers ─────────────────────────────────────────────────────────

/**
 * Returns the freshest available Firebase ID token.
 * Calls getIdToken() (no force) so Firebase returns a cached token if still
 * valid, or silently refreshes it if it is close to expiry.
 * Falls back to the sessionStorage copy if Firebase is unavailable.
 * Uses a 5-second timeout so a hung Firebase call never blocks the UI.
 */
async function getFreshToken(): Promise<string | null> {
  try {
    const { getFirebaseAuth } = await import("@/lib/firebase/client");
    const auth = getFirebaseAuth();
    // Wait for Firebase to finish initialising its auth state before reading
    // currentUser. Without this, currentUser is null on the first call right
    // after page load and we fall back to a potentially-expired stored token.
    // authStateReady() is a one-shot Promise (not a listener) so it is safe
    // in environments where IndexedDB listeners can hang.
    await Promise.race([
      auth.authStateReady(),
      new Promise<void>((resolve) => setTimeout(resolve, 3_000)),
    ]);
    const user = auth.currentUser;
    if (user) {
      const token = await Promise.race([
        user.getIdToken(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("token timeout")), 5_000)
        ),
      ]);
      storeToken(token);
      return token;
    }
  } catch {
    // Firebase unavailable or timed out — fall back to stored token
  }
  return getStoredToken();
}

// ─── Base request ──────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getFreshToken();
  console.log("[api] request", path, "hasToken:", !!token);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // 10s timeout so a hung fetch doesn't freeze the UI forever
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  let res: Response;
  try {
    res = await fetch(`/spring${path}`, {
      ...options,
      // These responses are user-scoped. Never reuse another session's
      // browser/Next cache entry for the same trip URL.
      cache: "no-store",
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  console.log("[api] response", path, res.status);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── API ───────────────────────────────────────────────────────────────────

export const api = {
  users: {
    me: () => request<UserProfile>("/users/me"),
    update: (data: Pick<UserProfile, "userName">) =>
      request<UserProfile>("/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  },
  categories: {
    list: () => request<Category[]>("/categories"),
    updateColor: (id: number, color: string | null) =>
      request<Category>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify({ color }) }),
  },
  trips: {
    list: () => request<Trip[]>("/trips"),
    create: (data: Partial<Trip>) =>
      request<Trip>("/trips", { method: "POST", body: JSON.stringify(data) }),
    get: (id: number) => request<Trip>(`/trips/${id}`),
    update: (id: number, data: Partial<Trip>) =>
      request<Trip>(`/trips/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<void>(`/trips/${id}`, { method: "DELETE" }),
    summary: (id: number) => request<Summary>(`/trips/${id}/summary`),
    createShareLink: (id: number) =>
      request<ShareLink>(`/trips/${id}/share-link`, { method: "POST" }),
    revokeShareLink: (id: number) =>
      request<void>(`/trips/${id}/share-link`, { method: "DELETE" }),
    joinShared: (token: string) =>
      request<Trip>(`/shared-trips/${token}/join`, { method: "POST" }),
  },
  transportation: {
    list: (tripId: number) =>
      request<Transportation[]>(`/trips/${tripId}/transportation`),
    create: (tripId: number, data: Partial<Transportation>) =>
      request<Transportation>(`/trips/${tripId}/transportation`, {
        method: "POST", body: JSON.stringify(data),
      }),
    update: (tripId: number, id: number, data: Partial<Transportation>) =>
      request<Transportation>(`/trips/${tripId}/transportation/${id}`, {
        method: "PATCH", body: JSON.stringify(data),
      }),
    delete: (tripId: number, id: number) =>
      request<void>(`/trips/${tripId}/transportation/${id}`, { method: "DELETE" }),
  },
  accommodation: {
    list: (tripId: number) =>
      request<Accommodation[]>(`/trips/${tripId}/accommodation`),
    create: (tripId: number, data: Partial<Accommodation>) =>
      request<Accommodation>(`/trips/${tripId}/accommodation`, {
        method: "POST", body: JSON.stringify(data),
      }),
    update: (tripId: number, id: number, data: Partial<Accommodation>) =>
      request<Accommodation>(`/trips/${tripId}/accommodation/${id}`, {
        method: "PATCH", body: JSON.stringify(data),
      }),
    delete: (tripId: number, id: number) =>
      request<void>(`/trips/${tripId}/accommodation/${id}`, { method: "DELETE" }),
  },
  budget: {
    list: (tripId: number) => request<Budget[]>(`/trips/${tripId}/budget`),
    create: (tripId: number, data: Partial<Budget>) =>
      request<Budget>(`/trips/${tripId}/budget`, {
        method: "POST", body: JSON.stringify(data),
      }),
    update: (tripId: number, id: number, data: Partial<Budget>) =>
      request<Budget>(`/trips/${tripId}/budget/${id}`, {
        method: "PATCH", body: JSON.stringify(data),
      }),
    delete: (tripId: number, id: number) =>
      request<void>(`/trips/${tripId}/budget/${id}`, { method: "DELETE" }),
  },
  expenses: {
    list: (tripId: number) => request<Expense[]>(`/trips/${tripId}/expenses`),
    create: (tripId: number, data: Partial<Expense>) =>
      request<Expense>(`/trips/${tripId}/expenses`, {
        method: "POST", body: JSON.stringify(data),
      }),
    update: (tripId: number, id: number, data: Partial<Expense>) =>
      request<Expense>(`/trips/${tripId}/expenses/${id}`, {
        method: "PATCH", body: JSON.stringify(data),
      }),
    delete: (tripId: number, id: number) =>
      request<void>(`/trips/${tripId}/expenses/${id}`, { method: "DELETE" }),
  },
  notifications: {
    list: (tripId: number) =>
      request<Notification[]>(`/trips/${tripId}/notifications`),
    create: (tripId: number, data: Partial<Notification>) =>
      request<Notification>(`/trips/${tripId}/notifications`, {
        method: "POST", body: JSON.stringify(data),
      }),
    update: (tripId: number, id: number, data: Partial<Notification>) =>
      request<Notification>(`/trips/${tripId}/notifications/${id}`, {
        method: "PATCH", body: JSON.stringify(data),
      }),
    delete: (tripId: number, id: number) =>
      request<void>(`/trips/${tripId}/notifications/${id}`, { method: "DELETE" }),
  },
  schedule: {
    list: (tripId: number) =>
      request<ScheduleItem[]>(`/trips/${tripId}/schedule`),
    create: (tripId: number, data: Partial<ScheduleItem>) =>
      request<ScheduleItem>(`/trips/${tripId}/schedule`, {
        method: "POST", body: JSON.stringify(data),
      }),
    update: (tripId: number, id: number, data: Partial<ScheduleItem>) =>
      request<ScheduleItem>(`/trips/${tripId}/schedule/${id}`, {
        method: "PATCH", body: JSON.stringify(data),
      }),
    delete: (tripId: number, id: number) =>
      request<void>(`/trips/${tripId}/schedule/${id}`, { method: "DELETE" }),
  },
};

// ─── Types ─────────────────────────────────────────────────────────────────
export interface Category { categoryId: number; categoryName: string; color?: string }
export interface UserProfile { userId: number; userName?: string; email?: string }
export interface Trip {
  tripId: number; userId: number; title: string;
  tripDate?: string; startDate?: string; endDate?: string;
  memo?: string; companions?: number;
  companionNames?: string[];
  isCompleted?: boolean;
  isOwner?: boolean;
  createdAt?: string; updatedAt?: string;
}
export interface ShareLink { token: string }
export interface Transportation {
  transportationId: number; tripId: number;
  transportationType?: string; departurePlace?: string; arrivalPlace?: string;
  departureTime?: string; arrivalTime?: string; fare?: number;
}
export interface Accommodation {
  accommodationId: number; tripId: number;
  accommodationName?: string; address?: string;
  checkIn?: string; checkOut?: string; reservationNumber?: string;
}
export interface Budget {
  budgetId: number; tripId: number; categoryId: number;
  budgetAmount?: number; category?: Category;
}
export interface Expense {
  expenseId: number; tripId: number; categoryId: number;
  expenseAmount: number; expenseDate?: string; paymentMethod?: string;
  description?: string;
  category?: Category;
}
export interface Notification {
  notificationId: number; tripId: number;
  reminder?: string; notificationDatetime?: string; notificationType?: string;
}
export interface ScheduleItem {
  scheduleId: number; tripId: number;
  title: string; description?: string; location?: string;
  startTime?: string; endTime?: string; cost?: number;
  createdAt?: string;
}
export interface Summary {
  totalBudget: number; totalExpense: number; remaining: number;
  categoryBreakdown: Array<{
    categoryId: number; categoryName: string;
    budget: number; expense: number;
  }>;
}
