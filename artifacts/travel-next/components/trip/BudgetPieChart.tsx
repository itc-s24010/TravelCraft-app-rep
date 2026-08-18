"use client";

import { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Category } from "@/lib/api";

const DEFAULT_COLORS = [
  "#f97316", "#3b82f6", "#10b981", "#a855f7",
  "#ef4444", "#eab308", "#06b6d4", "#ec4899",
];

const PRESET_COLORS = [
  "#f97316", "#ef4444", "#eab308", "#84cc16",
  "#10b981", "#06b6d4", "#3b82f6", "#6366f1",
  "#a855f7", "#ec4899", "#78716c", "#64748b",
];

interface BudgetPieChartProps {
  breakdown: Array<{
    categoryId: number;
    categoryName: string;
    budget: number;
    expense: number;
  }>;
  categories?: Category[];
  onColorChange?: (categoryId: number, color: string) => Promise<void>;
}

function fmt(v: number) {
  return `¥${v.toLocaleString()}`;
}

function resolveColor(categoryId: number, index: number, categories?: Category[]): string {
  const cat = categories?.find((c) => c.categoryId === categoryId);
  return cat?.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

/* ── カラーピッカーポップオーバー ── */
function ColorPickerPopover({
  currentColor,
  onSelect,
  onClose,
}: {
  currentColor: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-5 z-50 bg-white border border-border rounded-xl shadow-lg p-2.5 w-40"
    >
      <p className="text-[10px] text-muted-foreground mb-2 font-medium">カラーを選択</p>
      <div className="grid grid-cols-4 gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => { onSelect(color); onClose(); }}
            className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              borderColor: color === currentColor ? "#1e293b" : "transparent",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function BudgetPieChart({ breakdown, categories, onColorChange }: BudgetPieChartProps) {
  const [openPickerId, setOpenPickerId] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  const totalBudget = breakdown.reduce((s, c) => s + c.budget, 0);
  const totalExpense = breakdown.reduce((s, c) => s + c.expense, 0);
  const remaining = totalBudget - totalExpense;

  // 横バー用：予算のある or 支出のある全カテゴリ
  const barData = breakdown.filter((c) => c.budget > 0 || c.expense > 0);

  // 支出のある項目だけ円グラフに使う
  const pieData = breakdown
    .filter((c) => c.expense > 0)
    .map((c, i) => ({
      name: c.categoryName,
      value: c.expense,
      color: resolveColor(c.categoryId, i, categories),
    }));

  if (totalBudget > 0 && remaining > 0) {
    pieData.push({ name: "残り予算", value: remaining, color: "#e5e7eb" });
  }

  const isEmpty = totalBudget === 0 && totalExpense === 0;

  async function handleColorSelect(categoryId: number, color: string) {
    if (!onColorChange) return;
    setSaving(categoryId);
    try {
      await onColorChange(categoryId, color);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* ドーナツグラフ */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-4 gap-2">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="50" fill="none" stroke="#e5e7eb" strokeWidth="28" />
          </svg>
          <p className="text-xs text-muted-foreground">データがありません</p>
        </div>
      ) : (
        <div className="relative" style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => fmt(value)} />
            </PieChart>
          </ResponsiveContainer>

          {/* 中央テキスト */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-0.5">
            <p className="text-[10px] text-muted-foreground leading-none">支出合計</p>
            <p className={`text-base font-bold leading-tight ${remaining < 0 ? "text-red-500" : "text-primary"}`}>
              {fmt(totalExpense)}
            </p>
            {totalBudget > 0 && (
              <>
                <div className="w-10 border-t border-border/60 my-0.5" />
                <p className="text-[10px] text-muted-foreground leading-none">予算合計</p>
                <p className="text-xs font-semibold text-foreground leading-tight">{fmt(totalBudget)}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* 横バー一覧 */}
      {(barData.length > 0 || (totalBudget > 0 && remaining >= 0)) && (
        <div className="space-y-2.5">
          {barData.map((c, i) => {
            const color = resolveColor(c.categoryId, i, categories);
            const pct = c.budget > 0
              ? Math.min(100, (c.expense / c.budget) * 100)
              : c.expense > 0 ? 100 : 0;
            const isOver = c.budget > 0 && c.expense > c.budget;
            const isOpen = openPickerId === c.categoryId;

            return (
              <div key={c.categoryId}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    {/* クリックで色変更 */}
                    <span className="relative">
                      <button
                        onClick={() => onColorChange && setOpenPickerId(isOpen ? null : c.categoryId)}
                        className={`inline-block w-3 h-3 rounded-full shrink-0 transition-transform ${onColorChange ? "hover:scale-125 cursor-pointer" : "cursor-default"} ${saving === c.categoryId ? "opacity-50" : ""}`}
                        style={{ backgroundColor: color }}
                        title={onColorChange ? "色を変更" : undefined}
                      />
                      {isOpen && (
                        <ColorPickerPopover
                          currentColor={color}
                          onSelect={(newColor) => handleColorSelect(c.categoryId, newColor)}
                          onClose={() => setOpenPickerId(null)}
                        />
                      )}
                    </span>
                    {c.categoryName}
                  </span>
                  <span className={`tabular-nums ${isOver ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                    {fmt(c.expense)}
                    {c.budget > 0 && <> / {fmt(c.budget)}</>}
                    {isOver && <span className="ml-1">⚠</span>}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: isOver ? "#ef4444" : color }}
                  />
                </div>
              </div>
            );
          })}

          {/* 残り予算 */}
          {totalBudget > 0 && (
            <div className="pt-2 mt-1 border-t border-border/60">
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${remaining < 0 ? "bg-red-400" : "bg-emerald-400"}`} />
                  残り予算
                </span>
                <span className={`tabular-nums font-bold text-sm ${remaining < 0 ? "text-red-500" : "text-emerald-600"}`}>
                  {remaining < 0 ? "−" : ""}{fmt(Math.abs(remaining))}
                </span>
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${remaining < 0 ? "bg-red-400" : "bg-emerald-400"}`}
                  style={{ width: `${Math.min(100, totalBudget > 0 ? (Math.max(0, remaining) / totalBudget) * 100 : 0)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-2 font-medium">
                <span className="text-slate-500">合計支出 <span className="text-foreground font-semibold">{fmt(totalExpense)}</span></span>
                <span className="text-slate-500">予算合計 <span className="text-foreground font-semibold">{fmt(totalBudget)}</span></span>
              </div>
            </div>
          )}
        </div>
      )}

      {onColorChange && barData.length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">● をクリックしてカテゴリの色を変更できます</p>
      )}
    </div>
  );
}
