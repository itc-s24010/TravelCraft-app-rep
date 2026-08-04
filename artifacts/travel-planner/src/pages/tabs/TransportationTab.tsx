import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, differenceInMinutes } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Loader2, Plus, Train, Plane, Bus, Car, Ship, ArrowRight,
  Clock, Edit2, Trash2, Ticket
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useListTransportation, useCreateTransportation, useUpdateTransportation,
  useDeleteTransportation, useGetTransportation,
  getListTransportationQueryKey, getGetTransportationQueryKey
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  transportationType: z.string().min(1, "種類を選択してください"),
  departurePlace: z.string().min(1, "出発地は必須です"),
  arrivalPlace: z.string().min(1, "到着地は必須です"),
  departureTime: z.string().min(1, "出発時刻は必須です"),
  arrivalTime: z.string().min(1, "到着時刻は必須です"),
  fare: z.coerce.number().min(0),
});
type FormValues = z.infer<typeof formSchema>;

const TYPE_META: Record<string, { icon: React.FC<{className?: string}>, color: string, bg: string }> = {
  飛行機:    { icon: Plane,  color: "text-sky-600",    bg: "bg-sky-50" },
  新幹線:    { icon: Train,  color: "text-emerald-600", bg: "bg-emerald-50" },
  電車:      { icon: Train,  color: "text-violet-600",  bg: "bg-violet-50" },
  バス:      { icon: Bus,    color: "text-amber-600",   bg: "bg-amber-50" },
  レンタカー:{ icon: Car,    color: "text-rose-600",    bg: "bg-rose-50" },
  船:        { icon: Ship,   color: "text-blue-600",    bg: "bg-blue-50" },
};

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? { icon: Ticket, color: "text-muted-foreground", bg: "bg-muted/30" };
}

