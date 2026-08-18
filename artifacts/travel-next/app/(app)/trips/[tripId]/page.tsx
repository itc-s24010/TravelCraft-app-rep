"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, type Trip, type Summary, type Category, type MemberDetail } from "@/lib/api";
import { formatCurrency, formatDate, calcStayLabel } from "@/lib/utils";
import { toast } from "sonner";
import { BudgetTab } from "@/components/trip/BudgetTab";
import { BudgetPieChart } from "@/components/trip/BudgetPieChart";
import { ExpenseTab } from "@/components/trip/ExpenseTab";
import { TransportationTab } from "@/components/trip/TransportationTab";
import { AccommodationTab } from "@/components/trip/AccommodationTab";
import { NotificationTab } from "@/components/trip/NotificationTab";
import { ScheduleTab } from "@/components/trip/ScheduleTab";
import { TripChecklist } from "@/components/trip/TripChecklist";
import { PlaneLoader } from "@/components/ui/PlaneLoader";

const ALL_TABS = [
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
  const [editForm, setEditForm] = useState({ title: "", startDate: "", endDate: "", companions: "", memo: "" });
  const [saving, setSaving] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [creatingShare, setCreatingShare] = useState(false);

  // Member removal state
  const [memberToRemove, setMemberToRemove] = useState<MemberDetail | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

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
      startDate: trip.startDate ?? trip.tripDate ?? "",
      endDate: trip.endDate ?? trip.startDate ?? trip.tripDate ?? "",
      companions: trip.companions != null ? String(trip.companions) : "",
      memo: trip.memo ?? "",
    });
    setIsEditing(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editForm.endDate && editForm.startDate && editForm.endDate < editForm.startDate) {
      toast.error("終了日は開始日以降に設定してください");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.trips.update(id, {
        title: editForm.title || undefined,
        startDate: editForm.startDate || undefined,
        endDate: editForm.endDate || undefined,
        tripDate: editForm.startDate || undefined,
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

  async function toggleComplete() {
    if (!trip) return;
    try {
      const nextState = !trip.isCompleted;
      const updated = await api.trips.update(id, { isCompleted: nextState });
      setTrip(updated);
      toast.success(nextState ? "旅行を完了に設定しました" : "旅行を未完了に戻しました");
    } catch {
      toast.error("更新に失敗しました");
    }
  }

  async function confirmRemoveMember() {
    if (!memberToRemove) return;
    setRemovingMember(true);
    try {
      await api.trips.removeMember(id, memberToRemove.userId);
      // Reload the trip so companionNames, memberDetails, etc. are all consistent
      const updated = await api.trips.get(id);
      setTrip(updated);
      toast.success(`${memberToRemove.displayName} を旅行から外しました`);
    } catch {
      toast.error("メンバーの削除に失敗しました");
    } finally {
      setRemovingMember(false);
      setMemberToRemove(null);
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
    return <PlaneLoader text="詳細情報を読み込んでいます..." />;
  }

  if (!trip) return <div className="text-center py-20">旅行が見つかりません</div>;

  const stayLabel = calcStayLabel(trip.startDate ?? trip.tripDate, trip.endDate ?? trip.startDate ?? trip.tripDate);
  const hasDateRange = trip.startDate && trip.endDate && trip.startDate !== trip.endDate;
  const visibleTabs = ALL_TABS;

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
        <div className="flex items-start justify-between mb-2 gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{trip.title}</h1>
            {trip.isCompleted && (
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 rounded-full">
                ✓ 完了
              </span>
            )}
            {stayLabel && (
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                {stayLabel}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={toggleComplete}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                trip.isCompleted
                  ? "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              }`}>
              {trip.isCompleted ? "未完了に戻す" : "✓ 完了にする"}
            </button>
            {trip.isOwner !== false && (
              <button onClick={openShare}
                className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                ↗ 共有
              </button>
            )}
            <button onClick={startEdit}
              className="text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors">
              ✏️ 編集
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {hasDateRange ? (
            <span>📅 {formatDate(trip.startDate)} 〜 {formatDate(trip.endDate)}</span>
          ) : (trip.startDate || trip.tripDate) ? (
            <span>📅 {formatDate(trip.startDate ?? trip.tripDate)}</span>
          ) : null}
          {!trip.companionNames?.length && trip.companions != null && (
            <span>👥 {trip.companions}名</span>
          )}
        </div>

        {/* メンバー表示 */}
        {(() => {
          const ownerName = trip.companionNames?.[0];
          const hasParticipants = ownerName || (trip.memberDetails && trip.memberDetails.length > 0);
          if (!hasParticipants) return null;
          const CHIP_COLORS = [
            "bg-primary/10 text-primary",
            "bg-emerald-100 text-emerald-700",
            "bg-violet-100 text-violet-700",
            "bg-amber-100 text-amber-700",
            "bg-rose-100 text-rose-700",
            "bg-cyan-100 text-cyan-700",
          ];
          return (
            <div className="flex flex-wrap gap-2 mt-3">
              {/* Owner chip — always index 0, no remove button */}
              {ownerName && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${CHIP_COLORS[0]}`}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-current/20"
                    style={{ fontSize: "10px", lineHeight: 1 }}>
                    {ownerName.trim().charAt(0).toUpperCase()}
                  </span>
                  {ownerName}
                </span>
              )}
              {/* Member chips — keyed by userId so duplicates names are handled correctly */}
              {trip.memberDetails?.map((member, i) => {
                const color = CHIP_COLORS[(i + 1) % CHIP_COLORS.length];
                const initial = member.displayName.trim().charAt(0).toUpperCase();
                return (
                  <span key={member.userId} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-current/20"
                      style={{ fontSize: "10px", lineHeight: 1 }}>
                      {initial}
                    </span>
                    {member.displayName}
                    {trip.isOwner !== false && (
                      <button
                        onClick={() => setMemberToRemove(member)}
                        className="ml-0.5 leading-none opacity-60 hover:opacity-100 transition-opacity"
                        title={`${member.displayName} を外す`}
                        aria-label={`${member.displayName} を旅行から外す`}
                      >
                        ×
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          );
        })()}

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

      {/* Member Remove Confirmation Dialog */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <h2 className="font-semibold text-lg mb-2">メンバーを外す</h2>
            <p className="text-sm text-muted-foreground mb-5">
              <span className="font-medium text-foreground">{memberToRemove.displayName}</span> をこの旅行から外しますか？
              再び参加するには共有リンクが必要です。
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setMemberToRemove(null)}
                disabled={removingMember}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
                キャンセル
              </button>
              <button
                onClick={confirmRemoveMember}
                disabled={removingMember}
                className="px-4 py-2 bg-destructive text-white rounded-lg text-sm hover:bg-destructive/90 disabled:opacity-50">
                {removingMember ? "削除中..." : "外す"}
              </button>
            </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">開始日</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">終了日</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    min={editForm.startDate || undefined}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              {editForm.startDate && editForm.endDate && (
                <p className="text-xs text-primary font-medium -mt-1">
                  📅 {calcStayLabel(editForm.startDate, editForm.endDate)}
                </p>
              )}
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
        {visibleTabs.map((tab) => (
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
          {/* Left column: trip info + checklist */}
          <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-border p-4">
            <h3 className="font-semibold mb-2 text-secondary">旅行情報</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">旅行名</dt>
                <dd className="font-medium">{trip.title}</dd>
              </div>
              {hasDateRange ? (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">開始日</dt>
                    <dd>{formatDate(trip.startDate)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">終了日</dt>
                    <dd>{formatDate(trip.endDate)}</dd>
                  </div>
                  {stayLabel && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">日程</dt>
                      <dd className="font-semibold text-primary">{stayLabel}</dd>
                    </div>
                  )}
                </>
              ) : (trip.startDate || trip.tripDate) ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">日付</dt>
                  <dd>{formatDate(trip.startDate ?? trip.tripDate)}</dd>
                </div>
              ) : null}
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
          {/* Checklist */}
          <TripChecklist tripId={id} />
          </div>{/* end left column */}

          {/* Right column: category breakdown */}
          {summary && (
            <div className="bg-white rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-3 text-secondary">カテゴリ別支出</h3>
              <BudgetPieChart
                breakdown={summary.categoryBreakdown}
                categories={categories}
                onColorChange={async (categoryId, color) => {
                  const updated = await api.categories.updateColor(categoryId, color);
                  setCategories((prev) =>
                    prev.map((c) => (c.categoryId === updated.categoryId ? updated : c))
                  );
                }}
              />
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
