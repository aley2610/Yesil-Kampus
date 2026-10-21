import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIrgMhqEE-4Qe3m8dlxSqA5J9GoXR-JTA",
  authDomain: "yesilkampus-iuc.firebaseapp.com",
  projectId: "yesilkampus-iuc",
  storageBucket: "yesilkampus-iuc.firebasestorage.app",
  messagingSenderId: "555123910788",
  appId: "1:555123910788:web:2965b070f132129e853ad1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);