function formatDuration(depTime: string, arrTime: string) {
  const mins = differenceInMinutes(new Date(arrTime), new Date(depTime));
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}時間${m > 0 ? m + "分" : ""}` : `${m}分`;
}

function groupByDate(list: any[]) {
  const map = new Map<string, any[]>();
  for (const item of list) {
    const key = format(new Date(item.departureTime), "yyyy-MM-dd");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

export default function TransportationTab() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const tripId = parseInt(params.tripId || "0");
  const transportationId = params.transportationId ? parseInt(params.transportationId) : null;
  const isForm = location.endsWith("/new") || location.includes("/edit");

  const { data: list, isLoading } = useListTransportation(tripId, {
    query: { enabled: !isForm, queryKey: getListTransportationQueryKey(tripId) }
  });

  if (isForm) {
    return (
      <TransportationForm
        tripId={tripId}
        transportationId={transportationId}
        onCancel={() => setLocation(`/trips/${tripId}/transportation`)}
      />
    );
  }

  if (isLoading) {
    return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const sorted = [...(list ?? [])].sort(
    (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
  );
  const grouped = groupByDate(sorted);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-serif font-bold">交通スケジュール</h3>
        <Button
          onClick={() => setLocation(`/trips/${tripId}/transportation/new`)}
          className="rounded-full shadow-sm hover-elevate"
        >
          <Plus className="w-4 h-4 mr-2" /> 追加
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 border border-dashed border-border rounded-3xl">
          <Train className="w-12 h-12 text-primary/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-1">交通情報がまだありません</p>
          <p className="text-muted-foreground text-sm">フライト・電車・バスなどを追加してスケジュールを管理しましょう。</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([dateKey, items]) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-none text-center w-14 py-1 rounded-xl bg-primary/10">
                  <p className="text-xs text-primary font-semibold leading-tight">
                    {format(new Date(dateKey), "M月", { locale: ja })}
                  </p>
                  <p className="text-2xl font-serif font-bold text-primary leading-tight">
                    {format(new Date(dateKey), "d", { locale: ja })}
                  </p>
                  <p className="text-xs text-primary/70">
                    {format(new Date(dateKey), "EEE", { locale: ja })}
                  </p>
                </div>
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-xs text-muted-foreground">{items.length}件</span>
              </div>

              {/* Timeline */}
              <div className="ml-7 space-y-3 relative before:absolute before:left-0 before:top-0 before:h-full before:w-px before:bg-gradient-to-b before:from-border before:via-border/50 before:to-transparent">
                {items.map((item: any) => {
                  const meta = getTypeMeta(item.transportationType);
                  const TypeIcon = meta.icon;
                  const duration = formatDuration(item.departureTime, item.arrivalTime);

                  return (
                    <div key={item.transportationId} className="relative pl-6 group">
                      {/* Dot on timeline */}
                      <div className={`absolute -left-[11px] top-5 w-5 h-5 rounded-full border-2 border-background ${meta.bg} ${meta.color} flex items-center justify-center shadow-sm`}>
                        <TypeIcon className="w-2.5 h-2.5" />
                      </div>

                      <Card className="rounded-2xl border-border/60 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <Badge
                              variant="secondary"
                              className={`${meta.bg} ${meta.color} border-0 font-semibold text-xs px-2.5`}
                            >
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {item.transportationType}
                            </Badge>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground"
                                onClick={() => setLocation(`/trips/${tripId}/transportation/${item.transportationId}/edit`)}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <DeleteTransportButton tripId={tripId} id={item.transportationId} />
                            </div>
                          </div>

                          {/* Route row */}
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                            <div>
                              <p className="text-base font-bold font-serif leading-tight">{item.departurePlace}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3 shrink-0" />
                                {format(new Date(item.departureTime), "HH:mm")}
                              </p>
                            </div>

                            <div className="flex flex-col items-center gap-0.5 px-1">
                              {duration && (
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{duration}</span>
                              )}
                              <div className="flex items-center gap-1 w-full">
                                <div className="flex-1 h-px bg-border" />
                                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-base font-bold font-serif leading-tight">{item.arrivalPlace}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
                                <Clock className="w-3 h-3 shrink-0" />
                                {format(new Date(item.arrivalTime), "HH:mm")}
                              </p>
                            </div>
                          </div>

                          {item.fare > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-end gap-1.5">
                              <Ticket className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm font-semibold">¥{item.fare.toLocaleString()}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteTransportButton({ tripId, id }: { tripId: number; id: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const del = useDeleteTransportation();

  const handle = () => {
    del.mutate({ tripId, transportationId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransportationQueryKey(tripId) });
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
          <AlertDialogTitle>この交通情報を削除しますか？</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={handle} className="rounded-full bg-destructive hover:bg-destructive/90">削除する</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function TransportationForm({
  tripId, transportationId, onCancel,
}: { tripId: number; transportationId: number | null; onCancel: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const create = useCreateTransportation();
  const update = useUpdateTransportation();

  const { data: existing } = useGetTransportation(tripId, transportationId ?? 0, {
    query: { enabled: !!transportationId, queryKey: getGetTransportationQueryKey(tripId, transportationId ?? 0) }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transportationType: "", departurePlace: "", arrivalPlace: "",
      departureTime: "", arrivalTime: "", fare: 0,
    },
  });

  useEffect(() => {
    if (existing) {
      const toLocal = (iso: string) => {
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      form.reset({
        transportationType: existing.transportationType,
        departurePlace: existing.departurePlace,
        arrivalPlace: existing.arrivalPlace,
        departureTime: toLocal(existing.departureTime),
        arrivalTime: toLocal(existing.arrivalTime),
        fare: existing.fare,
      });
    }
  }, [existing]);

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      departureTime: new Date(data.departureTime).toISOString(),
      arrivalTime: new Date(data.arrivalTime).toISOString(),
    };
    if (transportationId) {
      update.mutate({ tripId, transportationId, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTransportationQueryKey(tripId) });
          toast({ title: "交通情報を更新しました" });
          onCancel();
        },
      });
    } else {
      create.mutate({ tripId, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTransportationQueryKey(tripId) });
          toast({ title: "交通情報を追加しました" });
          onCancel();
        },
      });
    }
  };

  const transportTypes = ["飛行機", "新幹線", "電車", "バス", "レンタカー", "船"];

  return (
    <Card className="rounded-3xl shadow-sm border-border/50 max-w-xl mx-auto animate-in fade-in duration-300">
      <CardContent className="p-6 md:p-8">
        <h3 className="text-2xl font-serif font-bold mb-6">
          {transportationId ? "交通情報を編集" : "交通情報を追加"}
        </h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="transportationType" render={({ field }) => (
              <FormItem>
                <FormLabel>種類</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-muted/20">
                      <SelectValue placeholder="交通手段を選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {transportTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="departurePlace" render={({ field }) => (
                <FormItem><FormLabel>出発地</FormLabel><FormControl><Input className="h-12 bg-muted/20" placeholder="東京" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="arrivalPlace" render={({ field }) => (
                <FormItem><FormLabel>到着地</FormLabel><FormControl><Input className="h-12 bg-muted/20" placeholder="大阪" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="departureTime" render={({ field }) => (
                <FormItem><FormLabel>出発時刻</FormLabel><FormControl><Input type="datetime-local" className="h-12 bg-muted/20" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="arrivalTime" render={({ field }) => (
                <FormItem><FormLabel>到着時刻</FormLabel><FormControl><Input type="datetime-local" className="h-12 bg-muted/20" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="fare" render={({ field }) => (
              <FormItem><FormLabel>運賃（¥）</FormLabel><FormControl><Input type="number" className="h-12 bg-muted/20" {...field} /></FormControl></FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" type="button" onClick={onCancel} className="rounded-full">キャンセル</Button>
              <Button type="submit" disabled={create.isPending || update.isPending} className="rounded-full px-6">
                {(create.isPending || update.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {transportationId ? "更新する" : "追加する"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
