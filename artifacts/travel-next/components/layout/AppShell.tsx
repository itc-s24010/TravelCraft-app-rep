"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { signOut, updateProfile } from "firebase/auth";
import { api, signOutAndRedirect } from "@/lib/api";
import { toast } from "sonner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.users.me()
      .then((user) => setUserName(user.userName || user.email || "ユーザー"))
      .catch(() => setUserName(""));
  }, []);

  useEffect(() => {
    if (showEdit) {
      setEditName(userName);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showEdit, userName]);

  async function handleSignOut() {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch {
      // ignore firebase sign-out errors
    }
    signOutAndRedirect();
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed) { toast.error("ユーザー名を入力してください"); return; }
    setSaving(true);
    try {
      // Spring API
      await api.users.update({ userName: trimmed });
      // Firebase Auth profile
      const auth = getFirebaseAuth();
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: trimmed });
      }
      setUserName(trimmed);
      setShowEdit(false);
      toast.success("ユーザー名を更新しました");
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setSaving(false);
    }
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

          <div className="flex items-center gap-2">
            {userName && (
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-muted group"
                title="ユーザー名を編集"
              >
                <span>👤 {userName}</span>
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Edit username modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">ユーザー名を変更</h2>
              <button
                onClick={() => setShowEdit(false)}
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  ユーザー名
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                  placeholder="例：山田 花子"
                  maxLength={50}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={saving || !editName.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
