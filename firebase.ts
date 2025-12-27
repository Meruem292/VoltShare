
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Safely get environment variables to prevent "process is not defined" 
 * errors which result in a blank white page.
 */
const getEnv = (key: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || '';
    }
  } catch (e) {
    // Handle cases where process might be a restricted proxy
  }
  return '';
};

const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY') || getEnv('API_KEY'),
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('FIREBASE_APP_ID')
};

// Check if critical config is missing and warn the developer
if (!firebaseConfig.apiKey) {
  console.warn(
    "VoltShare: Firebase API Key is missing. " +
    "Ensure you have set environment variables in your deployment dashboard (e.g., Vercel)."
  );
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
