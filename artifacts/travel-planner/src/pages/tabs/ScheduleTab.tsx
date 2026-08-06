import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays, parseISO, eachDayOfInterval } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Loader2, Plus, Calendar, Train, Hotel, MapPin, Edit2, Trash2,
  Plane, Bus, Car, Ship, Ticket, Clock, Utensils, ShoppingBag,
  Camera, Coffee, MoreHorizontal,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useListActivities, useCreateActivity, useUpdateActivity, useDeleteActivity, useGetActivity,
  useListTransportation, useListAccommodation,
  getListActivitiesQueryKey, getGetActivityQueryKey,
  getListTransportationQueryKey, getListAccommodationQueryKey,
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ─── Types ──────────────────────────────────────────────────────────────────
type ActivityType = "観光" | "食事" | "ショッピング" | "自由時間" | "その他";

const ACTIVITY_TYPE_META: Record<ActivityType, { icon: React.FC<{ className?: string }>, color: string, bg: string }> = {
  観光:       { icon: Camera,       color: "text-purple-600",  bg: "bg-purple-50" },
  食事:       { icon: Utensils,     color: "text-orange-600",  bg: "bg-orange-50" },
  ショッピング: { icon: ShoppingBag,  color: "text-pink-600",    bg: "bg-pink-50" },
  自由時間:   { icon: Coffee,       color: "text-teal-600",    bg: "bg-teal-50" },
  その他:     { icon: MoreHorizontal,color: "text-gray-600",   bg: "bg-gray-50" },
};

const TRANSPORT_TYPE_META: Record<string, { icon: React.FC<{ className?: string }>, color: string, bg: string }> = {
  飛行機:    { icon: Plane,  color: "text-sky-600",    bg: "bg-sky-50" },
  新幹線:    { icon: Train,  color: "text-emerald-600", bg: "bg-emerald-50" },
  電車:      { icon: Train,  color: "text-violet-600",  bg: "bg-violet-50" },
  バス:      { icon: Bus,    color: "text-amber-600",   bg: "bg-amber-50" },
  レンタカー:{ icon: Car,    color: "text-rose-600",    bg: "bg-rose-50" },
  船:        { icon: Ship,   color: "text-blue-600",    bg: "bg-blue-50" },
};

function getActivityMeta(type: string) {
  return ACTIVITY_TYPE_META[type as ActivityType] ?? { icon: MoreHorizontal, color: "text-muted-foreground", bg: "bg-muted/30" };
}
function getTransportMeta(type: string) {
  return TRANSPORT_TYPE_META[type] ?? { icon: Ticket, color: "text-muted-foreground", bg: "bg-muted/30" };
}

// ─── Form schema ────────────────────────────────────────────────────────────
const formSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(200),
  activityType: z.string().min(1, "種類を選択してください"),
  location: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  memo: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getDateKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try { return format(new Date(iso), "yyyy-MM-dd"); } catch { return null; }
}

function getTimeLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  try { return format(new Date(iso), "HH:mm"); } catch { return ""; }
}

// ─── Main component ──────────────────────────────────────────────────────────
interface ScheduleTabProps {
  tripDate: string;
  endDate?: string | null;
}

