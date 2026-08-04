import { useState } from "react";
import { Link } from "wouter";
import { useListTrips } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Calendar as CalendarIcon, LayoutGrid, Plus, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function Trips() {
  const { data: trips, isLoading, error } = useListTrips();
  const [view, setView] = useState<"grid" | "calendar">("grid");
  const [date, setDate] = useState<Date | undefined>(new Date());

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center mb-8">
          <div className="h-10 w-32 bg-muted rounded-md"></div>
          <div className="h-10 w-24 bg-muted rounded-md"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-muted rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  if (error || !trips) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-serif font-bold text-destructive mb-2">旅程を読み込めませんでした</h2>
        <p className="text-muted-foreground">ページを更新してもう一度お試しください。</p>
      </div>
    );
  }

  const tripsOnSelectedDate = date 
    ? trips.filter(t => format(new Date(t.tripDate), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))
    : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">旅程一覧</h1>
          <p className="text-muted-foreground mt-1">すべての旅をひとつの場所で管理。</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as "grid" | "calendar")} className="w-[120px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid"><LayoutGrid className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="calendar"><CalendarIcon className="w-4 h-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
          <Link href="/trips/new">
            <Button className="rounded-full gap-2 shadow-sm hover-elevate">
              <Plus className="w-4 h-4" />
              新規作成
            </Button>
          </Link>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-24 px-4 bg-muted/30 border border-dashed border-border rounded-3xl mt-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-primary/40">
            <Map className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-serif font-bold mb-3">旅程がありません</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">次はどこへ？夢の目的地を計画してみましょう。</p>
          <Link href="/trips/new">
            <Button size="lg" className="rounded-full px-8 shadow-sm">旅を計画する</Button>
          </Link>
        </div>
      ) : (
        <>
          {view === "grid" ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map(trip => (
                <Link key={trip.tripId} href={`/trips/${trip.tripId}`}>
                  <Card className="rounded-2xl border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group h-full hover:-translate-y-1">
                    <div className="h-32 bg-secondary/5 rounded-t-2xl border-b border-border/50 relative overflow-hidden group-hover:bg-secondary/10 transition-colors">
                      <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                         <Map className="w-32 h-32 rotate-[-12deg]" />
                      </div>
                    </div>
                    <CardContent className="pt-6 relative">
                      <div className="absolute -top-6 right-6 w-12 h-12 bg-white rounded-xl shadow-sm border border-border/50 flex flex-col items-center justify-center text-secondary font-bold leading-none">
                        <span className="text-lg">{format(new Date(trip.tripDate), "d")}</span>
                        <span className="text-[10px] uppercase tracking-wider">{format(new Date(trip.tripDate), "MMM", { locale: ja })}</span>
                      </div>
                      <h3 className="font-serif font-bold text-xl mb-2 group-hover:text-primary transition-colors line-clamp-1">{trip.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-4">
                        <CalendarIcon className="w-4 h-4" />
                        {format(new Date(trip.tripDate), "yyyy年M月d日", { locale: ja })}
                      </p>
                      {trip.memo && (
                        <p className="text-sm text-muted-foreground line-clamp-2 border-l-2 border-muted pl-3">{trip.memo}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-12 gap-8">
              <div className="md:col-span-5 lg:col-span-4">
                <Card className="rounded-3xl border-none shadow-md overflow-hidden">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="p-4"
                    locale={ja}
                    modifiers={{
                      hasTrip: trips.map(t => new Date(t.tripDate))
                    }}
                    modifiersStyles={{
                      hasTrip: { fontWeight: 'bold', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '100%' }
                    }}
                  />
                </Card>
              </div>
              <div className="md:col-span-7 lg:col-span-8">
                <h3 className="text-2xl font-serif font-bold mb-6">
                  {date ? format(date, "yyyy年M月d日（E）", { locale: ja }) : "日付を選択"}
                </h3>
                
                {tripsOnSelectedDate.length > 0 ? (
                  <div className="space-y-4">
                    {tripsOnSelectedDate.map(trip => (
                      <Link key={trip.tripId} href={`/trips/${trip.tripId}`}>
                        <Card className="rounded-2xl border-border hover:border-primary/50 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1">
                          <CardContent className="p-6 flex items-center justify-between">
                            <div>
                              <h4 className="font-serif font-bold text-xl mb-1 group-hover:text-primary transition-colors">{trip.title}</h4>
                              <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                                <CalendarIcon className="w-4 h-4" /> {format(new Date(trip.tripDate), "yyyy年M月d日", { locale: ja })}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                              <ArrowRight className="w-5 h-5 text-primary" />
                            </Button>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-muted/20 rounded-3xl border border-dashed border-border">
                    <p className="text-muted-foreground">この日に予定されている旅程はありません。</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
