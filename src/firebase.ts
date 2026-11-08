
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// We use Vite's import.meta.env to access environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  // Mode essai local (npm run dev:emulator) : comptes et données de test, rien ne part chez Google
  if (import.meta.env.VITE_USE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    console.log("🧪 Émulateurs Firebase (auth 9099, firestore 8080)");
  }
  console.log("✅ Firebase Initialized Successfully!");
  console.log("-> App:", app.name);
  console.log("-> Auth instance:", auth.app.name);
  console.log("-> Firestore instance:", db.app.name);
  console.log("-> Storage instance:", storage.app.name);
} catch (error) {
  console.error("❌ Firebase Initialization Failed:", error);
}

// Export the initialized services
export { app, auth, db, storage };