export default function ScheduleTab({ tripDate, endDate }: ScheduleTabProps) {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const tripId = parseInt(params.tripId || "0");
  const activityId = params.activityId ? parseInt(params.activityId) : null;
  const isForm = location.endsWith("/new") || location.includes("/activities/") && location.includes("/edit");

  const { data: activities, isLoading: loadAct } = useListActivities(tripId, {
    query: { enabled: !isForm, queryKey: getListActivitiesQueryKey(tripId) }
  });
  const { data: transports, isLoading: loadTrans } = useListTransportation(tripId, {
    query: { enabled: !isForm, queryKey: getListTransportationQueryKey(tripId) }
  });
  const { data: accommodations, isLoading: loadAcc } = useListAccommodation(tripId, {
    query: { enabled: !isForm, queryKey: getListAccommodationQueryKey(tripId) }
  });

  if (isForm) {
    return (
      <ActivityForm
        tripId={tripId}
        activityId={activityId}
        onCancel={() => setLocation(`/trips/${tripId}/schedule`)}
      />
    );
  }

  if (loadAct || loadTrans || loadAcc) {
    return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  // Build day list
  let days: Date[] = [];
  if (tripDate) {
    try {
      const start = parseISO(tripDate);
      const end = endDate ? parseISO(endDate) : start;
      days = eachDayOfInterval({ start, end });
    } catch {
      days = [parseISO(tripDate)];
    }
  }

  // Build per-day event lists
  type TimelineEvent =
    | { kind: "activity"; data: any; sortTime: number }
    | { kind: "transport"; data: any; sortTime: number }
    | { kind: "accommodation"; data: any; sortTime: number };

  const dayMap = new Map<string, TimelineEvent[]>();
  for (const d of days) {
    dayMap.set(format(d, "yyyy-MM-dd"), []);
  }

  // Place activities
  for (const a of activities ?? []) {
    const key = getDateKey(a.startTime) ?? format(days[0] ?? new Date(), "yyyy-MM-dd");
    if (!dayMap.has(key)) dayMap.set(key, []);
    dayMap.get(key)!.push({
      kind: "activity",
      data: a,
      sortTime: a.startTime ? new Date(a.startTime).getTime() : 0,
    });
  }

  // Place transportation (by departure date)
  for (const t of transports ?? []) {
    const key = getDateKey(t.departureTime);
    if (key && dayMap.has(key)) {
      dayMap.get(key)!.push({
        kind: "transport",
        data: t,
        sortTime: new Date(t.departureTime).getTime(),
      });
    }
  }

  // Place accommodation (by checkIn date)
  for (const a of accommodations ?? []) {
    const key = getDateKey(a.checkIn);
    if (key && dayMap.has(key)) {
      dayMap.get(key)!.push({
        kind: "accommodation",
        data: a,
        sortTime: new Date(a.checkIn).getTime(),
      });
    }
  }

  // Sort each day's events by time
  for (const events of dayMap.values()) {
    events.sort((a, b) => a.sortTime - b.sortTime);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-serif font-bold">スケジュール</h3>
        <Button
          onClick={() => setLocation(`/trips/${tripId}/schedule/new`)}
          className="rounded-full shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> アクティビティを追加
        </Button>
      </div>

      {days.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 border border-dashed border-border rounded-3xl">
          <Calendar className="w-12 h-12 text-primary/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-1">日程が未設定です</p>
          <p className="text-muted-foreground text-sm">旅程の出発日を設定するとスケジュールが表示されます。</p>
        </div>
      ) : (
        <div className="space-y-10">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const events = dayMap.get(key) ?? [];

            return (
              <div key={key}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-none text-center w-14 py-1 rounded-xl bg-primary/10">
                    <p className="text-xs text-primary font-semibold leading-tight">
                      {format(day, "M月", { locale: ja })}
                    </p>
                    <p className="text-2xl font-serif font-bold text-primary leading-tight">
                      {format(day, "d", { locale: ja })}
                    </p>
                    <p className="text-xs text-primary/70">
                      {format(day, "EEE", { locale: ja })}
                    </p>
                  </div>
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-xs text-muted-foreground">{events.length}件</span>
                </div>

                {/* Timeline */}
                {events.length === 0 ? (
                  <div className="ml-7 pl-6 py-4 text-sm text-muted-foreground border-l border-dashed border-border">
                    予定なし
                  </div>
                ) : (
                  <div className="ml-7 space-y-3 relative before:absolute before:left-0 before:top-0 before:h-full before:w-px before:bg-gradient-to-b before:from-border before:via-border/50 before:to-transparent">
                    {events.map((ev, idx) => {
                      if (ev.kind === "activity") {
                        const meta = getActivityMeta(ev.data.activityType);
                        const Icon = meta.icon;
                        return (
                          <div key={`act-${ev.data.activityId}`} className="relative pl-6 group">
                            <div className={`absolute -left-[11px] top-5 w-5 h-5 rounded-full border-2 border-background ${meta.bg} ${meta.color} flex items-center justify-center shadow-sm`}>
                              <Icon className="w-2.5 h-2.5" />
                            </div>
                            <Card className="rounded-2xl border-border/60 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="secondary" className={`${meta.bg} ${meta.color} border-0 text-xs px-2.5 font-semibold`}>
                                      <Icon className="w-3 h-3 mr-1" />
                                      {ev.data.activityType}
                                    </Badge>
                                    {ev.data.startTime && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {getTimeLabel(ev.data.startTime)}
                                        {ev.data.endTime && ` – ${getTimeLabel(ev.data.endTime)}`}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground"
                                      onClick={() => setLocation(`/trips/${tripId}/schedule/activities/${ev.data.activityId}/edit`)}
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <DeleteActivityButton tripId={tripId} id={ev.data.activityId} />
                                  </div>
                                </div>
                                <p className="font-semibold mt-1">{ev.data.title}</p>
                                {ev.data.location && (
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 shrink-0" /> {ev.data.location}
                                  </p>
                                )}
                                {ev.data.memo && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.data.memo}</p>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        );
                      }

                      if (ev.kind === "transport") {
                        const meta = getTransportMeta(ev.data.transportationType);
                        const Icon = meta.icon;
                        return (
                          <div key={`tr-${ev.data.transportationId}`} className="relative pl-6 group">
                            <div className={`absolute -left-[11px] top-5 w-5 h-5 rounded-full border-2 border-background ${meta.bg} ${meta.color} flex items-center justify-center shadow-sm`}>
                              <Icon className="w-2.5 h-2.5" />
                            </div>
                            <Card
                              className="rounded-2xl border-border/60 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
                              onClick={() => setLocation(`/trips/${tripId}/transportation`)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary" className={`${meta.bg} ${meta.color} border-0 text-xs px-2.5 font-semibold`}>
                                    <Icon className="w-3 h-3 mr-1" />
                                    {ev.data.transportationType}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {getTimeLabel(ev.data.departureTime)}
                                  </span>
                                </div>
                                <p className="font-semibold mt-1 text-sm">
                                  {ev.data.departurePlace} → {ev.data.arrivalPlace}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">交通タブで詳細を確認</p>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      }

                      if (ev.kind === "accommodation") {
                        return (
                          <div key={`acc-${ev.data.accommodationId}`} className="relative pl-6 group">
                            <div className="absolute -left-[11px] top-5 w-5 h-5 rounded-full border-2 border-background bg-secondary/20 text-secondary flex items-center justify-center shadow-sm">
                              <Hotel className="w-2.5 h-2.5" />
                            </div>
                            <Card
                              className="rounded-2xl border-border/60 shadow-sm hover:shadow-md hover:border-secondary/30 transition-all cursor-pointer"
                              onClick={() => setLocation(`/trips/${tripId}/accommodation`)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="bg-secondary/10 text-secondary border-0 text-xs px-2.5 font-semibold">
                                    <Hotel className="w-3 h-3 mr-1" />
                                    宿泊
                                  </Badge>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {getTimeLabel(ev.data.checkIn)}
                                  </span>
                                </div>
                                <p className="font-semibold mt-1 text-sm">{ev.data.accommodationName}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">宿泊タブで詳細を確認</p>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Delete button ────────────────────────────────────────────────────────────
function DeleteActivityButton({ tripId, id }: { tripId: number; id: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const del = useDeleteActivity();

  const handle = () => {
    del.mutate({ tripId, activityId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListActivitiesQueryKey(tripId) });
        toast({ title: "削除しました" });
      },
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:bg-destructive/10">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>このアクティビティを削除しますか？</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={handle} className="rounded-full bg-destructive hover:bg-destructive/90">削除する</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Activity form ────────────────────────────────────────────────────────────
function ActivityForm({
  tripId, activityId, onCancel,
}: { tripId: number; activityId: number | null; onCancel: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const create = useCreateActivity();
  const update = useUpdateActivity();

  const { data: existing } = useGetActivity(tripId, activityId ?? 0, {
    query: { enabled: !!activityId, queryKey: getGetActivityQueryKey(tripId, activityId ?? 0) }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", activityType: "", location: "", startTime: "", endTime: "", memo: "" },
  });

  useEffect(() => {
    if (existing) {
      const toLocal = (iso: string | null | undefined) => {
        if (!iso) return "";
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      form.reset({
        title: existing.title,
        activityType: existing.activityType,
        location: existing.location ?? "",
        startTime: toLocal(existing.startTime),
        endTime: toLocal(existing.endTime),
        memo: existing.memo ?? "",
      });
    }
  }, [existing]);

  const onSubmit = (data: FormValues) => {
    const payload = {
      title: data.title,
      activityType: data.activityType,
      location: data.location || undefined,
      startTime: data.startTime ? new Date(data.startTime).toISOString() : undefined,
      endTime: data.endTime ? new Date(data.endTime).toISOString() : undefined,
      memo: data.memo || undefined,
    };

    if (activityId) {
      update.mutate({ tripId, activityId, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListActivitiesQueryKey(tripId) });
          toast({ title: "アクティビティを更新しました" });
          onCancel();
        },
      });
    } else {
      create.mutate({ tripId, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListActivitiesQueryKey(tripId) });
          toast({ title: "アクティビティを追加しました" });
          onCancel();
        },
      });
    }
  };

  const activityTypes: ActivityType[] = ["観光", "食事", "ショッピング", "自由時間", "その他"];

  return (
    <Card className="rounded-3xl shadow-sm border-border/50 max-w-xl mx-auto animate-in fade-in duration-300">
      <CardContent className="p-6 md:p-8">
        <h3 className="text-2xl font-serif font-bold mb-6">
          {activityId ? "アクティビティを編集" : "アクティビティを追加"}
        </h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>タイトル</FormLabel>
                <FormControl><Input className="h-12 bg-muted/20 rounded-xl" placeholder="例：清水寺を観光" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="activityType" render={({ field }) => (
              <FormItem>
                <FormLabel>種類</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-muted/20">
                      <SelectValue placeholder="アクティビティの種類を選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem>
                <FormLabel>場所（任意）</FormLabel>
                <FormControl><Input className="h-12 bg-muted/20 rounded-xl" placeholder="例：京都府東山区清水1-294" {...field} /></FormControl>
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startTime" render={({ field }) => (
                <FormItem>
                  <FormLabel>開始時刻（任意）</FormLabel>
                  <FormControl><Input type="datetime-local" className="h-12 bg-muted/20 rounded-xl" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="endTime" render={({ field }) => (
                <FormItem>
                  <FormLabel>終了時刻（任意）</FormLabel>
                  <FormControl><Input type="datetime-local" className="h-12 bg-muted/20 rounded-xl" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="memo" render={({ field }) => (
              <FormItem>
                <FormLabel>メモ（任意）</FormLabel>
                <FormControl>
                  <Textarea className="min-h-[80px] bg-muted/20 rounded-xl resize-y" placeholder="メモや備考など" {...field} />
                </FormControl>
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" type="button" onClick={onCancel} className="rounded-full">キャンセル</Button>
              <Button type="submit" disabled={create.isPending || update.isPending} className="rounded-full px-6">
                {(create.isPending || update.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {activityId ? "更新する" : "追加する"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
