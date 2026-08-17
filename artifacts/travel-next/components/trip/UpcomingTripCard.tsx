"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Trip } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface UpcomingTripCardProps {
  trips: Trip[];
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isToday: boolean;
  isPast: boolean;
}

export function UpcomingTripCard({ trips }: UpcomingTripCardProps) {
  const upcomingTrip = getClosestTrip(trips);
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  const tripDateStr = upcomingTrip?.tripDate;
  const tripId = upcomingTrip?.tripId;

  useEffect(() => {
    if (!tripDateStr) return;
    const dateStr = tripDateStr;

    function update() {
      const parts = dateStr.split("-").map(Number);
      
      let targetDate: Date;
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        targetDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
      } else {
        targetDate = new Date(dateStr);
      }

      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();

      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
      const isToday = startOfToday === startOfTarget;

      if (isToday) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isToday: true, isPast: false });
        return;
      }

      if (diffMs < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isToday: false, isPast: true });
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
      const seconds = Math.floor((diffMs / 1000) % 60);

      setCountdown({ days, hours, minutes, seconds, isToday: false, isPast: false });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [tripId, tripDateStr]);

  if (!upcomingTrip) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-amber-500/10 to-teal-500/10 border border-primary/20 p-6 shadow-sm hover:shadow-md transition-all mb-8">
      {/* 背景の装飾飛行機アイコン */}
      <div className="absolute -right-6 -bottom-6 text-9xl opacity-10 select-none pointer-events-none">
        ✈️
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* 左側: 旅行情報 */}
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold tracking-wide">
            <span>旅行まで</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground hover:text-primary transition-colors">
            <Link href={`/trips/${upcomingTrip.tripId}`}>
              {upcomingTrip.title}
            </Link>
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {upcomingTrip.tripDate && (
              <span className="flex items-center gap-1 font-medium">
                📅 {formatDate(upcomingTrip.tripDate)}
              </span>
            )}
            {upcomingTrip.companions !== undefined && upcomingTrip.companions !== null && (
              <span className="flex items-center gap-1 font-medium">
                👥 {upcomingTrip.companions}名
              </span>
            )}
          </div>

          {upcomingTrip.memo && (
            <p className="text-sm text-muted-foreground/90 line-clamp-2 pt-1">
              {upcomingTrip.memo}
            </p>
          )}
        </div>

        {/* 右側: カウントダウン表示 */}
        <div className="flex flex-col items-center md:items-end justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-4 rounded-xl border border-border shadow-sm min-w-[210px]">
          {countdown?.isToday ? (
            <div className="text-center py-2">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Status</div>
              <div className="text-xl font-extrabold text-primary animate-bounce">
                🎉 本日旅行日です！
              </div>
            </div>
          ) : countdown?.isPast ? (
            <div className="text-center py-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</div>
              <div className="text-base font-bold text-muted-foreground">
                過去の旅行
              </div>
            </div>
          ) : countdown ? (
            <div className="text-center md:text-right">
              <div className="text-xs font-medium text-muted-foreground mb-1">出発まで</div>
              <div className="flex items-baseline justify-center md:justify-end gap-1">
                <span className="text-xs font-semibold text-muted-foreground">あと</span>
                <span className="text-4xl font-extrabold text-primary tracking-tight">
                  {countdown.days}
                </span>
                <span className="text-base font-bold text-foreground">日</span>
              </div>
              <div className="text-xs font-mono text-muted-foreground/80 mt-1 tracking-wider">
                {String(countdown.hours).padStart(2, "0")}時間 {String(countdown.minutes).padStart(2, "0")}分 {String(countdown.seconds).padStart(2, "0")}秒
              </div>
            </div>
          ) : null}

          <Link
            href={`/trips/${upcomingTrip.tripId}`}
            className="mt-3 w-full text-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            旅行プランを開く →
          </Link>
        </div>
      </div>
    </div>
  );
}

/** 直近（今日以降で一番近い、なければ一番近い過去）の旅行を返すヘルパー関数 */
function getClosestTrip(trips: Trip[]): Trip | null {
  const datedTrips = trips.filter((t) => !!t.tripDate && !t.isCompleted);
  if (datedTrips.length === 0) return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const parseTime = (dateStr: string) => {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]).getTime();
    }
    return new Date(dateStr).getTime();
  };

  // 今日の0時以降の旅行
  const futureTrips = datedTrips
    .map((t) => {
      const tripTime = parseTime(t.tripDate!);
      return { trip: t, time: tripTime, diff: tripTime - todayStart };
    })
    .filter((item) => item.diff >= 0)
    .sort((a, b) => a.diff - b.diff);

  if (futureTrips.length > 0) {
    return futureTrips[0].trip;
  }

  // 未来の旅行がない場合、過去の旅行の中から最も最近のものを返す
  const pastTrips = datedTrips
    .map((t) => {
      const tripTime = parseTime(t.tripDate!);
      return { trip: t, time: tripTime, diff: Math.abs(tripTime - todayStart) };
    })
    .sort((a, b) => a.diff - b.diff);

  return pastTrips[0]?.trip || null;
}
