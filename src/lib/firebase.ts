import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import config from "../../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
  measurementId: config.measurementId || ""
};

const app = initializeApp(firebaseConfig);
export { app };

export let analytics: any = null;
if (typeof window !== "undefined" && config.measurementId) {
  isSupported().then(yes => {
    if (yes) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.warn("Firebase Analytics could not be initialized:", e);
      }
    }
  }).catch(() => {
    // Gracefully ignore analytics support check failure
  });
}

export const auth = getAuth(app);

// Get the Firestore instance with the specific custom database ID from config
export const db = getFirestore(app, config.firestoreDatabaseId || "(default)");


