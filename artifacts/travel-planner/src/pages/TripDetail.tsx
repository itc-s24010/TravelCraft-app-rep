import { useLocation, useParams, Link } from "wouter";
import { useGetTrip, useDeleteTrip, getGetTripQueryKey, getListTripsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, Users, Map, Trash2, Edit3, ArrowLeft, Train, Hotel, Wallet, Bell, Loader2, CalendarDays } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

import TransportationTab from "./tabs/TransportationTab";
import AccommodationTab from "./tabs/AccommodationTab";
import BudgetTab from "./tabs/BudgetTab";
import NotificationsTab from "./tabs/NotificationsTab";
import ScheduleTab from "./tabs/ScheduleTab";

export default function TripDetail() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const tripId = parseInt(params.tripId || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: trip, isLoading, error } = useGetTrip(tripId, {
    query: { enabled: !!tripId, queryKey: getGetTripQueryKey(tripId) }
  });

  const deleteTrip = useDeleteTrip();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-serif font-bold text-destructive mb-2">旅程が見つかりません</h2>
        <Button onClick={() => setLocation("/trips")} variant="outline" className="mt-4">旅程一覧に戻る</Button>
      </div>
    );
  }

  const handleDelete = () => {
    deleteTrip.mutate({ tripId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
        toast({ title: "旅程を削除しました" });
        setLocation("/trips");
      },
      onError: () => {
        toast({ title: "削除に失敗しました", variant: "destructive" });
      }
    });
  };

  const tabs = [
    { label: "概要", path: `/trips/${tripId}`, icon: Map },
    { label: "スケジュール", path: `/trips/${tripId}/schedule`, icon: CalendarDays },
    { label: "交通", path: `/trips/${tripId}/transportation`, icon: Train },
    { label: "宿泊", path: `/trips/${tripId}/accommodation`, icon: Hotel },
    { label: "予算", path: `/trips/${tripId}/budget`, icon: Wallet },
    { label: "通知", path: `/trips/${tripId}/notifications`, icon: Bell },
  ];

  const isTabActive = (path: string) => {
    if (path === `/trips/${tripId}`) return location === path;
    return location.startsWith(path);
  };

  // Active tab content
  const getTabContent = () => {
    if (location.startsWith(`/trips/${tripId}/schedule`)) return <ScheduleTab tripDate={trip.tripDate} endDate={trip.endDate} />;
    if (location.startsWith(`/trips/${tripId}/transportation`)) return <TransportationTab />;
    if (location.startsWith(`/trips/${tripId}/accommodation`)) return <AccommodationTab />;
    if (location.startsWith(`/trips/${tripId}/budget`) || location.startsWith(`/trips/${tripId}/expenses`)) return <BudgetTab />;
    if (location.startsWith(`/trips/${tripId}/notifications`)) return <NotificationsTab />;
    // Overview tab
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {trip.memo && (
          <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
            <h4 className="font-semibold mb-2 text-muted-foreground text-sm uppercase tracking-wide">メモ</h4>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{trip.memo}</p>
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tabs.slice(1).map(tab => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.path}
                variant="outline"
                className="h-20 rounded-2xl flex flex-col gap-2 border-border/60 hover:border-primary/40 hover:shadow-md transition-all"
                onClick={() => setLocation(tab.path)}
              >
                <Icon className="w-6 h-6 text-primary" />
                <span className="font-medium">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-primary/5 p-8 border border-primary/10">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/trips")} className="-ml-3 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> 旅程一覧に戻る
            </Button>
            <div>
              <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight text-foreground">{trip.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <Badge variant="secondary" className="bg-white/60 hover:bg-white/80 text-foreground text-sm py-1.5 px-3">
                  <Calendar className="w-4 h-4 mr-2 text-primary" />
                  {format(new Date(trip.tripDate), "yyyy年M月d日（E）", { locale: ja })}
                </Badge>
                {trip.companions && (
                  <Badge variant="secondary" className="bg-white/60 hover:bg-white/80 text-foreground text-sm py-1.5 px-3">
                    <Users className="w-4 h-4 mr-2 text-secondary" />
                    {trip.companions}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href={`/trips/${tripId}/edit`}>
              <Button variant="outline" className="rounded-full bg-white/80 hover:bg-white gap-2 border-border/50">
                <Edit3 className="w-4 h-4" /> 編集
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="rounded-full bg-white/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 gap-2 border-border/50 text-destructive">
                  <Trash2 className="w-4 h-4" /> 削除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>この旅程を削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    この操作は元に戻せません。交通・宿泊・予算などすべての関連データも削除されます。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full">
                    削除する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto pb-2 scrollbar-hide border-b border-border">
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => {
            const active = isTabActive(tab.path);
            const Icon = tab.icon;
            return (
              <Button
                key={tab.path}
                variant="ghost"
                onClick={() => setLocation(tab.path)}
                className={`rounded-full px-5 gap-2 transition-all ${
                  active 
                    ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background shadow-md" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      {getTabContent()}
    </div>
  );
}
