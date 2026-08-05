---
name: Firebase auth listeners hang in Replit preview
description: onAuthStateChanged / onIdTokenChanged hang in Replit's proxied iframe because Firebase cannot access IndexedDB reliably, causing UI to freeze.
---

## Rule
Never use `onAuthStateChanged`, `onIdTokenChanged`, or `auth.authStateReady()` in a layout or component that gates rendering (i.e. shows a spinner until resolved). They hang indefinitely in Replit's preview environment.

**Why:** Firebase SDK restores auth state from IndexedDB on initialization. In Replit's proxied iframe environment, IndexedDB access is unreliable, so these listeners never fire or resolve. Any component that blocks rendering on them will show its loading state forever.

**How to apply:**
- Store the Firebase ID token in `sessionStorage` immediately at login time (synchronous write before navigating away).
- Read it synchronously with `sessionStorage.getItem("__firebase_token")` in API calls — no async Firebase initialization needed.
- For route protection, rely on the `__session` cookie + Next.js middleware (server-side, no IndexedDB dependency).
- For token refresh, use `setInterval` polling on `auth.currentUser` (only resolves if Firebase already has a user in memory) rather than event listeners.
- Server-side logout: use a Next.js API route that sets `Set-Cookie: __session=; max-age=0` and redirects with a relative `Location: /login` header — client-side `document.cookie` deletion can race with navigation and leave the cookie intact.
