---
name: Supabase pooler connection workaround
description: Supabase direct DB host resolves IPv6-only in Replit; must use Transaction Pooler via DataSourceConfig rewrite.
---

## Rule
Spring Boot (Java) cannot connect to `db.{ref}.supabase.co:5432` from Replit — it resolves to IPv6 only, which Java cannot use in this environment. Always route through the Supabase **Transaction Pooler**.

**Why:** `InetAddress.getAllByName("db.{ref}.supabase.co")` returns only an IPv6 address; Replit's network stack throws `UnknownHostException` for IPv6-only hosts in Java. The pooler host `aws-0-ap-northeast-1.pooler.supabase.com:6543` resolves to IPv4 and is fully reachable.

**How to apply:**
- `DataSourceConfig.java` auto-rewrites direct URLs to pooler format.
- It reads `SUPABASE_JDBC_URL` (may be direct or pooler URL) and `SUPABASE_DB_PASSWORD` (used directly to avoid URL-decode issues with special chars).
- Pooler username format: `postgres.{ref}` (e.g. `postgres.bfjpbraseralmrxsvkva`).
- Region for this project: `ap-northeast-1` (confirmed via Java TCP test).
- If the project ref changes, update `POOLER_REGION` constant in `DataSourceConfig.java`.
