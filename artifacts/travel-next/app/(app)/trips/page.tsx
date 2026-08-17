"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Trip } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { PlaneLoader } from "@/components/ui/PlaneLoader";
import { UpcomingTripCard } from "@/components/trip/UpcomingTripCard";

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", tripDate: "", memo: "", companions: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // No token means we cannot possibly succeed — skip the API call and
    // go straight to the logout route (which clears the cookie + → /login).
    if (!sessionStorage.getItem("__firebase_token")) {
      window.location.href = "/api/logout";
      return;
    }
    loadTrips();
  }, []);

  async function loadTrips() {
    try {
      const data = await api.trips.list();
      setTrips(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("403") || msg.includes("401")) {
        setAuthError(true);
      } else {
        toast.error("旅行一覧の取得に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.trips.create({
        title: form.title,
        tripDate: form.tripDate || undefined,
        memo: form.memo || undefined,
        companions: form.companions ? Number(form.companions) : undefined,
      });
      toast.success("旅行を作成しました");
      setShowForm(false);
      setForm({ title: "", tripDate: "", memo: "", companions: "" });
      loadTrips();
    } catch {
      toast.error("旅行の作成に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tripId: number) {
    if (!confirm("この旅行を削除しますか？")) return;
    try {
      await api.trips.delete(tripId);
      toast.success("旅行を削除しました");
      setTrips(trips.filter((t) => t.tripId !== tripId));
    } catch {
      toast.error("削除に失敗しました");
    }
  }

  async function handleToggleComplete(trip: Trip) {
    try {
      const nextCompleted = !trip.isCompleted;
      await api.trips.update(trip.tripId, { isCompleted: nextCompleted });
      toast.success(nextCompleted ? "旅行を完了に設定しました" : "旅行を未完了に戻しました");
      setTrips(trips.map((t) => (t.tripId === trip.tripId ? { ...t, isCompleted: nextCompleted } : t)));
    } catch {
      toast.error("更新に失敗しました");
    }
  }

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <p className="text-muted-foreground">セッションが切れました。ログインし直してください。</p>
        <a
          href="/api/logout"
          className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          ログインページへ
        </a>
      </div>
    );
  }

  if (loading) {
    return <PlaneLoader text="旅行計画を読み込んでいます..." />;
  }

  return (
    <div>
      {/* 直近の旅行 */}
      <UpcomingTripCard trips={trips} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">旅行一覧</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          ＋ 新しい旅行
        </button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">新しい旅行を作成</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">旅行名 *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="例: 東京旅行" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">旅行日</label>
                <input type="date" value={form.tripDate} onChange={(e) => setForm({ ...form, tripDate: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">同行者数</label>
                <input type="number" min="0" value={form.companions} onChange={(e) => setForm({ ...form, companions: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">メモ</label>
                <textarea value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  rows={3} placeholder="旅行のメモ..." />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                  キャンセル
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {saving ? "作成中..." : "作成する"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trip Cards */}
      {trips.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-6xl mb-4">🗺️</div>
          <p className="text-lg">旅行がまだありません</p>
          <p className="text-sm mt-1">「新しい旅行」から作成してください</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <div key={trip.tripId}
              className={`rounded-xl border shadow-sm hover:shadow-md transition-all p-5 group flex flex-col justify-between ${
                trip.isCompleted ? "bg-muted/40 border-muted text-muted-foreground" : "bg-white border-border"
              }`}>
              <div>
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/trips/${trip.tripId}`}
                      className={`text-lg font-semibold transition-colors line-clamp-1 ${
                        trip.isCompleted ? "line-through text-muted-foreground hover:text-foreground" : "text-foreground hover:text-primary"
                      }`}>
                      {trip.title}
                    </Link>
                    {trip.isCompleted && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-md">
                        ✓ 完了
                      </span>
                    )}
                  </div>
                  <button onClick={() => handleDelete(trip.tripId)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all text-sm shrink-0">
                    削除
                  </button>
                </div>
                {trip.tripDate && (
                  <p className="text-sm text-muted-foreground mb-1">
                    📅 {formatDate(trip.tripDate)}
                  </p>
                )}
                {trip.companions !== undefined && trip.companions !== null && (
                  <p className="text-sm text-muted-foreground mb-1">
                    👥 {trip.companions}名
                  </p>
                )}
                {trip.memo && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {trip.memo}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                <button
                  onClick={() => handleToggleComplete(trip)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                    trip.isCompleted
                      ? "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  {trip.isCompleted ? "未完了に戻す" : "✓ 完了にする"}
                </button>
                <Link href={`/trips/${trip.tripId}`}
                  className="text-sm text-primary font-medium hover:underline">
                  詳細を見る →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
