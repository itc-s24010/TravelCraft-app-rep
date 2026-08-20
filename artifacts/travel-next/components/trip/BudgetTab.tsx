"use client";

import { useEffect, useState } from "react";
import { api, type Budget, type Category, type Summary } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { PlaneLoader } from "@/components/ui/PlaneLoader";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { resolveCategoryColors } from "@/components/trip/categoryColors";

interface Props {
  tripId: number;
  categories: Category[];
  summary: Summary | null;
  onRefresh: () => void;
}

export function BudgetTab({ tripId, categories, summary, onRefresh }: Props) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoryId: "", budgetAmount: "" });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");

  useEffect(() => { load(); }, [tripId]);

  async function load() {
    try {
      setBudgets(await api.budget.list(tripId));
    } catch {
      toast.error("予算の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.budget.create(tripId, {
        categoryId: Number(form.categoryId),
        budgetAmount: Number(form.budgetAmount),
      });
      toast.success("予算を設定しました");
      setShowForm(false);
      setForm({ categoryId: "", budgetAmount: "" });
      await load();
      onRefresh();
    } catch {
      toast.error("予算の設定に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: number) {
    try {
      await api.budget.update(tripId, id, { budgetAmount: Number(editAmount) });
      toast.success("更新しました");
      setEditId(null);
      await load();
      onRefresh();
    } catch {
      toast.error("更新に失敗しました");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("この予算を削除しますか？")) return;
    try {
      await api.budget.delete(tripId, id);
      toast.success("削除しました");
      await load();
      onRefresh();
    } catch {
      toast.error("削除に失敗しました");
    }
  }

  const remaining = summary?.remaining ?? 0;
  const colorMap = resolveCategoryColors(summary?.categoryBreakdown ?? [], categories);
  const chartData = [
    ...(summary?.categoryBreakdown.filter(c => c.expense > 0).map(c => ({
      name: c.categoryName,
      value: c.expense,
      color: colorMap.get(c.categoryId) ?? "#94a3b8",
      unused: false,
    })) ?? []),
    ...(remaining > 0 ? [{ name: "残額", value: remaining, color: "#e5e7eb", unused: true }] : []),
  ];

  const usedCategories = new Set(budgets.map((b) => b.category?.categoryId ?? b.categoryId));
  const availableCategories = categories.filter((c) => !usedCategories.has(c.categoryId));

  if (loading) return <PlaneLoader text="読み込み中..." className="py-6" />;

  return (
    <div className="space-y-6">
      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="font-semibold mb-4 text-secondary">支出内訳</h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="value" nameKey="name" paddingAngle={2}
                  startAngle={90} endAngle={-270}>
                  {chartData.map((entry, i) => (
                    <Cell key={i}
                      fill={entry.color}
                      stroke="none" />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full md:w-auto shrink-0 space-y-2">
              {summary && [
                { label: "予算合計", val: summary.totalBudget, cls: "text-secondary" },
                { label: "支出合計", val: summary.totalExpense, cls: "text-primary" },
                { label: "残額", val: summary.remaining, cls: summary.remaining < 0 ? "text-destructive" : "text-green-600" },
              ].map(item => (
                <div key={item.label} className="flex justify-between gap-8 text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={`font-bold ${item.cls}`}>{formatCurrency(item.val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Budget List */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">カテゴリ別予算</h3>
          {availableCategories.length > 0 && (
            <button onClick={() => setShowForm(true)}
              className="text-sm px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90">
              ＋ 追加
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="flex gap-2 mb-4 flex-wrap">
            <select required value={form.categoryId}
              disabled={saving}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="flex-1 min-w-[120px] px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50">
              <option value="">カテゴリ選択</option>
              {availableCategories.map(c => (
                <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
              ))}
            </select>
            <input required type="number" min="0" value={form.budgetAmount}
              disabled={saving}
              onChange={(e) => setForm({ ...form, budgetAmount: e.target.value })}
              className="w-32 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              placeholder="金額 (¥)" />
            <button type="submit" disabled={saving}
              className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
              {saving ? "保存中..." : "保存"}
            </button>
            <button type="button" disabled={saving} onClick={() => setShowForm(false)}
              className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
              キャンセル
            </button>
          </form>
        )}

        {budgets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">予算が設定されていません</p>
        ) : (
          <div className="space-y-2">
            {budgets.map((b) => {
              const cat = summary?.categoryBreakdown.find(
                c => c.categoryId === (b.category?.categoryId ?? b.categoryId)
              );
              return (
                <div key={b.budgetId} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <span className="flex-1 text-sm font-medium">
                    {b.category?.categoryName ?? `カテゴリ ${b.categoryId}`}
                  </span>
                  {editId === b.budgetId ? (
                    <>
                      <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)}
                        className="w-28 px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      <button onClick={() => handleUpdate(b.budgetId)} className="text-xs text-primary font-medium">保存</button>
                      <button onClick={() => setEditId(null)} className="text-xs text-muted-foreground">取消</button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-bold">{formatCurrency(b.budgetAmount ?? 0)}</span>
                      {cat && <span className="text-xs text-muted-foreground">支出: {formatCurrency(cat.expense)}</span>}
                      <button onClick={() => { setEditId(b.budgetId); setEditAmount(String(b.budgetAmount ?? 0)); }}
                        className="text-xs text-muted-foreground hover:text-primary">編集</button>
                      <button onClick={() => handleDelete(b.budgetId)}
                        className="text-xs text-muted-foreground hover:text-destructive">削除</button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
