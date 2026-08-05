"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { AppShell } from "@/components/layout/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    // Wait for Firebase to restore auth state from local storage.
    // onAuthStateChanged fires once immediately with the persisted user (or null).
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // No Firebase session — clear the __session cookie and redirect to login
        document.cookie = "__session=; path=/; max-age=0";
        router.replace("/login");
      } else {
        setReady(true);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">✈️</div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
