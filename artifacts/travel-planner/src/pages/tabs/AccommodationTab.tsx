import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Loader2, Plus, Hotel, MapPin, Calendar, Edit2, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useListAccommodation, useCreateAccommodation, useUpdateAccommodation, useDeleteAccommodation, useGetAccommodation, getListAccommodationQueryKey, getGetAccommodationQueryKey } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  accommodationName: z.string().min(1, "名前は必須です"),
  address: z.string().min(1, "住所は必須です"),
  checkIn: z.string().min(1, "チェックインは必須です"),
  checkOut: z.string().min(1, "チェックアウトは必須です"),
  reservationNumber: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AccommodationTab() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const tripId = parseInt(params.tripId || "0");
  const accId = params.accommodationId ? parseInt(params.accommodationId) : null;
  const isForm = location.endsWith("/new") || location.includes("/edit");

  const { data: list, isLoading } = useListAccommodation(tripId, {
    query: { enabled: !isForm, queryKey: getListAccommodationQueryKey(tripId) }
  });

  if (isForm) return <AccommodationForm tripId={tripId} accId={accId} onCancel={() => setLocation(`/trips/${tripId}/accommodation`)} />;

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-serif font-bold">宿泊先</h3>
        <Button onClick={() => setLocation(`/trips/${tripId}/accommodation/new`)} className="rounded-full shadow-sm hover-elevate bg-secondary hover:bg-secondary/90 text-secondary-foreground">
          <Plus className="w-4 h-4 mr-2" /> 宿泊先を追加
        </Button>
      </div>

      {!list || list.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 border border-dashed border-border rounded-3xl">
          <Hotel className="w-12 h-12 text-secondary/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-1">宿泊先がまだありません</p>
          <p className="text-muted-foreground text-sm">ホテルや宿泊施設の情報を追加して管理しましょう。</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {list.map(item => (
            <Card key={item.accommodationId} className="rounded-2xl shadow-sm border-border/60 hover:shadow-md hover:border-secondary/30 transition-all group overflow-hidden">
              <div className="h-16 bg-secondary/10 flex items-center px-5 gap-3 border-b border-border/50 relative overflow-hidden">
                <Hotel className="w-6 h-6 text-secondary z-10" />
                <h4 className="font-serif font-bold text-lg z-10 line-clamp-1">{item.accommodationName}</h4>
                <div className="absolute right-4 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="icon" className="w-8 h-8 rounded-full bg-white/50 hover:bg-white" onClick={() => setLocation(`/trips/${tripId}/accommodation/${item.accommodationId}/edit`)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <DeleteAccButton tripId={tripId} id={item.accommodationId} />
                </div>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="flex gap-3 items-start text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-foreground leading-snug">{item.address}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">チェックイン</p>
                    <p className="text-sm font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(new Date(item.checkIn), "M月d日", { locale: ja })}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-5">{format(new Date(item.checkIn), "HH:mm")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">チェックアウト</p>
                    <p className="text-sm font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(new Date(item.checkOut), "M月d日", { locale: ja })}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-5">{format(new Date(item.checkOut), "HH:mm")}</p>
                  </div>
                </div>
                {item.reservationNumber && (
                  <div className="pt-3">
                    <p className="text-xs text-muted-foreground">予約番号 <span className="font-mono text-foreground font-medium ml-1 bg-muted px-1.5 py-0.5 rounded">{item.reservationNumber}</span></p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteAccButton({ tripId, id }: { tripId: number, id: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const del = useDeleteAccommodation();

  const handle = () => {
    del.mutate({ tripId, accommodationId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAccommodationQueryKey(tripId) });
        toast({ title: "削除しました" });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="secondary" size="icon" className="w-8 h-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="w-4 h-4" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>宿泊情報を削除しますか？</AlertDialogTitle></AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={handle} className="bg-destructive text-destructive-foreground">削除する</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AccommodationForm({ tripId, accId, onCancel }: { tripId: number, accId: number | null, onCancel: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!accId;

  const { data: item, isLoading } = useGetAccommodation(tripId, accId || 0, {
    query: { enabled: isEditing, queryKey: getGetAccommodationQueryKey(tripId, accId || 0) }
  });

  const create = useCreateAccommodation();
  const update = useUpdateAccommodation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { accommodationName: "", address: "", checkIn: "", checkOut: "", reservationNumber: "" },
  });

  useEffect(() => {
    if (isEditing && item) {
      form.reset({
        accommodationName: item.accommodationName,
        address: item.address,
        checkIn: format(new Date(item.checkIn), "yyyy-MM-dd'T'HH:mm"),
        checkOut: format(new Date(item.checkOut), "yyyy-MM-dd'T'HH:mm"),
        reservationNumber: item.reservationNumber || "",
      });
    }
  }, [isEditing, item, form]);

  const onSubmit = (data: FormValues) => {
    const payload = { ...data, checkIn: new Date(data.checkIn).toISOString(), checkOut: new Date(data.checkOut).toISOString() };
    if (isEditing) {
      update.mutate({ tripId, accommodationId: accId!, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAccommodationQueryKey(tripId) });
          toast({ title: "更新しました" });
          onCancel();
        }
      });
    } else {
      create.mutate({ tripId, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAccommodationQueryKey(tripId) });
          toast({ title: "追加しました" });
          onCancel();
        }
      });
    }
  };

  if (isEditing && isLoading) return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>;

  return (
    <Card className="rounded-3xl shadow-sm border-border/50">
      <CardContent className="p-6 md:p-8">
        <h3 className="text-2xl font-serif font-bold mb-6">{isEditing ? "宿泊先を編集" : "宿泊先を追加"}</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="accommodationName" render={({ field }) => (
              <FormItem><FormLabel>施設名</FormLabel><FormControl><Input className="h-12 rounded-xl bg-muted/20" placeholder="例：京都グランドホテル" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem><FormLabel>住所</FormLabel><FormControl><Input className="h-12 rounded-xl bg-muted/20" placeholder="例：京都府京都市..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="checkIn" render={({ field }) => (
                <FormItem><FormLabel>チェックイン日時</FormLabel><FormControl><Input type="datetime-local" className="h-12 rounded-xl bg-muted/20" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="checkOut" render={({ field }) => (
                <FormItem><FormLabel>チェックアウト日時</FormLabel><FormControl><Input type="datetime-local" className="h-12 rounded-xl bg-muted/20" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="reservationNumber" render={({ field }) => (
              <FormItem><FormLabel>予約番号（任意）</FormLabel><FormControl><Input className="h-12 rounded-xl bg-muted/20" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={onCancel} className="rounded-full">キャンセル</Button>
              <Button type="submit" disabled={create.isPending || update.isPending} className="rounded-full shadow-sm bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8">
                {(create.isPending || update.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} 保存
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
