// @ts-ignore
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ------------------------------------------------------------------
// CONFIGURATION FIREBASE
// ------------------------------------------------------------------
// 1. Allez sur https://console.firebase.google.com/
// 2. Créez un nouveau projet "WeddingCheckIn"
// 3. Dans "Project Overview", cliquez sur l'icône Web (</>)
// 4. Copiez la constante "firebaseConfig" ci-dessous
// ------------------------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyCoKkTp3hNNxC0Aiuf5V3e5_Qx1rFKTPBk",
  authDomain: "mariagecheck.firebaseapp.com",
  projectId: "mariagecheck",
  storageBucket: "mariagecheck.firebasestorage.app",
  messagingSenderId: "226353993866",
  appId: "1:226353993866:web:193f08ec9c58dbee393573",
  measurementId: "G-Q0QF9H5W41"
};

// Initialisation conditionnelle pour éviter les erreurs si la config est vide
let app;
let db;

try {
  if (firebaseConfig.apiKey !== "API_KEY_ICI") {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase config is missing. Using Mock Mode.");
  }
} catch (e) {
  console.error("Error initializing Firebase", e);
}

export { db };