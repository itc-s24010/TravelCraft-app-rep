---
name: Travel Planner Architecture
description: フルスタック旅行計画アプリの構成・主要決定事項
---

## スタック
- Frontend: Next.js 15 (TypeScript + Tailwind) @ port 24289
- Backend: Spring Boot 3.2.5 (Java 19) @ port 8099
- DB: Supabase PostgreSQL (Transaction Pooler 経由)
- Auth: Firebase Authentication (Email/Password)

## 重要な設定

### Next.js
- `next.config.ts`: `/api/*` → `http://localhost:8099/api/*` にリライト
- `allowedDevOrigins: ["*.replit.dev", "*.pike.replit.dev", "*.repl.co"]` 必須 — ないと Replit プレビューで JS/CSS がクロスオリインブロックされ白画面になる
- ミドルウェア: `__session` クッキーで認証チェック（Firebase SDK は Edge Runtime 非対応のため）
- Firebase は遅延初期化 `getFirebaseAuth()` を使用 — モジュールレベル初期化だと SSR でクラッシュ (`self is not defined`)

### Firebase Auth
- `lib/firebase/client.ts`: `getFirebaseAuth()` 関数でラップ（クライアントサイドのみ）
- ログイン成功後に `__session=1` クッキーをセット (max-age=3600)
- ログアウト時にクッキーをクリア

### Spring Boot
- `FirebaseJwtFilter.java`: Google の JWKS (`securetoken@system.gserviceaccount.com`) でRS256検証
- JWKS は1時間キャッシュ
- `application.yml`: `firebase.project-id: ${NEXT_PUBLIC_FIREBASE_PROJECT_ID}`
- Issuer: `https://securetoken.google.com/{projectId}`, Audience: `{projectId}`

### Supabase DB
- Transaction Pooler URL必須 (IPv6問題回避): `aws-0-ap-northeast-1.pooler.supabase.com:6543`
- `DataSourceConfig.java` で自動変換
- JDBC URL に `prepareThreshold=0` 必須 — ないと `prepared statement "S_1" already exists` エラー
- `SUPABASE_SERVICE_ROLE_KEY` は実際には anon キー (JWT) が設定されている点に注意 — admin API 使用不可

## ワークフロー
- `artifacts/travel-planner: web` が Next.js を管理 (pnpm --filter @workspace/travel-next run dev)
- `Spring Boot API` が Spring Boot を管理
