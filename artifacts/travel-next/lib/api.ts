import { createClient } from "./supabase/client";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Categories
  categories: {
    list: () => request<Category[]>("/categories"),
  },
  // Trips
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
  // Transportation
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
  // Accommodation
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
  // Budget
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
  // Expenses
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
  // Notifications
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
