import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_a6WeA4WWSwrPeHxoSXvnwnkzFsJFNSw",
  authDomain: "neu-moa-monitoring-system.firebaseapp.com",
  projectId: "neu-moa-monitoring-system",
  storageBucket: "neu-moa-monitoring-system.firebasestorage.app",
  messagingSenderId: "408068454942",
  appId: "1:408068454942:web:49ce9ef2b126571d83cc0f",
  measurementId: "G-M83VFPM9G7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);