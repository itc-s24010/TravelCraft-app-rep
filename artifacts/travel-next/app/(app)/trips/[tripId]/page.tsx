"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, type Trip, type Summary, type Category } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { BudgetTab } from "@/components/trip/BudgetTab";
import { ExpenseTab } from "@/components/trip/ExpenseTab";
import { TransportationTab } from "@/components/trip/TransportationTab";
import { AccommodationTab } from "@/components/trip/AccommodationTab";
import { NotificationTab } from "@/components/trip/NotificationTab";
import { ScheduleTab } from "@/components/trip/ScheduleTab";

const TABS = [
  { id: "overview", label: "概要" },
  { id: "schedule", label: "スケジュール" },
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

  // Trip edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", tripDate: "", companions: "", memo: "" });
  const [saving, setSaving] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [creatingShare, setCreatingShare] = useState(false);

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

  function startEdit() {
    if (!trip) return;
    setEditForm({
      title: trip.title ?? "",
      tripDate: trip.tripDate ?? "",
      companions: trip.companions != null ? String(trip.companions) : "",
      memo: trip.memo ?? "",
    });
    setIsEditing(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.trips.update(id, {
        title: editForm.title || undefined,
        tripDate: editForm.tripDate || undefined,
        companions: editForm.companions !== "" ? Number(editForm.companions) : undefined,
        memo: editForm.memo || undefined,
      });
      setTrip(updated);
      setIsEditing(false);
      toast.success("旅行情報を更新しました");
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function openShare() {
    setShowShare(true);
    if (shareUrl) return;
    setCreatingShare(true);
    try {
      const { token } = await api.trips.createShareLink(id);
      setShareUrl(`${window.location.origin}/share/${token}`);
    } catch {
      toast.error("共有リンクを作成できませんでした");
    } finally {
      setCreatingShare(false);
    }
  }

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("共有リンクをコピーしました");
    } catch {
      toast.error("コピーできませんでした。リンクを選択してコピーしてください");
    }
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
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold">{trip.title}</h1>
          <div className="flex gap-2">
            <button onClick={openShare}
              className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              ↗ 共有
            </button>
            <button onClick={startEdit}
              className="text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors">
              ✏️ 編集
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {trip.tripDate && <span>📅 {formatDate(trip.tripDate)}</span>}
          {trip.companionNames?.length ? (
            <span>👥 {trip.companionNames.join("・")}</span>
          ) : trip.companions != null ? <span>👥 {trip.companions}名</span> : null}
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

      {showShare && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h2 className="font-semibold text-lg">旅行計画を共有</h2>
              <button onClick={() => setShowShare(false)} className="text-xl text-muted-foreground">×</button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              このリンクを送ると、ログインした相手が旅行計画に参加できます。参加者は同じ内容を閲覧・編集できます。
            </p>
            {creatingShare ? (
              <p className="text-sm py-3 text-muted-foreground">リンクを作成中...</p>
            ) : (
              <div className="flex gap-2">
                <input readOnly value={shareUrl} className="min-w-0 flex-1 px-3 py-2 border border-border rounded-lg text-sm" />
                <button onClick={copyShareUrl} disabled={!shareUrl}
                  className="shrink-0 px-3 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50">コピー</button>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">※ リンクを知っている人は参加できるため、信頼できる相手にだけ送ってください。</p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-lg">旅行情報を編集</h2>
              <button onClick={() => setIsEditing(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">旅行名 <span className="text-destructive">*</span></label>
                <input
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="例：京都旅行"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">日付</label>
                <input
                  type="date"
                  value={editForm.tripDate}
                  onChange={(e) => setEditForm({ ...editForm, tripDate: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">同行者数</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.companions}
                  onChange={(e) => setEditForm({ ...editForm, companions: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">メモ</label>
                <textarea
                  rows={3}
                  value={editForm.memo}
                  onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="自由記入欄"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
                  キャンセル
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              {trip.companionNames?.length ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">同行者</dt>
                  <dd className="text-right font-medium">{trip.companionNames.join("・")}</dd>
                </div>
              ) : trip.companions != null && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">同行者数</dt>
                  <dd>{trip.companions}名</dd>
                </div>
              )}
              {trip.memo && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground shrink-0">メモ</dt>
                  <dd className="text-right">{trip.memo}</dd>
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
      {activeTab === "schedule" && (
        <ScheduleTab tripId={id} />
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
