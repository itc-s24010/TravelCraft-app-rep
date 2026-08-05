"use client";

import { useEffect } from "react";
import { onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

/**
 * Refreshes the __session cookie whenever Firebase issues a new ID token.
 * Firebase automatically refreshes the token every ~55 minutes; without this
 * the __session cookie would expire after its original max-age and the
 * middleware would redirect the user to /login.
 */
export function SessionRefresher() {
  useEffect(() => {
    const auth = getFirebaseAuth();

    // onIdTokenChanged fires on sign-in, sign-out, and every silent token refresh
    const unsubscribe = onIdTokenChanged(auth, (user) => {
      if (user) {
        // Renew the cookie for another 7 days on every token refresh
        document.cookie = "__session=1; path=/; max-age=604800; SameSite=Lax";
      } else {
        // User signed out — clear the cookie immediately
        document.cookie = "__session=; path=/; max-age=0; SameSite=Lax";
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}
