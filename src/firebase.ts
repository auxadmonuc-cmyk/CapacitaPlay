import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Detect if we are in Mock/Simulation mode
const isMock = 
  !firebaseConfig || 
  firebaseConfig.apiKey === 'mock_api_key_placeholder' || 
  firebaseConfig.apiKey === '';

let app;
let db: any;
let auth: any;

if (!isMock) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.warn('Failed to initialize live Firebase, falling back to mock mode:', error);
  }
}

export { app, db, auth };
export const isMockFirebase = isMock || !db || !auth;
