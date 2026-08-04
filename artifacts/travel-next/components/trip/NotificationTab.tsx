"use client";

import { useEffect, useState } from "react";
import { api, type Notification } from "@/lib/api";
import { toast } from "sonner";

interface Props { tripId: number; }

const TYPES = ["出発リマインダー", "チェックイン", "チェックアウト", "フライト", "その他"];

export function NotificationTab({ tripId }: Props) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reminder: "", notificationDatetime: "", notificationType: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [tripId]);

  async function load() {
    try { setItems(await api.notifications.list(tripId)); }
    catch { toast.error("通知の取得に失敗しました"); }
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.notifications.create(tripId, {
        reminder: form.reminder || undefined,
        notificationDatetime: form.notificationDatetime ? new Date(form.notificationDatetime).toISOString() : undefined,
        notificationType: form.notificationType || undefined,
      });
      toast.success("通知を追加しました");
      setShowForm(false);
      setForm({ reminder: "", notificationDatetime: "", notificationType: "" });
      await load();
    } catch { toast.error("追加に失敗しました"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("削除しますか？")) return;
    try {
      await api.notifications.delete(tripId, id);
      toast.success("削除しました");
      setItems(items.filter(i => i.notificationId !== id));
    } catch { toast.error("削除に失敗しました"); }
  }

  if (loading) return <div className="py-8 text-center text-muted-foreground">読み込み中...</div>;

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">通知・リマインダー</h3>
        <button onClick={() => setShowForm(true)}
          className="text-sm px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90">
          ＋ 追加
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-2 mb-4 p-3 bg-muted/30 rounded-lg">
          <select value={form.notificationType} onChange={(e) => setForm({ ...form, notificationType: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">通知タイプ</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <textarea value={form.reminder} onChange={(e) => setForm({ ...form, reminder: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={2} placeholder="リマインダーメッセージ" />
          <div>
            <label className="block text-xs text-muted-foreground mb-1">通知日時</label>
            <input type="datetime-local" value={form.notificationDatetime}
              onChange={(e) => setForm({ ...form, notificationDatetime: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
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
        <p className="text-sm text-muted-foreground text-center py-4">通知がありません</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.notificationId} className="p-3 rounded-lg border border-border/70 bg-muted/20">
              <div className="flex items-start justify-between">
                <div>
                  {item.notificationType && (
                    <span className="inline-block text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full mb-1">
                      {item.notificationType}
                    </span>
                  )}
                  {item.reminder && <p className="text-sm">{item.reminder}</p>}
                  {item.notificationDatetime && (
                    <p className="text-xs text-muted-foreground mt-1">
                      🔔 {new Date(item.notificationDatetime).toLocaleString("ja-JP")}
                    </p>
                  )}
                </div>
                <button onClick={() => handleDelete(item.notificationId)}
                  className="text-xs text-muted-foreground hover:text-destructive">削除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
