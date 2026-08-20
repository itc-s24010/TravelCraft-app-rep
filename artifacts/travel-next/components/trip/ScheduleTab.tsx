"use client";

import { useEffect, useState } from "react";
import { api, type ScheduleItem } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { PlaneLoader } from "@/components/ui/PlaneLoader";
import { DateTimePicker } from "@/components/ui/DateTimePicker";

interface Props { tripId: number; }

const emptyForm = () => ({
  title: "", description: "", scheduleType: "", location: "",
  startTime: "", endTime: "", cost: "",
});

function toScheduleType(value: string): NonNullable<ScheduleItem["scheduleType"]> | undefined {
  return value === "transportation" || value === "accommodation" || value === "other"
    ? value
    : undefined;
}

/** "2026-07-09T09:00:00Z" → "7/9" */
function toDateLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** "2026-07-09T09:00:00Z" → "09:00" */
function toTimeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

/** Group items by date string (yyyy-MM-dd) */
function groupByDate(items: ScheduleItem[]): [string, ScheduleItem[]][] {
  const map = new Map<string, ScheduleItem[]>();
  for (const item of items) {
    const key = item.startTime
      ? new Date(item.startTime).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
      : "日付未定";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries());
}

const DOT_COLORS = [
  "bg-primary", "bg-secondary", "bg-purple-500",
  "bg-pink-500", "bg-amber-500", "bg-emerald-500",
];

