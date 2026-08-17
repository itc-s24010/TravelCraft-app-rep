# 旅行プランの共有範囲

## 共有されるデータ

`trips` は旅行プランの概要を持ちます。`trip_members` で参加者を管理し、所有者と参加者は概要を閲覧・編集できます。

`schedule_items` は `trip_id` のみを持つ共有データです。旅行の参加者全員が同じスケジュールを閲覧・編集します。

## 個人管理するデータ

次のテーブルは、必ず `trip_id` とログインユーザーの所有者列の両方で対象を特定します。

- `budget`: `user_id`
- `expense`: `user_id`
- `transportation`: `created_by_user_id`
- `accommodation`: `created_by_user_id`
- `notification`: `created_by_user_id`
- `categories`: `user_id`

所有者列は `users.user_id` への必須外部キーです。したがって、同じ旅行に参加していても、各ユーザーは自分が登録した予算・支出・交通・宿泊・通知・カテゴリだけを閲覧・編集・削除できます。

## APIの認可ルール

- 旅行概要・スケジュール: `trip owner OR trip member`
- 個人データ: `trip owner OR trip member` で旅行へのアクセスを確認した後、さらに所有者列が `current user` のデータだけに絞り込み
- カテゴリ: `/api/categories` は認証必須で、ログインユーザーのカテゴリだけを返す

起動時の `FkMigration` は既存の個人データを旅行所有者へ紐付け、共有カテゴリをユーザー別カテゴリへ移行し、所有者列を `NOT NULL` と外部キーに移行します。
