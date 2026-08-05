import { getFirebaseAuth } from "./firebase/client";
import { onAuthStateChanged } from "firebase/auth";

async function getAuthHeaders(): Promise<Record<string, string>> {
  // Primary: use the token stored in sessionStorage at login time
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem("__firebase_token");
    if (stored) {
      return { Authorization: `Bearer ${stored}` };
    }
  }

  // Fallback: get live token from Firebase auth state
  const auth = getFirebaseAuth();
  const user = await new Promise<import("firebase/auth").User | null>(
    (resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => {
        unsub();
        resolve(u);
      });
    }
  );
  if (!user) {
    console.warn("[api] no Firebase user — not logged in");
    return {};
  }
  const token = await user.getIdToken();
  // Cache it for subsequent calls
  if (typeof window !== "undefined") {
    sessionStorage.setItem("__firebase_token", token);
  }
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  // Debug: log whether we have a token
  if (typeof window !== "undefined") {
    console.log("[api] request", path, "hasToken:", !!headers.Authorization);
  }
  const res = await fetch(`/spring${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[api] error", res.status, path, text);
    throw new Error(`API error ${res.status}: ${text}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  categories: {
    list: () => request<Category[]>("/categories"),
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
  },
  transportation: {
    list: (tripId: number) =>
      request<Transportation[]>(`/trips/${tripId}/transportation`),
    create: (tripId: number, data: Partial<Transportation>) =>
      request<Transportation>(`/trips/${tripId}/transportation`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (tripId: number, id: number, data: Partial<Transportation>) =>
      request<Transportation>(`/trips/${tripId}/transportation/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (tripId: number, id: number) =>
      request<void>(`/trips/${tripId}/transportation/${id}`, { method: "DELETE" }),
  },
  accommodation: {
    list: (tripId: number) =>
      request<Accommodation[]>(`/trips/${tripId}/accommodation`),
    create: (tripId: number, data: Partial<Accommodation>) =>
      request<Accommodation>(`/trips/${tripId}/accommodation`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (tripId: number, id: number, data: Partial<Accommodation>) =>
      request<Accommodation>(`/trips/${tripId}/accommodation/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (tripId: number, id: number) =>
      request<void>(`/trips/${tripId}/accommodation/${id}`, { method: "DELETE" }),
  },
  budget: {
    list: (tripId: number) => request<Budget[]>(`/trips/${tripId}/budget`),
    create: (tripId: number, data: Partial<Budget>) =>
      request<Budget>(`/trips/${tripId}/budget`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (tripId: number, id: number, data: Partial<Budget>) =>
      request<Budget>(`/trips/${tripId}/budget/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (tripId: number, id: number) =>
      request<void>(`/trips/${tripId}/budget/${id}`, { method: "DELETE" }),
  },
  expenses: {
    list: (tripId: number) => request<Expense[]>(`/trips/${tripId}/expenses`),
    create: (tripId: number, data: Partial<Expense>) =>
      request<Expense>(`/trips/${tripId}/expenses`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (tripId: number, id: number, data: Partial<Expense>) =>
      request<Expense>(`/trips/${tripId}/expenses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (tripId: number, id: number) =>
      request<void>(`/trips/${tripId}/expenses/${id}`, { method: "DELETE" }),
  },
  notifications: {
    list: (tripId: number) =>
      request<Notification[]>(`/trips/${tripId}/notifications`),
    create: (tripId: number, data: Partial<Notification>) =>
      request<Notification>(`/trips/${tripId}/notifications`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (tripId: number, id: number, data: Partial<Notification>) =>
      request<Notification>(`/trips/${tripId}/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (tripId: number, id: number) =>
      request<void>(`/trips/${tripId}/notifications/${id}`, { method: "DELETE" }),
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Category { categoryId: number; categoryName: string }
export interface Trip {
  tripId: number; userId: number; title: string;
  tripDate?: string; memo?: string; companions?: number;
  createdAt?: string; updatedAt?: string;
}
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
  category?: Category;
}
export interface Notification {
  notificationId: number; tripId: number;
  reminder?: string; notificationDatetime?: string; notificationType?: string;
}
export interface Summary {
  totalBudget: number; totalExpense: number; remaining: number;
  categoryBreakdown: Array<{
    categoryId: number; categoryName: string;
    budget: number; expense: number;
  }>;
}