export function ScheduleTab({ tripId }: Props) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm());
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { load(); }, [tripId]);

  async function load() {
    try { setItems(await api.schedule.list(tripId)); }
    catch { toast.error("スケジュールの取得に失敗しました"); }
    finally { setLoading(false); }
  }

  function handleCreateStartTimeChange(value: string) {
    setForm((current) => {
      const startDate = value.slice(0, 10);
      const currentStartDate = current.startTime.slice(0, 10);
      const currentEndDate = current.endTime.slice(0, 10);

      return {
        ...current,
        startTime: value,
        endTime: startDate && (startDate !== currentStartDate || !currentEndDate)
          ? `${startDate}T${current.endTime.slice(11, 16) || "00:00"}`
          : current.endTime,
      };
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) { toast.error("タイトルを入力してください"); return; }
    setSaving(true);
    try {
      await api.schedule.create(tripId, {
        title: form.title,
        description: form.description || undefined,
        scheduleType: toScheduleType(form.scheduleType),
        location: form.location || undefined,
        startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
        endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
        cost: form.cost ? Number(form.cost) : undefined,
      });
      toast.success("スケジュールを追加しました");
      setShowForm(false);
      setForm(emptyForm());
      await load();
    } catch { toast.error("追加に失敗しました"); }
    finally { setSaving(false); }
  }

  function startEdit(item: ScheduleItem) {
    setEditId(item.scheduleId);
    setEditForm({
      title: item.title ?? "",
      description: item.description ?? "",
      scheduleType: item.scheduleType ?? "",
      location: item.location ?? "",
      startTime: item.startTime ? new Date(item.startTime).toISOString().slice(0, 16) : "",
      endTime: item.endTime ? new Date(item.endTime).toISOString().slice(0, 16) : "",
      cost: item.cost != null ? String(item.cost) : "",
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editId == null) return;
    setEditSaving(true);
    try {
      await api.schedule.update(tripId, editId, {
        title: editForm.title || undefined,
        description: editForm.description || undefined,
        scheduleType: toScheduleType(editForm.scheduleType) ?? null,
        location: editForm.location || undefined,
        startTime: editForm.startTime ? new Date(editForm.startTime).toISOString() : undefined,
        endTime: editForm.endTime ? new Date(editForm.endTime).toISOString() : undefined,
        cost: editForm.cost ? Number(editForm.cost) : undefined,
      });
      toast.success("更新しました");
      setEditId(null);
      await load();
    } catch { toast.error("更新に失敗しました"); }
    finally { setEditSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("削除しますか？")) return;
    try {
      await api.schedule.delete(tripId, id);
      toast.success("削除しました");
      setItems(items.filter(i => i.scheduleId !== id));
    } catch { toast.error("削除に失敗しました"); }
  }

  if (loading) return <PlaneLoader text="読み込み中..." className="py-6" />;

  const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  const groups = groupByDate(items);
  let colorIndex = 0;

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold">タイムスケジュール</h3>
        <button
          onClick={() => { setShowForm(true); setEditId(null); }}
          className="text-sm px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          ＋ 追加
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6 p-4 bg-muted/30 rounded-xl border border-border/60">
          <p className="text-sm font-medium mb-3">新しいスケジュール</p>
          <form onSubmit={handleCreate} className="space-y-2">
            <input
              required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls} placeholder="タイトル（例：浅草観光）" />
            <select
              value={form.scheduleType}
              onChange={(e) => setForm({ ...form, scheduleType: e.target.value })}
              className={inputCls}
            >
              <option value="">種別（未分類）</option>
              <option value="transportation">交通</option>
              <option value="accommodation">宿泊</option>
              <option value="other">その他</option>
            </select>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputCls} placeholder="メモ・詳細（例：食べ歩き、人力車）" />
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputCls} placeholder="場所" />
            <div className="grid grid-cols-2 gap-2">
              <DateTimePicker label="開始日時" value={form.startTime}
                onChange={handleCreateStartTimeChange} />
              <DateTimePicker label="終了日時" value={form.endTime}
                onChange={(v) => setForm({ ...form, endTime: v })} />
            </div>
            <input
              type="number" min="0" value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              className={inputCls} placeholder="費用 (¥)" />
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted">
                キャンセル
              </button>
              <button type="submit" disabled={saving}
                className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline */}
      {items.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-3xl mb-2">🗓️</p>
          <p className="text-sm text-muted-foreground">スケジュールがありません</p>
          <p className="text-xs text-muted-foreground mt-1">「＋ 追加」からスケジュールを登録してください</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([dateLabel, groupItems]) => (
            <div key={dateLabel}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {dateLabel}
                </span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              {/* Items in this date group */}
              <div className="relative pl-6">
                {/* Vertical timeline line */}
                <div className="absolute left-2 top-2 bottom-2 w-px bg-border/50" />

                <div className="space-y-3">
                  {groupItems.map((item) => {
                    const dotColor = DOT_COLORS[colorIndex++ % DOT_COLORS.length];
                    return (
                      <div key={item.scheduleId} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-4 top-3.5 w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-white`} />

                        {editId === item.scheduleId ? (
                          /* Edit form inline */
                          <div className="ml-1 p-3 bg-muted/30 rounded-xl border border-border/60">
                            <form onSubmit={handleUpdate} className="space-y-2">
                              <input required value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className={inputCls} placeholder="タイトル" />
                              <select
                                value={editForm.scheduleType}
                                onChange={(e) => setEditForm({ ...editForm, scheduleType: e.target.value })}
                                className={inputCls}
                              >
                                <option value="">種別（未分類）</option>
                                <option value="transportation">交通</option>
                                <option value="accommodation">宿泊</option>
                                <option value="other">その他</option>
                              </select>
                              <input value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className={inputCls} placeholder="メモ・詳細" />
                              <input value={editForm.location}
                                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                className={inputCls} placeholder="場所" />
                              <div className="grid grid-cols-2 gap-2">
                                <DateTimePicker label="開始日時" value={editForm.startTime}
                                  onChange={(v) => setEditForm({ ...editForm, startTime: v })} />
                                <DateTimePicker label="終了日時" value={editForm.endTime}
                                  onChange={(v) => setEditForm({ ...editForm, endTime: v })} />
                              </div>
                              <input type="number" min="0" value={editForm.cost}
                                onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                                className={inputCls} placeholder="費用 (¥)" />
                              <div className="flex gap-2 justify-end">
                                <button type="button" onClick={() => setEditId(null)}
                                  className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted">
                                  キャンセル
                                </button>
                                <button type="submit" disabled={editSaving}
                                  className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
                                  {editSaving ? "保存中..." : "保存"}
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          /* Display card */
                          <div className="ml-1 group p-3 rounded-xl border border-border/60 bg-white hover:border-primary/30 hover:shadow-sm transition-all">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                {item.startTime && (
                                  <p className="text-xs text-muted-foreground mb-0.5">
                                    🕐 {toTimeLabel(item.startTime)}
                                    {item.endTime && ` → ${toTimeLabel(item.endTime)}`}
                                  </p>
                                )}
                                <p className="font-medium text-sm truncate">{item.title}</p>
                                {item.scheduleType && (
                                  <span className="inline-block text-[11px] bg-primary/10 text-primary rounded-full px-2 py-0.5 mt-1">
                                    {item.scheduleType === "transportation" ? "交通" :
                                     item.scheduleType === "accommodation" ? "宿泊" : "その他"}
                                  </span>
                                )}
                                {item.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                                )}
                                {item.location && (
                                  <p className="text-xs text-muted-foreground mt-0.5">📍 {item.location}</p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                {item.cost != null && (
                                  <span className="text-sm font-bold text-primary">{formatCurrency(Number(item.cost))}</span>
                                )}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => startEdit(item)}
                                    className="text-xs text-muted-foreground hover:text-primary">編集</button>
                                  <button onClick={() => handleDelete(item.scheduleId)}
                                    className="text-xs text-muted-foreground hover:text-destructive">削除</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
