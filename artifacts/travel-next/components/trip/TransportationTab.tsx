"use client";

import { useEffect, useState } from "react";
import { api, type Transportation } from "@/lib/api";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface Props { tripId: number; }

const TYPES = ["飛行機", "電車", "バス", "車", "船", "その他"];

export function TransportationTab({ tripId }: Props) {
  const [items, setItems] = useState<Transportation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    transportationType: "", departurePlace: "", arrivalPlace: "",
    departureTime: "", arrivalTime: "", fare: "",
  });
  const [saving, setSaving] = useState(false);

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
      setForm({ transportationType: "", departurePlace: "", arrivalPlace: "", departureTime: "", arrivalTime: "", fare: "" });
      await load();
    } catch { toast.error("追加に失敗しました"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("削除しますか？")) return;
    try {
      await api.transportation.delete(tripId, id);
      toast.success("削除しました");
      setItems(items.filter(i => i.transportationId !== id));
    } catch { toast.error("削除に失敗しました"); }
  }

  if (loading) return <div className="py-8 text-center text-muted-foreground">読み込み中...</div>;

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">交通手段</h3>
        <button onClick={() => setShowForm(true)}
          className="text-sm px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90">
          ＋ 追加
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
          <select value={form.transportationType} onChange={(e) => setForm({ ...form, transportationType: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">交通手段の種類</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={form.fare} onChange={(e) => setForm({ ...form, fare: e.target.value })}
            type="number" min="0"
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="料金 (¥)" />
          <input value={form.departurePlace} onChange={(e) => setForm({ ...form, departurePlace: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="出発地" />
          <input value={form.arrivalPlace} onChange={(e) => setForm({ ...form, arrivalPlace: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="到着地" />
          <input type="datetime-local" value={form.departureTime}
            onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input type="datetime-local" value={form.arrivalTime}
            onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
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
            <div key={item.transportationId} className="p-3 rounded-lg border border-border/70 bg-muted/20">
              <div className="flex items-start justify-between">
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
                  {item.fare != null && (
                    <p className="text-xs text-primary font-bold mt-1">{formatCurrency(item.fare)}</p>
                  )}
                </div>
                <button onClick={() => handleDelete(item.transportationId)}
                  className="text-xs text-muted-foreground hover:text-destructive">削除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
