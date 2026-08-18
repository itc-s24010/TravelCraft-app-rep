"use client";

import { useEffect, useState } from "react";
import { api, type Transportation } from "@/lib/api";
import { toast } from "sonner";
import { PlaneLoader } from "@/components/ui/PlaneLoader";
import { formatCurrency } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/DateTimePicker";

interface Props { tripId: number; }

const TYPES = ["飛行機", "電車", "バス", "車", "船", "その他"];

const emptyForm = () => ({
  transportationType: "", departurePlace: "", arrivalPlace: "",
  departureTime: "", arrivalTime: "", fare: "",
});

export function TransportationTab({ tripId }: Props) {
  const [items, setItems] = useState<Transportation[]>([]);
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
    try { setItems(await api.transportation.list(tripId)); }
    catch { toast.error("交通情報の取得に失敗しました"); }
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.transportation.create(tripId, {
        transportationType: form.transportationType || undefined,
        departurePlace: form.departurePlace || undefined,
        arrivalPlace: form.arrivalPlace || undefined,
        departureTime: form.departureTime ? new Date(form.departureTime).toISOString() : undefined,
        arrivalTime: form.arrivalTime ? new Date(form.arrivalTime).toISOString() : undefined,
        fare: form.fare ? Number(form.fare) : undefined,
      });
      toast.success("交通情報を追加しました");
      setShowForm(false);
      setForm(emptyForm());
      await load();
    } catch { toast.error("追加に失敗しました"); }
    finally { setSaving(false); }
  }

  function startEdit(item: Transportation) {
    setEditId(item.transportationId);
    setEditForm({
      transportationType: item.transportationType ?? "",
      departurePlace: item.departurePlace ?? "",
      arrivalPlace: item.arrivalPlace ?? "",
      departureTime: item.departureTime ? item.departureTime.slice(0, 16) : "",
      arrivalTime: item.arrivalTime ? item.arrivalTime.slice(0, 16) : "",
      fare: item.fare != null ? String(item.fare) : "",
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editId == null) return;
    setEditSaving(true);
    try {
      await api.transportation.update(tripId, editId, {
        transportationType: editForm.transportationType || undefined,
        departurePlace: editForm.departurePlace || undefined,
        arrivalPlace: editForm.arrivalPlace || undefined,
        departureTime: editForm.departureTime ? new Date(editForm.departureTime).toISOString() : undefined,
        arrivalTime: editForm.arrivalTime ? new Date(editForm.arrivalTime).toISOString() : undefined,
        fare: editForm.fare ? Number(editForm.fare) : undefined,
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
      await api.transportation.delete(tripId, id);
      toast.success("削除しました");
      setItems(items.filter(i => i.transportationId !== id));
    } catch { toast.error("削除に失敗しました"); }
  }

  if (loading) return <PlaneLoader text="読み込み中..." className="py-6" />;

  const inputCls = "px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">交通手段</h3>
        <button onClick={() => { setShowForm(true); setEditId(null); }}
          className="text-sm px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90">
          ＋ 追加
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
          <select value={form.transportationType} onChange={(e) => setForm({ ...form, transportationType: e.target.value })}
            className={inputCls}>
            <option value="">交通手段の種類</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={form.fare} onChange={(e) => setForm({ ...form, fare: e.target.value })}
            type="number" min="0" className={inputCls} placeholder="料金 (¥)" />
          <input value={form.departurePlace} onChange={(e) => setForm({ ...form, departurePlace: e.target.value })}
            className={inputCls} placeholder="出発地" />
          <input value={form.arrivalPlace} onChange={(e) => setForm({ ...form, arrivalPlace: e.target.value })}
            className={inputCls} placeholder="到着地" />
          <DateTimePicker label="出発日時" value={form.departureTime}
            onChange={(v) => setForm({ ...form, departureTime: v })} />
          <DateTimePicker label="到着日時" value={form.arrivalTime}
            onChange={(v) => setForm({ ...form, arrivalTime: v })} />
          <div className="col-span-2 flex gap-2 justify-end">
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
        <p className="text-sm text-muted-foreground text-center py-4">交通情報がありません</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.transportationId} className="rounded-lg border border-border/70 bg-muted/20 overflow-hidden">
              {editId === item.transportationId ? (
                /* Edit form */
                <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-2 p-3">
                  <select value={editForm.transportationType}
                    onChange={(e) => setEditForm({ ...editForm, transportationType: e.target.value })}
                    className={inputCls}>
                    <option value="">交通手段の種類</option>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input value={editForm.fare} onChange={(e) => setEditForm({ ...editForm, fare: e.target.value })}
                    type="number" min="0" className={inputCls} placeholder="料金 (¥)" />
                  <input value={editForm.departurePlace}
                    onChange={(e) => setEditForm({ ...editForm, departurePlace: e.target.value })}
                    className={inputCls} placeholder="出発地" />
                  <input value={editForm.arrivalPlace}
                    onChange={(e) => setEditForm({ ...editForm, arrivalPlace: e.target.value })}
                    className={inputCls} placeholder="到着地" />
                  <DateTimePicker label="出発日時" value={editForm.departureTime}
                    onChange={(v) => setEditForm({ ...editForm, departureTime: v })} />
                  <DateTimePicker label="到着日時" value={editForm.arrivalTime}
                    onChange={(v) => setEditForm({ ...editForm, arrivalTime: v })} />
                  <div className="col-span-2 flex gap-2 justify-end">
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
                    {item.transportationType && (
                      <span className="inline-block text-xs bg-secondary/10 text-secondary font-medium px-2 py-0.5 rounded-full mb-1">
                        {item.transportationType}
                      </span>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{item.departurePlace || "—"}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{item.arrivalPlace || "—"}</span>
                    </div>
                    {(item.departureTime || item.arrivalTime) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.departureTime && new Date(item.departureTime).toLocaleString("ja-JP")}
                        {item.departureTime && item.arrivalTime && " → "}
                        {item.arrivalTime && new Date(item.arrivalTime).toLocaleString("ja-JP")}
                      </p>
                    )}
                    {item.fare != null && (
                      <p className="text-xs text-primary font-bold mt-1">{formatCurrency(item.fare)}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <button onClick={() => startEdit(item)}
                      className="text-xs text-muted-foreground hover:text-primary">編集</button>
                    <button onClick={() => handleDelete(item.transportationId)}
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
