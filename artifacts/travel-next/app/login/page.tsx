"use client";

import { useState, useEffect } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { api } from "@/lib/api";

export default function LoginPage() {
  // A token can outlive the session cookie (for example after a server restart).
  // Redirect only when both pieces of the client-side session are present;
  // otherwise the middleware would send /trips straight back to /login.
  useEffect(() => {
    const hasToken = Boolean(sessionStorage.getItem("__firebase_token"));
    const hasSessionCookie = document.cookie
      .split("; ")
      .some((cookie) => cookie.startsWith("__session=1"));

    if (hasToken && hasSessionCookie) {
      const pendingToken = sessionStorage.getItem("__pending_share_token");
      sessionStorage.removeItem("__pending_share_token");
      window.location.href = pendingToken ? `/share/${pendingToken}` : "/trips";
    } else if (hasToken) {
      sessionStorage.removeItem("__firebase_token");
    }
  }, []);

  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp && !userName.trim()) {
        setError("表示名を入力してください。");
        return;
      }
      const auth = getFirebaseAuth();
      if (isSignUp) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: userName.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Get the Firebase ID token and store it for API calls
      const idToken = await auth.currentUser!.getIdToken(isSignUp);
      sessionStorage.setItem("__firebase_token", idToken);
      // Set session cookie so middleware can detect auth state
      document.cookie = "__session=1; path=/; max-age=604800; SameSite=Lax";
      // Firebase may not include a newly-set display name in its first ID token.
      // Persist it explicitly so the navigation bar can show it immediately.
      if (isSignUp) {
        await api.users.update({ userName: userName.trim() });
      }
      // Hard redirect so sessionStorage is available immediately on the next page.
      // A visitor arriving via a share link resumes that invitation after login.
      const pendingToken = sessionStorage.getItem("__pending_share_token");
      sessionStorage.removeItem("__pending_share_token");
      window.location.href = pendingToken ? `/share/${pendingToken}` : "/trips";
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/email-already-in-use") {
        setError("このメールアドレスはすでに登録されています。ログインしてください。");
      } else if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setError("メールアドレスまたはパスワードが正しくありません。");
      } else if (code === "auth/weak-password") {
        setError("パスワードは6文字以上にしてください。");
      } else if (code === "auth/invalid-email") {
        setError("メールアドレスの形式が正しくありません。");
      } else {
        setError((err as Error).message ?? "エラーが発生しました");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white text-3xl mb-4 shadow-lg">
            ✈️
          </div>
          <h1 className="text-3xl font-bold text-foreground font-[var(--font-playfair)]">
            旅行計画アプリ
          </h1>
          <p className="text-muted-foreground mt-1">あなたの旅を管理しましょう</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
          <h2 className="text-xl font-semibold mb-6">
            {isSignUp ? "アカウント作成" : "ログイン"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              {isSignUp && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    表示名
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    placeholder="例：山田 花子"
                  />
                </div>
              )}
              <label className="block text-sm font-medium text-foreground mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                パスワード
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-destructive text-sm bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "処理中..." : isSignUp ? "アカウント作成" : "ログイン"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "すでにアカウントをお持ちですか？" : "アカウントをお持ちでないですか？"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-primary font-medium hover:underline"
            >
              {isSignUp ? "ログイン" : "新規登録"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
