"use client";

import { useEffect, useState } from "react";
import { api, type Accommodation, type ScheduleItem } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { PlaneLoader } from "@/components/ui/PlaneLoader";
import { DatePicker } from "@/components/ui/DateTimePicker";

interface Props { tripId: number; }

const emptyForm = () => ({
  accommodationName: "", address: "", checkIn: "", checkOut: "", reservationNumber: "",
});

export function AccommodationTab({ tripId }: Props) {
  const [items, setItems] = useState<Accommodation[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
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
    try {
      const [accommodationItems, schedules] = await Promise.all([
        api.accommodation.list(tripId),
        api.schedule.list(tripId),
      ]);
      setItems(accommodationItems);
      setScheduleItems(schedules.filter((item) => item.scheduleType === "accommodation"));
    }
    catch { toast.error("宿泊情報の取得に失敗しました"); }
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.accommodation.create(tripId, {
        accommodationName: form.accommodationName || undefined,
        address: form.address || undefined,
        checkIn: form.checkIn || undefined,
        checkOut: form.checkOut || undefined,
        reservationNumber: form.reservationNumber || undefined,
      });
      toast.success("宿泊情報を追加しました");
      setShowForm(false);
      setForm(emptyForm());
      await load();
    } catch { toast.error("追加に失敗しました"); }
    finally { setSaving(false); }
  }

  function startEdit(item: Accommodation) {
    setEditId(item.accommodationId);
    setEditForm({
      accommodationName: item.accommodationName ?? "",
      address: item.address ?? "",
      checkIn: item.checkIn ?? "",
      checkOut: item.checkOut ?? "",
      reservationNumber: item.reservationNumber ?? "",
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editId == null) return;
    setEditSaving(true);
    try {
      await api.accommodation.update(tripId, editId, {
        accommodationName: editForm.accommodationName || undefined,
        address: editForm.address || undefined,
        checkIn: editForm.checkIn || undefined,
        checkOut: editForm.checkOut || undefined,
        reservationNumber: editForm.reservationNumber || undefined,
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
      await api.accommodation.delete(tripId, id);
      toast.success("削除しました");
      setItems(items.filter(i => i.accommodationId !== id));
    } catch { toast.error("削除に失敗しました"); }
  }

  if (loading) return <PlaneLoader text="読み込み中..." className="py-6" />;

  const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">宿泊情報</h3>
        <button onClick={() => { setShowForm(true); setEditId(null); }}
          className="text-sm px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90">
          ＋ 追加
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="space-y-2 mb-4 p-3 bg-muted/30 rounded-lg">
          <input value={form.accommodationName}
            onChange={(e) => setForm({ ...form, accommodationName: e.target.value })}
            className={inputCls} placeholder="宿泊施設名" />
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={inputCls} placeholder="住所" />
          <div className="grid grid-cols-2 gap-2">
            <DatePicker label="チェックイン" value={form.checkIn}
              onChange={(v) => setForm({ ...form, checkIn: v })} />
            <DatePicker label="チェックアウト" value={form.checkOut}
              onChange={(v) => setForm({ ...form, checkOut: v })} />
          </div>
          <input value={form.reservationNumber}
            onChange={(e) => setForm({ ...form, reservationNumber: e.target.value })}
            className={inputCls} placeholder="予約番号" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted">キャンセル</button>
            <button type="submit" disabled={saving}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.accommodationId} className="rounded-lg border border-border/70 bg-muted/20 overflow-hidden">
              {editId === item.accommodationId ? (
                /* Edit form */
                <form onSubmit={handleUpdate} className="space-y-2 p-3">
                  <input value={editForm.accommodationName}
                    onChange={(e) => setEditForm({ ...editForm, accommodationName: e.target.value })}
                    className={inputCls} placeholder="宿泊施設名" />
                  <input value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className={inputCls} placeholder="住所" />
                  <div className="grid grid-cols-2 gap-2">
                    <DatePicker label="チェックイン" value={editForm.checkIn}
                      onChange={(v) => setEditForm({ ...editForm, checkIn: v })} />
                    <DatePicker label="チェックアウト" value={editForm.checkOut}
                      onChange={(v) => setEditForm({ ...editForm, checkOut: v })} />
                  </div>
                  <input value={editForm.reservationNumber}
                    onChange={(e) => setEditForm({ ...editForm, reservationNumber: e.target.value })}
                    className={inputCls} placeholder="予約番号" />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setEditId(null)}
                      className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted">キャンセル</button>
                    <button type="submit" disabled={editSaving}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
                      {editSaving ? "保存中..." : "保存"}
                    </button>
                  </div>
                </form>
              ) : (
                /* Display */
                <div className="p-3 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.accommodationName || "—"}</p>
                    {item.address && <p className="text-xs text-muted-foreground mt-0.5">📍 {item.address}</p>}
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      {item.checkIn && <span>IN: {formatDate(item.checkIn)}</span>}
                      {item.checkOut && <span>OUT: {formatDate(item.checkOut)}</span>}
                    </div>
                    {item.reservationNumber && (
                      <p className="text-xs text-muted-foreground mt-0.5">予約番号: {item.reservationNumber}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <button onClick={() => startEdit(item)}
                      className="text-xs text-muted-foreground hover:text-primary">編集</button>
                    <button onClick={() => handleDelete(item.accommodationId)}
                      className="text-xs text-muted-foreground hover:text-destructive">削除</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {scheduleItems.length > 0 ? (
        <div className={`${items.length > 0 ? "mt-5 pt-4 border-t border-border/60" : ""}`}>
          <p className="text-xs font-semibold text-muted-foreground mb-2">🗓️ スケジュールから</p>
          <div className="space-y-2">
            {scheduleItems.map((item) => (
              <div key={item.scheduleId} className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                <p className="font-medium text-sm truncate">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                )}
                {item.location && (
                  <p className="text-xs text-muted-foreground mt-0.5">📍 {item.location}</p>
                )}
                {(item.startTime || item.endTime) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.startTime && `開始: ${new Date(item.startTime).toLocaleString("ja-JP")}`}
                    {item.startTime && item.endTime && " / "}
                    {item.endTime && `終了: ${new Date(item.endTime).toLocaleString("ja-JP")}`}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">編集・削除はスケジュールタブから</p>
              </div>
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">宿泊情報がありません</p>
      ) : null}
    </div>
  );
}
