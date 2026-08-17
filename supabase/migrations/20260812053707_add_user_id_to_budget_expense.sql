-- =========================================================
-- budget
-- =========================================================

-- 既存のbudgetテーブルにuser_idを追加
alter table public.budget
add column if not exists user_id bigint;


-- 以前 created_by_user_id を使用していた場合は
-- その値をuser_idへ移行
do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'budget'
          and column_name = 'created_by_user_id'
    ) then

        execute '
            update public.budget
            set user_id = coalesce(user_id, created_by_user_id)
            where user_id is null
        ';

    end if;
end $$;


-- user_idがまだ設定されていない既存データには
-- 旅行の作成者を設定する
update public.budget b
set user_id = t.user_id
from public.trips t
where b.trip_id = t.trip_id
  and b.user_id is null;


-- user_idを必須にする
alter table public.budget
alter column user_id set not null;


-- 外部キーを設定
alter table public.budget
drop constraint if exists budget_user_id_fkey;

alter table public.budget
add constraint budget_user_id_fkey
foreign key (user_id)
references public.users(user_id)
on delete cascade;


-- 同じ旅行・同じユーザー・同じカテゴリの
-- 予算は1件だけにする
create unique index if not exists
uq_budget_trip_user_category
on public.budget (
    trip_id,
    user_id,
    category_id
);


-- 旅行＋ユーザーで予算を検索するためのINDEX
create index if not exists
idx_budget_trip_user
on public.budget (
    trip_id,
    user_id
);


-- =========================================================
-- expense
-- =========================================================

-- 既存のexpenseテーブルにuser_idを追加
alter table public.expense
add column if not exists user_id bigint;


-- 以前 created_by_user_id を使用していた場合は
-- その値をuser_idへ移行
do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'expense'
          and column_name = 'created_by_user_id'
    ) then

        execute '
            update public.expense
            set user_id = coalesce(user_id, created_by_user_id)
            where user_id is null
        ';

    end if;
end $$;


-- user_idがまだ設定されていない既存データには
-- 旅行の作成者を設定する
update public.expense e
set user_id = t.user_id
from public.trips t
where e.trip_id = t.trip_id
  and e.user_id is null;


-- user_idを必須にする
alter table public.expense
alter column user_id set not null;


-- 外部キーを設定
alter table public.expense
drop constraint if exists expense_user_id_fkey;

alter table public.expense
add constraint expense_user_id_fkey
foreign key (user_id)
references public.users(user_id)
on delete cascade;


-- 旅行＋ユーザーで支出を検索するためのINDEX
create index if not exists
idx_expense_trip_user
on public.expense (
    trip_id,
    user_id
);