import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

/** Returns the Firebase Auth instance. Call only in client-side code. */
export function getFirebaseAuth() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return getAuth(app);
}
