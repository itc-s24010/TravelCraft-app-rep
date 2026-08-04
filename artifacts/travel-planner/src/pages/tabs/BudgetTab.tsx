import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Loader2, Plus, Wallet, TrendingDown, TrendingUp,
  Edit2, Trash2, ReceiptText, Settings2
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, Label, ResponsiveContainer,
  Tooltip as RechartsTooltip
} from "recharts";

import {
  useGetTripSummary, useListBudget, useListExpenses, useListCategories,
  useCreateBudget, useUpdateBudget, useDeleteBudget,
  useCreateExpense, useUpdateExpense, useDeleteExpense,
  getGetTripSummaryQueryKey, getListBudgetQueryKey, getListExpensesQueryKey,
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ─── types ─────────────────────────────────────────────────────────────────

interface ExpenseItem {
  expenseId: number;
  categoryId: number;
  categoryName: string;
  expenseAmount: number;
  expenseDate: string;
  paymentMethod?: string | null;
}

interface BudgetItem {
  budgetId: number;
  categoryId: number;
  categoryName: string;
  budgetAmount: number;
}

// ─── helpers ───────────────────────────────────────────────────────────────

const PALETTE = [
  "#f97316", "#06b6d4", "#8b5cf6", "#22c55e", "#f59e0b",
  "#ec4899", "#3b82f6", "#14b8a6", "#a855f7", "#ef4444",
];

/** categoryId を固定色にマッピング（配列順番に依存しない） */
function buildColorMap(cats: { categoryId: number }[]): Map<number, string> {
  const map = new Map<number, string>();
  cats.forEach((c, i) => map.set(c.categoryId, PALETTE[i % PALETTE.length]));
  return map;
}

// ─── main component ────────────────────────────────────────────────────────

export default function BudgetTab() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const tripId = parseInt(params.tripId || "0");

  // URL-based create forms
  const isBudgetNew  = location.endsWith("/budget/new");
  const isExpenseNew = location.endsWith("/expenses/new");
  const isForm = isBudgetNew || isExpenseNew;

  // State-based edit modes
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [editingBudget,  setEditingBudget]  = useState<BudgetItem  | null>(null);

  const back = () => setLocation(`/trips/${tripId}/budget`);

  const { data: summary, isLoading: loadingSummary } = useGetTripSummary(tripId, {
    query: { enabled: !isForm, queryKey: getGetTripSummaryQueryKey(tripId) }
  });
  const { data: budgets } = useListBudget(tripId, {
    query: { enabled: !isForm, queryKey: getListBudgetQueryKey(tripId) }
  });
  const { data: expenses } = useListExpenses(tripId, {
    query: { enabled: !isForm, queryKey: getListExpensesQueryKey(tripId) }
  });

  const [activeView, setActiveView] = useState<"overview" | "expenses" | "budgets">("overview");

  // カテゴリIDを固定色にマッピング — フックのルール上、early return より前に置く
  const colorMap = useMemo(
    () => buildColorMap(summary?.categoryBreakdown ?? []),
    [summary]
  );
  const catColor = (categoryId: number) => colorMap.get(categoryId) ?? "#d1d5db";

  // ── route to create forms (URL-based) ──────────────────────────────────
  if (isBudgetNew)  return <BudgetForm  tripId={tripId} existing={null} onCancel={back} />;
  if (isExpenseNew) return <ExpenseForm tripId={tripId} existing={null} onCancel={back} />;

  // ── route to edit forms (state-based) ──────────────────────────────────
  if (editingExpense) {
    return (
      <ExpenseForm
        tripId={tripId}
        existing={editingExpense}
        onCancel={() => setEditingExpense(null)}
      />
    );
  }
  if (editingBudget) {
    return (
      <BudgetForm
        tripId={tripId}
        existing={editingBudget}
        onCancel={() => setEditingBudget(null)}
      />
    );
  }

  if (loadingSummary) {
    return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-chart-3" /></div>;
  }

  const totalBudget  = summary?.totalBudget  ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const remaining    = summary?.remaining    ?? 0;
  const usedPct      = totalBudget > 0 ? Math.min(100, Math.round((totalExpense / totalBudget) * 100)) : 0;

  // 支出済みカテゴリ＋残額（灰色）をグラフに表示
  const spentSlices = summary?.categoryBreakdown
    .filter(c => c.expense > 0)
    .map(c => ({
      name: c.categoryName,
      value: c.expense,
      categoryId: c.categoryId,
      unused: false,
    })) ?? [];

  const chartData = [
    ...spentSlices,
    ...(remaining > 0
      ? [{ name: "残額", value: remaining, categoryId: -1, unused: true }]
      : []),
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-serif font-bold">予算・支出</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setLocation(`/trips/${tripId}/budget/new`)}
            className="rounded-full shadow-sm bg-white"
          >
            <Plus className="w-4 h-4 mr-1" /> 予算設定
          </Button>
          <Button
            onClick={() => setLocation(`/trips/${tripId}/expenses/new`)}
            className="rounded-full shadow-sm bg-chart-3 hover:bg-chart-3/90 text-white"
          >
            <Plus className="w-4 h-4 mr-1" /> 支出追加
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-2xl border-none shadow-sm" style={{ background: "hsl(var(--primary)/.08)" }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">総予算</span>
            </div>
            <p className="text-2xl font-serif font-bold">¥{totalBudget.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm" style={{ background: "hsl(var(--destructive)/.08)" }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-4 h-4 text-destructive" />
              <span className="text-xs font-medium text-muted-foreground">総支出</span>
            </div>
            <p className="text-2xl font-serif font-bold text-destructive">¥{totalExpense.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm" style={{ background: remaining < 0 ? "hsl(var(--destructive)/.08)" : "hsl(var(--secondary)/.08)" }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown className={`w-4 h-4 ${remaining < 0 ? "text-destructive" : "text-secondary"}`} />
              <span className="text-xs font-medium text-muted-foreground">残額</span>
            </div>
            <p className={`text-2xl font-serif font-bold ${remaining < 0 ? "text-destructive" : "text-secondary"}`}>
              ¥{remaining.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overall progress bar */}
      {totalBudget > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>予算使用率</span>
            <span className={usedPct >= 100 ? "text-destructive font-semibold" : ""}>{usedPct}%</span>
          </div>
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                usedPct >= 100 ? "bg-destructive" : usedPct >= 80 ? "bg-amber-500" : "bg-chart-3"
              }`}
              style={{ width: `${Math.min(100, usedPct)}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/50 rounded-full p-1 h-11">
          <TabsTrigger value="overview"  className="rounded-full text-sm font-medium">概要</TabsTrigger>
          <TabsTrigger value="expenses"  className="rounded-full text-sm font-medium">支出一覧</TabsTrigger>
          <TabsTrigger value="budgets"   className="rounded-full text-sm font-medium">予算設定</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview" className="mt-5">
          {chartData.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
              まだ支出が記録されていません。
            </div>
          ) : (
            <div className="grid md:grid-cols-[260px_1fr] gap-6 items-start">
              {/* Donut chart */}
              <div className="flex flex-col items-center">
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%" cy="50%"
                        innerRadius={68} outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                        startAngle={90}
                        endAngle={-270}
                      >
                        {chartData.map((d) => (
                          <Cell
                            key={d.categoryId}
                            fill={d.unused ? "#e5e7eb" : catColor(d.categoryId)}
                          />
                        ))}
                        <Label
                          content={({ viewBox }) => {
                            const { cx, cy } = viewBox as { cx: number; cy: number };
                            return (
                              <text textAnchor="middle">
                                <tspan
                                  x={cx} y={cy - 8}
                                  fontSize="22" fontWeight="700"
                                  fill="#1a1a2e" fontFamily="serif"
                                >
                                  {usedPct}%
                                </tspan>
                                <tspan
                                  x={cx} y={cy + 12}
                                  fontSize="11" fill="#888"
                                >
                                  使用済み
                                </tspan>
                              </text>
                            );
                          }}
                          position="center"
                        />
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: number, _name: string, entry: any) => {
                          if (entry.payload?.unused) {
                            return [`¥${val.toLocaleString()} (未使用予算)`, ""];
                          }
                          const pctOfTotal = totalExpense > 0
                            ? Math.round((val / totalExpense) * 100) : 0;
                          return [`¥${val.toLocaleString()} (${pctOfTotal}%)`, ""];
                        }}
                        contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
                  {chartData.map((d) => (
                    <div key={d.categoryId} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full flex-none" style={{ backgroundColor: catColor(d.categoryId) }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Category breakdown */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">カテゴリ別内訳</h4>
                {summary?.categoryBreakdown.map((cat) => {
                  if (cat.expense === 0 && cat.budget === 0) return null;
                  const pct = cat.budget > 0 ? Math.min(100, Math.round((cat.expense / cat.budget) * 100)) : 0;
                  const isOver = cat.expense > cat.budget && cat.budget > 0;
                  return (
                    <div key={cat.categoryId} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-none"
                            style={{ backgroundColor: cat.expense > 0 ? catColor(cat.categoryId) : "#d1d5db" }}
                          />
                          <span className="text-sm font-medium">{cat.categoryName}</span>
                        </div>
                        <div className="text-right leading-tight">
                          <span className={`text-sm font-semibold ${isOver ? "text-destructive" : ""}`}>
                            ¥{cat.expense.toLocaleString()}
                          </span>
                          {cat.budget > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              / ¥{cat.budget.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {cat.budget > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-destructive" : "bg-chart-3"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-xs w-8 text-right tabular-nums ${isOver ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                            {pct}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── EXPENSES ── */}
        <TabsContent value="expenses" className="mt-5">
          {!expenses || expenses.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border">
              <ReceiptText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">支出がまだありません。</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp) => (
                <div
                  key={exp.expenseId}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-white hover:shadow-sm transition-shadow group"
                >
                  <div className="flex gap-3 items-center">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: catColor(exp.categoryId) }}
                    >
                      {exp.categoryName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{exp.categoryName}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(exp.expenseDate), "yyyy年M月d日(E)", { locale: ja })}
                        {exp.paymentMethod && ` · ${exp.paymentMethod}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-base">¥{exp.expenseAmount.toLocaleString()}</p>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground"
                        onClick={() => setEditingExpense(exp as ExpenseItem)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <DeleteExpenseButton tripId={tripId} id={exp.expenseId} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── BUDGETS ── */}
        <TabsContent value="budgets" className="mt-5">
          {!budgets || budgets.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border">
              <Settings2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">予算が設定されていません。</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {budgets.map((bg) => {
                const catSummary = summary?.categoryBreakdown.find(c => c.categoryId === bg.categoryId);
                const pct = catSummary ? Math.min(100, Math.round((catSummary.expense / bg.budgetAmount) * 100)) : 0;
                const isOver = (catSummary?.expense ?? 0) > bg.budgetAmount;
                return (
                  <div
                    key={bg.budgetId}
                    className="p-4 rounded-2xl border border-border/50 bg-white hover:shadow-sm transition-shadow group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: catColor(bg.categoryId) }}
                        />
                        <span className="text-sm font-medium text-muted-foreground">{bg.categoryName}</span>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground"
                          onClick={() => setEditingBudget(bg as BudgetItem)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <DeleteBudgetButton tripId={tripId} id={bg.budgetId} />
                      </div>
                    </div>
                    <p className="text-2xl font-serif font-bold mb-3">¥{bg.budgetAmount.toLocaleString()}</p>
                    {catSummary !== undefined && (
                      <>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-1">
                          <div
                            className={`h-full rounded-full ${isOver ? "bg-destructive" : "bg-chart-3"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>支出 ¥{(catSummary.expense ?? 0).toLocaleString()}</span>
                          <span className={isOver ? "text-destructive font-semibold" : ""}>{pct}%</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── delete buttons ────────────────────────────────────────────────────────

function DeleteExpenseButton({ tripId, id }: { tripId: number; id: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const del = useDeleteExpense();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:bg-destructive/10">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader><AlertDialogTitle>この支出を削除しますか？</AlertDialogTitle></AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full bg-destructive hover:bg-destructive/90"
            onClick={() => del.mutate({ tripId, expenseId: id }, {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey(tripId) });
                queryClient.invalidateQueries({ queryKey: getGetTripSummaryQueryKey(tripId) });
                toast({ title: "支出を削除しました" });
              }
            })}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteBudgetButton({ tripId, id }: { tripId: number; id: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const del = useDeleteBudget();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:bg-destructive/10">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader><AlertDialogTitle>この予算設定を削除しますか？</AlertDialogTitle></AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full bg-destructive hover:bg-destructive/90"
            onClick={() => del.mutate({ tripId, budgetId: id }, {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListBudgetQueryKey(tripId) });
                queryClient.invalidateQueries({ queryKey: getGetTripSummaryQueryKey(tripId) });
                toast({ title: "予算設定を削除しました" });
              }
            })}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── expense form ──────────────────────────────────────────────────────────

const expSchema = z.object({
  categoryId:    z.coerce.number().min(1, "カテゴリを選択してください"),
  expenseAmount: z.coerce.number().min(1, "金額は1以上で入力してください"),
  expenseDate:   z.string().min(1, "日付は必須です"),
  paymentMethod: z.string().optional(),
});

function ExpenseForm({
  tripId,
  existing,
  onCancel,
}: {
  tripId: number;
  existing: ExpenseItem | null;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: cats } = useListCategories();
  const create = useCreateExpense();
  const update = useUpdateExpense();

  const form = useForm<z.infer<typeof expSchema>>({
    resolver: zodResolver(expSchema),
    defaultValues: existing
      ? {
          categoryId:    existing.categoryId,
          expenseAmount: existing.expenseAmount,
          expenseDate:   format(new Date(existing.expenseDate), "yyyy-MM-dd"),
          paymentMethod: existing.paymentMethod ?? "",
        }
      : {
          categoryId: 0, expenseAmount: 0,
          expenseDate: format(new Date(), "yyyy-MM-dd"),
          paymentMethod: "",
        },
  });

  const onSubmit = (data: z.infer<typeof expSchema>) => {
    if (existing) {
      update.mutate({ tripId, expenseId: existing.expenseId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey(tripId) });
          queryClient.invalidateQueries({ queryKey: getGetTripSummaryQueryKey(tripId) });
          toast({ title: "支出を更新しました" });
          onCancel();
        },
      });
    } else {
      create.mutate({ tripId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey(tripId) });
          queryClient.invalidateQueries({ queryKey: getGetTripSummaryQueryKey(tripId) });
          toast({ title: "支出を記録しました" });
          onCancel();
        },
      });
    }
  };

  return (
    <Card className="rounded-3xl shadow-sm border-border/50 max-w-xl mx-auto animate-in fade-in duration-300">
      <CardContent className="p-6 md:p-8">
        <h3 className="text-2xl font-serif font-bold mb-6">
          {existing ? "支出を編集" : "支出を追加"}
        </h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="categoryId" render={({ field }) => (
              <FormItem>
                <FormLabel>カテゴリ</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-muted/20">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cats?.map(c => (
                      <SelectItem key={c.categoryId} value={String(c.categoryId)}>{c.categoryName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="expenseAmount" render={({ field }) => (
              <FormItem>
                <FormLabel>金額（¥）</FormLabel>
                <FormControl><Input type="number" className="h-12 bg-muted/20" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="expenseDate" render={({ field }) => (
              <FormItem>
                <FormLabel>日付</FormLabel>
                <FormControl><Input type="date" className="h-12 bg-muted/20" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="paymentMethod" render={({ field }) => (
              <FormItem>
                <FormLabel>支払方法（任意）</FormLabel>
                <FormControl>
                  <Input placeholder="例：クレジットカード・現金" className="h-12 bg-muted/20" {...field} />
                </FormControl>
              </FormItem>
            )} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={onCancel} className="rounded-full">キャンセル</Button>
              <Button
                type="submit"
                disabled={create.isPending || update.isPending}
                className="rounded-full px-6 bg-chart-3 hover:bg-chart-3/90"
              >
                {(create.isPending || update.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {existing ? "更新する" : "保存する"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ─── budget form ───────────────────────────────────────────────────────────

const budgetSchema = z.object({
  categoryId:   z.coerce.number().min(1, "カテゴリを選択してください"),
  budgetAmount: z.coerce.number().min(1, "金額は1以上で入力してください"),
});

function BudgetForm({
  tripId,
  existing,
  onCancel,
}: {
  tripId: number;
  existing: BudgetItem | null;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: cats } = useListCategories();
  const create = useCreateBudget();
  const update = useUpdateBudget();

  const form = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: existing
      ? { categoryId: existing.categoryId, budgetAmount: existing.budgetAmount }
      : { categoryId: 0, budgetAmount: 0 },
  });

  const onSubmit = (data: z.infer<typeof budgetSchema>) => {
    if (existing) {
      update.mutate({ tripId, budgetId: existing.budgetId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBudgetQueryKey(tripId) });
          queryClient.invalidateQueries({ queryKey: getGetTripSummaryQueryKey(tripId) });
          toast({ title: "予算を更新しました" });
          onCancel();
        },
      });
    } else {
      create.mutate({ tripId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBudgetQueryKey(tripId) });
          queryClient.invalidateQueries({ queryKey: getGetTripSummaryQueryKey(tripId) });
          toast({ title: "予算を設定しました" });
          onCancel();
        },
      });
    }
  };

  return (
    <Card className="rounded-3xl shadow-sm border-border/50 max-w-xl mx-auto animate-in fade-in duration-300">
      <CardContent className="p-6 md:p-8">
        <h3 className="text-2xl font-serif font-bold mb-6">
          {existing ? "予算を編集" : "予算を設定"}
        </h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="categoryId" render={({ field }) => (
              <FormItem>
                <FormLabel>カテゴリ</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-muted/20">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cats?.map(c => (
                      <SelectItem key={c.categoryId} value={String(c.categoryId)}>{c.categoryName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="budgetAmount" render={({ field }) => (
              <FormItem>
                <FormLabel>予算金額（¥）</FormLabel>
                <FormControl><Input type="number" className="h-12 bg-muted/20" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={onCancel} className="rounded-full">キャンセル</Button>
              <Button
                type="submit"
                disabled={create.isPending || update.isPending}
                className="rounded-full px-6"
              >
                {(create.isPending || update.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {existing ? "更新する" : "保存する"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
