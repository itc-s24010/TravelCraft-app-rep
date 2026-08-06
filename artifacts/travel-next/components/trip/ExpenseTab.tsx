"use client";

import { useEffect, useState } from "react";
import { api, type Expense, type Category } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Props { tripId: number; categories: Category[]; onRefresh: () => void; }

const emptyForm = () => ({ categoryId: "", expenseAmount: "", expenseDate: "", paymentMethod: "" });

export function ExpenseTab({ tripId, categories, onRefresh }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
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
    try { setExpenses(await api.expenses.list(tripId)); }
    catch { toast.error("支出の取得に失敗しました"); }
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.expenses.create(tripId, {
        categoryId: Number(form.categoryId),
        expenseAmount: Number(form.expenseAmount),
        expenseDate: form.expenseDate || undefined,
        paymentMethod: form.paymentMethod || undefined,
      });
      toast.success("支出を追加しました");
      setShowForm(false);
      setForm(emptyForm());
      await load();
      onRefresh();
    } catch { toast.error("支出の追加に失敗しました"); }
    finally { setSaving(false); }
  }

  function startEdit(expense: Expense) {
    setEditId(expense.expenseId);
    setEditForm({
      categoryId: String(expense.category?.categoryId ?? expense.categoryId ?? ""),
      expenseAmount: String(expense.expenseAmount ?? ""),
      expenseDate: expense.expenseDate ?? "",
      paymentMethod: expense.paymentMethod ?? "",
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editId == null) return;
    setEditSaving(true);
    try {
      await api.expenses.update(tripId, editId, {
        categoryId: Number(editForm.categoryId),
        expenseAmount: Number(editForm.expenseAmount),
        expenseDate: editForm.expenseDate || undefined,
        paymentMethod: editForm.paymentMethod || undefined,
      });
      toast.success("更新しました");
      setEditId(null);
      await load();
      onRefresh();
    } catch { toast.error("更新に失敗しました"); }
    finally { setEditSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("この支出を削除しますか？")) return;
    try {
      await api.expenses.delete(tripId, id);
      toast.success("削除しました");
      await load();
      onRefresh();
    } catch { toast.error("削除に失敗しました"); }
  }

  if (loading) return <div className="py-8 text-center text-muted-foreground">読み込み中...</div>;

  const inputCls = "px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">支出一覧</h3>
        <button onClick={() => { setShowForm(true); setEditId(null); }}
          className="text-sm px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90">
          ＋ 追加
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
          <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className={inputCls}>
            <option value="">カテゴリ</option>
            {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
          </select>
          <input required type="number" min="0" value={form.expenseAmount}
            onChange={(e) => setForm({ ...form, expenseAmount: e.target.value })}
            className={inputCls} placeholder="金額 (¥)" />
          <input type="date" value={form.expenseDate}
            onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
            className={inputCls} />
          <input value={form.paymentMethod}
            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            className={inputCls} placeholder="支払方法 (例: 現金)" />
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

      {expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">支出がありません</p>
      ) : (
        <div className="divide-y divide-border/50">
          {expenses.map((e) => (
            <div key={e.expenseId}>
              {editId === e.expenseId ? (
                /* Edit form */
                <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-2 py-3">
                  <select required value={editForm.categoryId}
                    onChange={(ev) => setEditForm({ ...editForm, categoryId: ev.target.value })}
                    className={inputCls}>
                    <option value="">カテゴリ</option>
                    {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                  </select>
                  <input required type="number" min="0" value={editForm.expenseAmount}
                    onChange={(ev) => setEditForm({ ...editForm, expenseAmount: ev.target.value })}
                    className={inputCls} placeholder="金額 (¥)" />
                  <input type="date" value={editForm.expenseDate}
                    onChange={(ev) => setEditForm({ ...editForm, expenseDate: ev.target.value })}
                    className={inputCls} />
                  <input value={editForm.paymentMethod}
                    onChange={(ev) => setEditForm({ ...editForm, paymentMethod: ev.target.value })}
                    className={inputCls} placeholder="支払方法" />
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
                <div className="py-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{e.category?.categoryName}</span>
                      {e.paymentMethod && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                          {e.paymentMethod}
                        </span>
                      )}
                    </div>
                    {e.expenseDate && <p className="text-xs text-muted-foreground mt-0.5">{formatDate(e.expenseDate)}</p>}
                  </div>
                  <span className="font-bold text-primary">{formatCurrency(e.expenseAmount)}</span>
                  <button onClick={() => startEdit(e)}
                    className="text-xs text-muted-foreground hover:text-primary">編集</button>
                  <button onClick={() => handleDelete(e.expenseId)}
                    className="text-xs text-muted-foreground hover:text-destructive">削除</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
