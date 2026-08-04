import { useState } from "react";
import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Loader2, Plus, Clock, Trash2, BellRing } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useListNotifications, useCreateNotification, useDeleteNotification, getListNotificationsQueryKey } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  reminder: z.string().min(1, "リマインダーのテキストは必須です"),
  notificationDatetime: z.string().min(1, "日時は必須です"),
});

export default function NotificationsTab() {
  const params = useParams();
  const tripId = parseInt(params.tripId || "0");
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: list, isLoading } = useListNotifications(tripId, {
    query: { queryKey: getListNotificationsQueryKey(tripId) }
  });

  const create = useCreateNotification();
  const del = useDeleteNotification();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { reminder: "", notificationDatetime: "" }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    create.mutate({ tripId, data: { ...data, notificationDatetime: new Date(data.notificationDatetime).toISOString(), notificationType: "custom" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey(tripId) });
        toast({ title: "リマインダーを追加しました" });
        setShowForm(false);
        form.reset();
      }
    });
  };

  const handleDelete = (id: number) => {
    del.mutate({ tripId, notificationId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey(tripId) });
        toast({ title: "リマインダーを削除しました" });
      }
    });
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-chart-5" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-serif font-bold">通知・リマインダー</h3>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} className={`rounded-full shadow-sm ${!showForm ? 'bg-chart-5 hover:bg-chart-5/90 text-white hover-elevate' : ''}`}>
          {showForm ? "キャンセル" : <><Plus className="w-4 h-4 mr-2" /> リマインダーを追加</>}
        </Button>
      </div>

      {showForm && (
        <Card className="rounded-3xl shadow-sm border-border/50 bg-chart-5/5 mb-6">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-end">
                <FormField control={form.control} name="reminder" render={({ field }) => (
                  <FormItem className="flex-1 w-full"><FormLabel>リマインダー内容</FormLabel><FormControl><Input className="bg-white" placeholder="例：オンラインチェックイン" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="notificationDatetime" render={({ field }) => (
                  <FormItem className="w-full md:w-64"><FormLabel>通知日時</FormLabel><FormControl><Input className="bg-white" type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={create.isPending} className="w-full md:w-auto bg-chart-5 hover:bg-chart-5/90 text-white">
                  {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} 保存
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {!list || list.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 border border-dashed border-border rounded-3xl">
          <BellRing className="w-12 h-12 text-chart-5/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-1">リマインダーがまだありません</p>
          <p className="text-muted-foreground text-sm">フライトや活動など、忘れてはいけないことに通知を設定しましょう。</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(item => (
            <Card key={item.notificationId} className="rounded-2xl border-border/60 shadow-sm flex flex-row items-center overflow-hidden">
              <div className="w-2 h-full bg-chart-5/50 self-stretch"></div>
              <CardContent className="p-4 flex-1 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{item.reminder}</p>
                  {item.notificationDatetime && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {format(new Date(item.notificationDatetime), "M月d日 HH:mm", { locale: ja })}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2" onClick={() => handleDelete(item.notificationId)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
