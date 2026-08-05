"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleSignOut() {
    const auth = getFirebaseAuth();
    await signOut(auth);
    // Clear session cookie
    document.cookie = "__session=; path=/; max-age=0";
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/trips" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-2xl">✈️</span>
            <span className="text-primary font-[var(--font-playfair)]">旅行計画アプリ</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
