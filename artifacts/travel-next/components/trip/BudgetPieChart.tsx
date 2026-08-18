"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "#f97316", // orange
  "#3b82f6", // blue
  "#10b981", // emerald
  "#a855f7", // purple
  "#ef4444", // red
  "#eab308", // yellow
  "#06b6d4", // cyan
  "#ec4899", // pink
];

interface BudgetPieChartProps {
  breakdown: Array<{
    categoryId: number;
    categoryName: string;
    budget: number;
    expense: number;
  }>;
}

function fmt(v: number) {
  return `¥${v.toLocaleString()}`;
}

export function BudgetPieChart({ breakdown }: BudgetPieChartProps) {
  const totalBudget = breakdown.reduce((s, c) => s + c.budget, 0);
  const totalExpense = breakdown.reduce((s, c) => s + c.expense, 0);
  const remaining = totalBudget - totalExpense;

  // 支出のある項目だけ円グラフに使う
  const pieData = breakdown
    .filter((c) => c.expense > 0)
    .map((c, i) => ({ name: c.categoryName, value: c.expense, color: COLORS[i % COLORS.length] }));

  // 余り分を円グラフに追加（予算があるとき）
  if (totalBudget > 0 && remaining > 0) {
    pieData.push({ name: "残り予算", value: remaining, color: "#e5e7eb" });
  }

  const isEmpty = totalBudget === 0 && totalExpense === 0;

  // 横バー用：予算のある or 支出のある全カテゴリ
  const barData = breakdown.filter((c) => c.budget > 0 || c.expense > 0);

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
            // 各カテゴリの予算に対する支出割合（予算なし＝支出あり → 100% 扱い）
            const pct = c.budget > 0
              ? Math.min(100, (c.expense / c.budget) * 100)
              : c.expense > 0 ? 100 : 0;
            const isOver = c.budget > 0 && c.expense > c.budget;
            const color = COLORS[i % COLORS.length];
            return (
              <div key={c.categoryId}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
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
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isOver ? "#ef4444" : color,
                    }}
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
                  style={{
                    width: `${Math.min(100, totalBudget > 0 ? (Math.max(0, remaining) / totalBudget) * 100 : 0)}%`,
                  }}
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
    </div>
  );
}
