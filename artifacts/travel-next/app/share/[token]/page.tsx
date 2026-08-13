"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function JoinSharedTripPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [message, setMessage] = useState("共有旅行に参加しています...");

  useEffect(() => {
    async function join() {
      if (!sessionStorage.getItem("__firebase_token")) {
        sessionStorage.setItem("__pending_share_token", token);
        window.location.href = "/login";
        return;
      }
      try {
        const trip = await api.trips.joinShared(token);
        setMessage("参加しました。旅行計画を開いています...");
        router.replace(`/trips/${trip.tripId}`);
      } catch {
        setMessage("この共有リンクは無効か、期限切れです。");
      }
    }
    join();
  }, [router, token]);

  return <main className="min-h-screen grid place-items-center p-6 text-center">
    <div><div className="text-4xl mb-4">✈️</div><p className="text-muted-foreground">{message}</p></div>
  </main>;
}
