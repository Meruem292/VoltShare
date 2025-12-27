
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const getEnv = (key: string): string => {
  // Check import.meta.env (Vite/ESM)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || import.meta.env[`VITE_${key}`] || '';
    }
  } catch (e) {}

  // Check process.env (Webpack/CRA/Node)
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || process.env[`VITE_${key}`] || '';
    }
  } catch (e) {}

  return '';
};

const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY'),
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('FIREBASE_APP_ID')
};

// Check if we have at least the minimum config to try initializing
const isConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let db: any;
let auth: any;
let isFirebaseReady = false;

if (isConfigValid) {
  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    isFirebaseReady = true;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { db, auth, isFirebaseReady, firebaseConfig };
