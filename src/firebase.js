// src/firebase.js

import { initializeApp } from "firebase/app";
// Importa los servicios que necesitas
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics"; // Incluido porque lo tenías

// Lee las variables de entorno de forma segura
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // Measurement ID es opcional, pero si lo tienes en .env.local, úsalo
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa los servicios que vas a usar y expórtalos
export const db = getFirestore(app);       // Instancia de Firestore Database
export const auth = getAuth(app);         // Instancia de Firebase Authentication
export const analytics = getAnalytics(app); // Instancia de Firebase Analytics (opcional)

// También puedes exportar 'app' si lo necesitas directamente
export default app;