"use client";

import { useEffect } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { storeToken } from "@/lib/api";

/**
 * Silently refreshes the Firebase ID token every 50 minutes so the
 * sessionStorage token stays fresh (Firebase tokens expire after 1 hour).
 * Does NOT use onIdTokenChanged — that listener can hang in environments
 * where IndexedDB is unavailable.
 */
export function SessionRefresher() {
  useEffect(() => {
    const refresh = async () => {
      try {
        const auth = getFirebaseAuth();
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken(true);
          storeToken(token);
          document.cookie = "__session=1; path=/; max-age=604800; SameSite=Lax";
        }
      } catch {
        // ignore refresh errors
      }
    };

    const id = setInterval(refresh, 50 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return null;
}
