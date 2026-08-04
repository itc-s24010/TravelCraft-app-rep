"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, type Trip, type Summary, type Transportation, type Accommodation, type Budget, type Expense, type Notification, type Category } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { BudgetTab } from "@/components/trip/BudgetTab";
import { ExpenseTab } from "@/components/trip/ExpenseTab";
import { TransportationTab } from "@/components/trip/TransportationTab";
import { AccommodationTab } from "@/components/trip/AccommodationTab";
import { NotificationTab } from "@/components/trip/NotificationTab";

const TABS = [
  { id: "overview", label: "概要" },
  { id: "budget", label: "予算" },
  { id: "expenses", label: "支出" },
  { id: "transportation", label: "交通" },
  { id: "accommodation", label: "宿泊" },
  { id: "notifications", label: "通知" },
];

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const id = Number(tripId);
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, [id]);

  async function loadAll() {
    try {
      const [t, s, cats] = await Promise.all([
        api.trips.get(id),
        api.trips.summary(id),
        api.categories.list(),
      ]);
      setTrip(t);
      setSummary(s);
      setCategories(cats);
    } catch {
      toast.error("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function refreshSummary() {
    try {
      const s = await api.trips.summary(id);
      setSummary(s);
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin text-4xl">✈️</div>
      </div>
    );
  }

  if (!trip) return <div className="text-center py-20">旅行が見つかりません</div>;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-4">
        <Link href="/trips" className="hover:text-primary">旅行一覧</Link>
        <span className="mx-2">›</span>
        <span className="text-foreground font-medium">{trip.title}</span>
      </nav>

      {/* Trip Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 mb-6 border border-border">
        <h1 className="text-2xl font-bold mb-2">{trip.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {trip.tripDate && <span>📅 {formatDate(trip.tripDate)}</span>}
          {trip.companions != null && <span>👥 {trip.companions}名</span>}
        </div>
        {trip.memo && <p className="mt-3 text-sm text-muted-foreground">{trip.memo}</p>}

        {summary && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "予算合計", value: formatCurrency(summary.totalBudget), color: "text-secondary" },
              { label: "支出合計", value: formatCurrency(summary.totalExpense), color: "text-primary" },
              { label: "残額", value: formatCurrency(summary.remaining), color: summary.remaining < 0 ? "text-destructive" : "text-green-600" },
            ].map((item) => (
              <div key={item.label} className="bg-white/70 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/50 rounded-xl p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="bg-white rounded-xl border border-border p-4">
            <h3 className="font-semibold mb-2 text-secondary">旅行情報</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">旅行名</dt>
                <dd className="font-medium">{trip.title}</dd>
              </div>
              {trip.tripDate && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">日付</dt>
                  <dd>{formatDate(trip.tripDate)}</dd>
                </div>
              )}
              {trip.companions != null && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">同行者数</dt>
                  <dd>{trip.companions}名</dd>
                </div>
              )}
            </dl>
          </div>
          {summary && (
            <div className="bg-white rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-2 text-secondary">カテゴリ別予算</h3>
              <div className="space-y-2">
                {summary.categoryBreakdown.filter(c => c.budget > 0 || c.expense > 0).map((c) => (
                  <div key={c.categoryId}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{c.categoryName}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(c.expense)} / {formatCurrency(c.budget)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, c.budget > 0 ? (c.expense / c.budget) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === "budget" && (
        <BudgetTab tripId={id} categories={categories} summary={summary} onRefresh={refreshSummary} />
      )}
      {activeTab === "expenses" && (
        <ExpenseTab tripId={id} categories={categories} onRefresh={refreshSummary} />
      )}
      {activeTab === "transportation" && (
        <TransportationTab tripId={id} />
      )}
      {activeTab === "accommodation" && (
        <AccommodationTab tripId={id} />
      )}
      {activeTab === "notifications" && (
        <NotificationTab tripId={id} />
      )}
    </div>
  );
}
