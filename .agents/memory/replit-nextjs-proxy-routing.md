---
name: Replit Next.js proxy routing with path prefix
description: How to make Next.js work in Replit preview when the artifact uses a sub-path (e.g. /travel-next)
---

## The rule

When a Next.js artifact has `previewPath = "/travel-next"` in artifact.toml, the Replit proxy forwards the **full path** (including the prefix) to Next.js. Next.js must have `basePath` set to match.

**Why:** The Replit proxy does NOT strip the path prefix before forwarding. So `/travel-next/` is sent as-is to Next.js on localPort.

**How to apply:**
1. Set `basePath: process.env.NEXT_PUBLIC_BASE_PATH || ""` in `next.config.ts`
2. Set `NEXT_PUBLIC_BASE_PATH = "/travel-next"` in `artifact.toml [services.env]`
3. Add `[[ports]]` entries to `.replit` for ALL artifact ports (if any are present, all must be listed)
4. In middleware, use `request.nextUrl.clone()` for redirects — NOT `new URL("/login", request.url)`. The latter ignores basePath and redirects to `/login` (without prefix), causing 404.
5. Browser `fetch()` requests must also prepend `NEXT_PUBLIC_BASE_PATH`. For example, call `${base}/spring/...`, not `/spring/...`, so the request remains under the artifact's forwarded path.

## pnpm@10.34.5 auto-install crash

Replit's artifact workflow system tries to install the `packageManager` version from `package.json` before running any command. `pnpm@10.34.5` fails with SIGABRT in this environment.

**Fix:** Remove `"packageManager"` field from `package.json`, and use `bash -c 'cd /abs/path && node_modules/.bin/next dev -p ${PORT:-3000} -H 0.0.0.0'` as the artifact run command to bypass pnpm bootstrapping entirely.
