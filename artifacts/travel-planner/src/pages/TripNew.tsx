import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react";
import { useCreateTrip, useUpdateTrip, useGetTrip, getGetTripQueryKey, getListTripsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(200),
  tripDate: z.date({
    required_error: "日付を選択してください。",
  }),
  endDate: z.date().optional(),
  memo: z.string().optional(),
  companions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function TripNew() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEditing = !!params.tripId;
  const tripId = isEditing ? parseInt(params.tripId!) : 0;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: trip, isLoading: isTripLoading } = useGetTrip(tripId, {
    query: { enabled: isEditing, queryKey: getGetTripQueryKey(tripId) }
  });

  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      tripDate: new Date(),
      endDate: undefined,
      memo: "",
      companions: "",
    },
  });

  useEffect(() => {
    if (isEditing && trip) {
      form.reset({
        title: trip.title,
        tripDate: new Date(trip.tripDate),
        endDate: trip.endDate ? new Date(trip.endDate) : undefined,
        memo: trip.memo || "",
        companions: trip.companions || "",
      });
    }
  }, [isEditing, trip, form]);

  const onSubmit = (data: FormValues) => {
    const formattedData = {
      ...data,
      tripDate: format(data.tripDate, "yyyy-MM-dd"),
      ...(data.endDate ? { endDate: format(data.endDate, "yyyy-MM-dd") } : { endDate: null as any }),
    };

    if (isEditing) {
      updateTrip.mutate({ tripId, data: formattedData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(tripId) });
          queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
          toast({ title: "旅程を更新しました" });
          setLocation(`/trips/${tripId}`);
        },
        onError: () => {
          toast({ title: "更新に失敗しました", variant: "destructive" });
        }
      });
    } else {
      createTrip.mutate({ data: formattedData }, {
        onSuccess: (newTrip) => {
          queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
          toast({ title: "旅程を作成しました" });
          setLocation(`/trips/${newTrip.tripId}`);
        },
        onError: () => {
          toast({ title: "作成に失敗しました", variant: "destructive" });
        }
      });
    }
  };

  if (isEditing && isTripLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation(isEditing ? `/trips/${tripId}` : "/trips")} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">
            {isEditing ? "旅程を編集" : "新しい旅を計画"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? "旅の詳細を更新します。" : "新しい冒険をはじめましょう。"}
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">目的地 / 旅程タイトル</FormLabel>
                    <FormControl>
                      <Input placeholder="例：京都の夏旅" className="h-14 text-lg rounded-xl bg-muted/20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="tripDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-base font-semibold mb-2">出発日</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "h-14 rounded-xl px-4 text-left font-normal bg-muted/20",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "yyyy年M月d日", { locale: ja })
                              ) : (
                                <span>日付を選択</span>
                              )}
                              <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              // Clear endDate if it's before the new tripDate
                              const endDate = form.getValues("endDate");
                              if (endDate && date && endDate < date) {
                                form.setValue("endDate", undefined);
                              }
                            }}
                            locale={ja}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-base font-semibold mb-2">終了日（任意）</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "h-14 rounded-xl px-4 text-left font-normal bg-muted/20",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "yyyy年M月d日", { locale: ja })
                              ) : (
                                <span>日付を選択</span>
                              )}
                              <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const tripDate = form.getValues("tripDate");
                              return tripDate ? date < tripDate : false;
                            }}
                            locale={ja}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="companions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">同行者（任意）</FormLabel>
                    <FormControl>
                      <Input placeholder="誰と行きますか？" className="h-14 rounded-xl bg-muted/20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="memo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">メモ（任意）</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="旅全体のメモや特別な計画など" 
                        className="min-h-[120px] rounded-xl bg-muted/20 resize-y" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex justify-end gap-4 border-t border-border/50">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="rounded-full px-6"
                  onClick={() => setLocation(isEditing ? `/trips/${tripId}` : "/trips")}
                >
                  キャンセル
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-full px-8 shadow-md"
                  disabled={createTrip.isPending || updateTrip.isPending}
                >
                  {createTrip.isPending || updateTrip.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {isEditing ? "変更を保存" : "旅程を作成"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
