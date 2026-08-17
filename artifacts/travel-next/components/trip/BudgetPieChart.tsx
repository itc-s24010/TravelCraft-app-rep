"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#f97316", // orange (primary)
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

export function BudgetPieChart({ breakdown }: BudgetPieChartProps) {
  const data = breakdown
    .filter((c) => c.expense > 0)
    .map((c) => ({ name: c.categoryName, value: c.expense }));

  // 空のとき：グレーの円を表示
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-4 gap-2">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="24"
          />
        </svg>
        <p className="text-xs text-muted-foreground">支出データがありません</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={72}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) =>
              `¥${value.toLocaleString()}`
            }
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
