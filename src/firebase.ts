import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import jsonConfig from '../firebase-applet-config.json';

// Prefer Vite env vars (VITE_*) injected at build time. Fall back to
// `firebase-applet-config.json` if present. If neither is available,
// treat as mock mode.
const env = (import.meta as any).env as Record<string, any>;


const firebaseConfigFromEnv = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: env.VITE_FIREBASE_APP_ID ?? '',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID ?? ''
};

const hasEnvConfig = !!firebaseConfigFromEnv.apiKey;
const hasFileConfig = jsonConfig && (jsonConfig as any).apiKey;

const effectiveConfig = hasEnvConfig ? firebaseConfigFromEnv : hasFileConfig ? (jsonConfig as any) : null;

const isMock = !effectiveConfig || effectiveConfig.apiKey === 'mock_api_key_placeholder' || effectiveConfig.apiKey === '';

let app;
let db: any;
let auth: any;

if (!isMock) {
  try {
    app = getApps().length === 0 ? initializeApp(effectiveConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.warn('Failed to initialize live Firebase, falling back to mock mode:', error);
  }
}

export { app, db, auth };
export const isMockFirebase = isMock || !db || !auth;
