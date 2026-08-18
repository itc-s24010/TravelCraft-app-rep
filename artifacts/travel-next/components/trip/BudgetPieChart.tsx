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
      {/* 円グラフ */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-4 gap-2">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="48" fill="none" stroke="#e5e7eb" strokeWidth="24" />
          </svg>
          <p className="text-xs text-muted-foreground">データがありません</p>
        </div>
      ) : (
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={72}
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
        </div>
      )}

      {/* 横バー一覧 */}
      {(barData.length > 0 || (totalBudget > 0 && remaining >= 0)) && (
        <div className="space-y-2.5">
          {barData.map((c, i) => {
            const pct = totalBudget > 0 ? Math.min(100, (c.expense / totalBudget) * 100) : 0;
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
                  <span className="text-muted-foreground tabular-nums">
                    {fmt(c.expense)}
                    {c.budget > 0 && <> / {fmt(c.budget)}</>}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}

          {/* 残り予算 */}
          {totalBudget > 0 && (
            <div className="pt-1 border-t border-border/50">
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-200 shrink-0" />
                  残り予算
                </span>
                <span
                  className={`tabular-nums font-semibold ${
                    remaining < 0 ? "text-red-500" : "text-emerald-600"
                  }`}
                >
                  {remaining < 0 ? "-" : ""}{fmt(Math.abs(remaining))}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gray-200 transition-all"
                  style={{
                    width: `${Math.min(100, totalBudget > 0 ? (Math.max(0, remaining) / totalBudget) * 100 : 0)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1 text-muted-foreground/70">
                <span>合計支出: {fmt(totalExpense)}</span>
                <span>予算合計: {fmt(totalBudget)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
