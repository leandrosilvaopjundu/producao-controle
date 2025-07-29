// Configuração do Firebase para o frontend
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBXxvQxQxQxQxQxQxQxQxQxQxQxQxQxQxQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "controle-producao-1de7a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "controle-producao-1de7a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "controle-producao-1de7a.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdefghijklmnopqr"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

export default app;

