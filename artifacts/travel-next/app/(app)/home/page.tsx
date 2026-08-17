"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Trip } from "@/lib/api";
import { formatDate, calcStayLabel } from "@/lib/utils";
import { UpcomingTripCard } from "@/components/trip/UpcomingTripCard";
import { PlaneLoader } from "@/components/ui/PlaneLoader";

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionStorage.getItem("__firebase_token")) {
      window.location.href = "/api/logout";
      return;
    }
    api.trips.list()
      .then(setTrips)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PlaneLoader text="読み込み中..." />;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const upcoming = trips
    .filter((t) => !t.isCompleted && (t.startDate ?? t.tripDate ?? "") >= todayStr)
    .sort((a, b) => {
      const da = a.startDate ?? a.tripDate ?? "";
      const db = b.startDate ?? b.tripDate ?? "";
      return da < db ? -1 : da > db ? 1 : 0;
    });

  const recent = trips
    .filter((t) => !t.isCompleted && (t.startDate ?? t.tripDate ?? "") < todayStr)
    .sort((a, b) => {
      const da = a.startDate ?? a.tripDate ?? "";
      const db = b.startDate ?? b.tripDate ?? "";
      return da > db ? -1 : da < db ? 1 : 0;
    })
    .slice(0, 3);

  const hasAnyTrip = trips.length > 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ホーム</h1>
          <p className="text-muted-foreground mt-1 text-sm">旅の計画をひとめで確認</p>
        </div>
        <Link
          href="/trips"
          className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          旅行一覧 →
        </Link>
      </div>

      {/* 直近の旅行カウントダウン */}
      {hasAnyTrip ? (
        <UpcomingTripCard trips={trips} />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center mb-8">
          <div className="text-5xl mb-4">✈️</div>
          <p className="text-muted-foreground text-sm mb-4">まだ旅行プランがありません</p>
          <Link
            href="/trips"
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            最初の旅行を作成する
          </Link>
        </div>
      )}

      {/* 予定している旅行 */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>📅</span> 予定している旅行
            <span className="text-xs font-normal text-muted-foreground ml-1">（{upcoming.length}件）</span>
          </h2>
          <div className="space-y-2">
            {upcoming.map((trip) => {
              const stayLabel = calcStayLabel(trip.startDate ?? trip.tripDate, trip.endDate ?? trip.startDate ?? trip.tripDate);
              const dateStr = trip.startDate ?? trip.tripDate;
              const daysLeft = dateStr
                ? Math.ceil((new Date(dateStr + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000)
                : null;
              return (
                <Link
                  key={trip.tripId}
                  href={`/trips/${trip.tripId}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 hover:shadow-sm hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0">🗺️</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {trip.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(dateStr)}
                        {stayLabel && <span className="ml-2 text-primary font-medium">{stayLabel}</span>}
                      </p>
                    </div>
                  </div>
                  {daysLeft !== null && (
                    <div className="shrink-0 ml-4 text-right">
                      {daysLeft === 0 ? (
                        <span className="text-xs font-bold text-primary animate-pulse">本日！</span>
                      ) : (
                        <span className="text-xs font-semibold text-primary">あと{daysLeft}日</span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 直近の過去の旅行 */}
      {recent.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
            <span>🕐</span> 最近の旅行
          </h2>
          <div className="space-y-2">
            {recent.map((trip) => (
              <Link
                key={trip.tripId}
                href={`/trips/${trip.tripId}`}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-all group"
              >
                <span className="text-xl shrink-0 opacity-60">📍</span>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                    {trip.title}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {formatDate(trip.startDate ?? trip.tripDate)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* クイックリンク */}
      <div className="flex gap-3 mt-2">
        <Link
          href="/trips"
          className="flex-1 text-center px-4 py-3 rounded-xl border border-border bg-white text-sm font-medium hover:bg-muted/50 hover:border-primary/30 transition-all"
        >
          🗂️ すべての旅行
        </Link>
        <Link
          href="/trips"
          className="flex-1 text-center px-4 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
        >
          ＋ 新しい旅行
        </Link>
      </div>
    </div>
  );
}
