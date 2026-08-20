"use client";

import { useEffect, useState } from "react";
import { api, type Expense, type Category } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { PlaneLoader } from "@/components/ui/PlaneLoader";

interface Props {
  tripId: number;
  categories: Category[];
  onRefresh: () => void;
  onCategoryCreated: (category: Category) => void;
}

const CUSTOM_CATEGORY_VALUE = "__custom__";
const emptyForm = () => ({
  categoryId: "", customCategoryName: "", expenseAmount: "", expenseDate: "", paymentMethod: "", description: "",
});

export function ExpenseTab({ tripId, categories, onRefresh, onCategoryCreated }: Props) {
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
      let categoryId = Number(form.categoryId);
      if (form.categoryId === CUSTOM_CATEGORY_VALUE) {
        const customName = form.customCategoryName.trim();
        if (!customName) {
          toast.error("カテゴリ名を入力してください");
          return;
        }
        const category = await api.categories.create(customName);
        categoryId = category.categoryId;
        onCategoryCreated(category);
      }
      await api.expenses.create(tripId, {
        categoryId,
        expenseAmount: Number(form.expenseAmount),
        expenseDate: form.expenseDate || undefined,
        paymentMethod: form.paymentMethod || undefined,
        description: form.description || undefined,
      });
      toast.success("支出を追加しました");
      setShowForm(false);
      setForm(emptyForm());
      await load();
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg ? `支出の追加に失敗しました: ${msg}` : "支出の追加に失敗しました");
    } finally { setSaving(false); }
  }

  function startEdit(expense: Expense) {
    setEditId(expense.expenseId);
    setEditForm({
      categoryId: String(expense.category?.categoryId ?? expense.categoryId ?? ""),
      customCategoryName: "",
      expenseAmount: String(expense.expenseAmount ?? ""),
      expenseDate: expense.expenseDate ?? "",
      paymentMethod: expense.paymentMethod ?? "",
      description: expense.description ?? "",
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
        description: editForm.description || undefined,
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

  if (loading) return <PlaneLoader text="読み込み中..." className="py-6" />;

  const inputCls = "px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  /** 支出をカテゴリ別にグループ化して表示 */
  const grouped = categories
    .map((cat) => ({
      cat,
      items: expenses.filter(
        (e) => (e.category?.categoryId ?? e.categoryId) === cat.categoryId
      ),
    }))
    .filter((g) => g.items.length > 0);

  // カテゴリに紐付かない支出（念のため）
  const ungrouped = expenses.filter(
    (e) => !categories.some((c) => c.categoryId === (e.category?.categoryId ?? e.categoryId))
  );

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">支出一覧</h3>
        <button
          onClick={() => { setShowForm((v) => !v); setEditId(null); }}
          className="text-sm px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          ＋ 支出を追加
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-5 p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-primary">新しい支出を登録</p>
          <div className="grid grid-cols-2 gap-2">
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className={inputCls}>
              <option value="">カテゴリを選択</option>
              {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
              <option value={CUSTOM_CATEGORY_VALUE}>その他（手入力）</option>
            </select>
              {form.categoryId === CUSTOM_CATEGORY_VALUE && (
                <input
                  required
                  value={form.customCategoryName}
                  disabled={saving}
                  onChange={(e) => setForm({ ...form, customCategoryName: e.target.value })}
                  className={inputCls}
                  placeholder="カテゴリ名を入力"
                />
              )}
            <input required type="number" min="0" step="1" value={form.expenseAmount}
              onChange={(e) => setForm({ ...form, expenseAmount: e.target.value })}
              className={inputCls} placeholder="金額 (¥)" />
            <input type="date" value={form.expenseDate}
              onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
              className={inputCls} aria-label="日付（任意）" title="日付（任意）" />
            <input value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              className={inputCls} placeholder="支払方法 (例: 現金)" />
            <input value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputCls} col-span-2`} placeholder="メモ (例: 昼食・新幹線代など)" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted">キャンセル</button>
            <button type="submit" disabled={saving}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>
        </form>
      )}

      {expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">支出がありません</p>
      ) : (
        <div className="space-y-4">
          {/* カテゴリ別グループ表示 */}
          {grouped.map(({ cat, items }) => (
            <div key={cat.categoryId}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {cat.categoryName}
                </span>
                <span className="text-xs text-muted-foreground">
                  計 {formatCurrency(items.reduce((s, e) => s + Number(e.expenseAmount), 0))}
                </span>
              </div>
              <div className="divide-y divide-border/50 border border-border/40 rounded-lg overflow-hidden">
                {items.map((e) => (
                  <div key={e.expenseId}>
                    {editId === e.expenseId ? (
                      <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-2 p-3 bg-muted/30">
                        <select required value={editForm.categoryId}
                          onChange={(ev) => setEditForm({ ...editForm, categoryId: ev.target.value })}
                          className={inputCls}>
                          <option value="">カテゴリ</option>
                          {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                        </select>
                        <input required type="number" min="0" step="1" value={editForm.expenseAmount}
                          onChange={(ev) => setEditForm({ ...editForm, expenseAmount: ev.target.value })}
                          className={inputCls} placeholder="金額 (¥)" />
                        <input type="date" value={editForm.expenseDate}
                          onChange={(ev) => setEditForm({ ...editForm, expenseDate: ev.target.value })}
                          className={inputCls} />
                        <input value={editForm.paymentMethod}
                          onChange={(ev) => setEditForm({ ...editForm, paymentMethod: ev.target.value })}
                          className={inputCls} placeholder="支払方法" />
                        <input value={editForm.description}
                          onChange={(ev) => setEditForm({ ...editForm, description: ev.target.value })}
                          className={`${inputCls} col-span-2`} placeholder="メモ" />
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
                      <div className="px-3 py-2.5 flex items-center gap-3 bg-white hover:bg-muted/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {e.description && (
                              <span className="text-sm font-medium truncate">{e.description}</span>
                            )}
                            {e.paymentMethod && (
                              <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground shrink-0">
                                {e.paymentMethod}
                              </span>
                            )}
                          </div>
                          {e.expenseDate && (
                            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(e.expenseDate)}</p>
                          )}
                        </div>
                        <span className="font-bold text-primary shrink-0">{formatCurrency(Number(e.expenseAmount))}</span>
                        <button onClick={() => startEdit(e)}
                          className="text-xs text-muted-foreground hover:text-primary shrink-0">編集</button>
                        <button onClick={() => handleDelete(e.expenseId)}
                          className="text-xs text-muted-foreground hover:text-destructive shrink-0">削除</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* カテゴリ未分類 */}
          {ungrouped.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-muted-foreground">未分類</span>
              <div className="divide-y divide-border/50 border border-border/40 rounded-lg overflow-hidden mt-1">
                {ungrouped.map((e) => (
                  <div key={e.expenseId} className="px-3 py-2.5 flex items-center gap-3 bg-white">
                    <div className="flex-1">
                      {e.description && <p className="text-sm font-medium">{e.description}</p>}
                      {e.expenseDate && <p className="text-xs text-muted-foreground">{formatDate(e.expenseDate)}</p>}
                    </div>
                    <span className="font-bold text-primary">{formatCurrency(Number(e.expenseAmount))}</span>
                    <button onClick={() => handleDelete(e.expenseId)}
                      className="text-xs text-muted-foreground hover:text-destructive">削除</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
