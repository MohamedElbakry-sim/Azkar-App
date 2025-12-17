
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ------------------------------------------------------------------
// IMPORTANT: REPLACE THESE VALUES WITH YOUR FIREBASE PROJECT CONFIG
// ------------------------------------------------------------------
// You can get these from the Firebase Console -> Project Settings
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let app;
let auth;
let db;

try {
    // Only initialize if config is valid to prevent crash in demo mode
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        console.warn("Firebase config is missing. Authentication features will be disabled.");
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

export { auth, db };
export const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";
