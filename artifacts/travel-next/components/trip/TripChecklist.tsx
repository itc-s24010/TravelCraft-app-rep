"use client";

import { useEffect, useRef, useState } from "react";
import { api, type ChecklistItem } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  tripId: number;
}

export function TripChecklist({ tripId }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.checklist.list(tripId)
      .then(setItems)
      .catch(() => toast.error("チェックリストの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [tripId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    setAdding(true);
    try {
      const item = await api.checklist.create(tripId, { label });
      setItems((prev) => [...prev, item]);
      setNewLabel("");
      inputRef.current?.focus();
    } catch {
      toast.error("追加に失敗しました");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(item: ChecklistItem) {
    try {
      const updated = await api.checklist.update(tripId, item.itemId, { isDone: !item.isDone });
      setItems((prev) => prev.map((i) => (i.itemId === updated.itemId ? updated : i)));
    } catch {
      toast.error("更新に失敗しました");
    }
  }

  async function handleDelete(item: ChecklistItem) {
    try {
      await api.checklist.delete(tripId, item.itemId);
      setItems((prev) => prev.filter((i) => i.itemId !== item.itemId));
    } catch {
      toast.error("削除に失敗しました");
    }
  }

  const done = items.filter((i) => i.isDone).length;
  const total = items.length;

  return (
    <div className="bg-white rounded-xl border border-border p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-secondary">✅ 準備チェックリスト</h3>
        {total > 0 && (
          <span className="text-xs text-muted-foreground font-medium">
            {done} / {total} 完了
          </span>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      )}

      {/* Items */}
      {loading ? (
        <p className="text-xs text-muted-foreground py-2">読み込み中...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">
          パスポート・予約確認など、準備項目を追加しましょう
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.itemId} className="flex items-center gap-2 group">
              <button
                onClick={() => handleToggle(item)}
                className={`flex-shrink-0 w-4 h-4 rounded border transition-colors ${
                  item.isDone
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-border hover:border-primary"
                }`}
                aria-label={item.isDone ? "未完了に戻す" : "完了にする"}
              >
                {item.isDone && (
                  <svg viewBox="0 0 12 12" fill="none" className="w-full h-full p-0.5">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span
                className={`flex-1 text-sm leading-snug transition-colors ${
                  item.isDone ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {item.label}
              </span>
              <button
                onClick={() => handleDelete(item)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive text-xs px-1"
                aria-label="削除"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 pt-1 border-t border-border">
        <input
          ref={inputRef}
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="項目を追加..."
          className="flex-1 min-w-0 text-sm px-2 py-1.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
          disabled={adding}
        />
        <button
          type="submit"
          disabled={adding || !newLabel.trim()}
          className="shrink-0 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          追加
        </button>
      </form>
    </div>
  );
}
