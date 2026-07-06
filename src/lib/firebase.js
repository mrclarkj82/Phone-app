import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBQeaSzDm4UOm1XzW3uBWzG36C1v3XABhs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dragonmath-f6f56.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dragonmath-f6f56",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dragonmath-f6f56.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1011267897815",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1011267897815:web:2d1d239a146a0514f22392",
};

const requiredConfigKeys = ["apiKey", "authDomain", "projectId", "appId"];

export const missingFirebaseConfig = requiredConfigKeys.filter((key) => !firebaseConfig[key]);
export const firebaseConfigured = missingFirebaseConfig.length === 0;

const firebaseApp = firebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
