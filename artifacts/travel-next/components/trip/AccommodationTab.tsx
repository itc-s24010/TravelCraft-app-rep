"use client";

import { useEffect, useState } from "react";
import { api, type Accommodation } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Props { tripId: number; }

const emptyForm = () => ({
  accommodationName: "", address: "", checkIn: "", checkOut: "", reservationNumber: "",
});

export function AccommodationTab({ tripId }: Props) {
  const [items, setItems] = useState<Accommodation[]>([]);
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
    try { setItems(await api.accommodation.list(tripId)); }
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

  if (loading) return <div className="py-8 text-center text-muted-foreground">読み込み中...</div>;

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
            <div>
              <label className="block text-xs text-muted-foreground mb-1">チェックイン</label>
              <input type="date" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">チェックアウト</label>
              <input type="date" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                className={inputCls} />
            </div>
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

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">宿泊情報がありません</p>
      ) : (
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
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">チェックイン</label>
                      <input type="date" value={editForm.checkIn}
                        onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">チェックアウト</label>
                      <input type="date" value={editForm.checkOut}
                        onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
                        className={inputCls} />
                    </div>
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
    </div>
  );
}
