import { useGetDashboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Map, Plane, Wallet, Calendar, ArrowRight, Plus } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function Dashboard() {
  const { data: dashboard, isLoading, error } = useGetDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-md mb-8"></div>
        <div className="grid md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-2xl"></div>)}
        </div>
        <div className="h-64 bg-muted rounded-2xl mt-8"></div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-serif font-bold text-destructive mb-2">ダッシュボードを読み込めませんでした</h2>
        <p className="text-muted-foreground">ページを更新してもう一度お試しください。</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-muted-foreground mt-1">あなたの旅のまとめです。</p>
        </div>
        <Link href="/trips/new" className={buttonVariants({ className: "rounded-full gap-2 shadow-md hover-elevate px-6" })}>
          <Plus className="w-4 h-4" />
          新しい旅を計画
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="rounded-2xl border-none shadow-sm bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> 予定の旅
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif text-primary">{dashboard.upcomingTrips}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-secondary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Map className="w-4 h-4 text-secondary" /> 総旅程数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif text-secondary">{dashboard.totalTrips}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Plane className="w-4 h-4" /> 過去の旅
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{dashboard.pastTrips}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-chart-3/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4 text-chart-3" /> 総支出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif text-foreground">
              ¥{dashboard.totalExpenseAllTime.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trips */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold">最近の旅程</h2>
          <Link href="/trips" className={buttonVariants({ variant: "ghost", className: "text-primary hover:text-primary/80 gap-1 hover-elevate" })}>
            すべて見る <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {dashboard.recentTrips.length === 0 ? (
          <div className="text-center py-16 px-4 bg-muted/30 border border-dashed border-border rounded-3xl">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-primary/40">
              <Map className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold mb-2">旅程がまだありません</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">旅の記録がまだありません。最初の旅を計画してみましょう！</p>
            <Link href="/trips/new">
              <Button className="rounded-full px-8 shadow-sm">旅程を作成</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboard.recentTrips.map(trip => (
              <Link key={trip.tripId} href={`/trips/${trip.tripId}`}>
                <Card className="rounded-2xl border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group h-full hover:-translate-y-1">
                  <div className="h-32 bg-primary/5 rounded-t-2xl border-b border-border/50 relative overflow-hidden group-hover:bg-primary/10 transition-colors">
                    <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                       <Map className="w-24 h-24 rotate-12" />
                    </div>
                  </div>
                  <CardContent className="pt-6 relative">
                    <div className="absolute -top-6 right-6 w-12 h-12 bg-white rounded-xl shadow-sm border border-border/50 flex flex-col items-center justify-center text-primary font-bold leading-none">
                      <span className="text-lg">{format(new Date(trip.tripDate), "d")}</span>
                      <span className="text-[10px] uppercase tracking-wider">{format(new Date(trip.tripDate), "MMM", { locale: ja })}</span>
                    </div>
                    <h3 className="font-serif font-bold text-xl mb-1 group-hover:text-primary transition-colors line-clamp-1">{trip.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(trip.tripDate), "yyyy年M月d日", { locale: ja })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
