import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC7MqLXwDN7AxWNgGxTC0s8dLGU52vrvSg",
  authDomain: "horror-stories-7511f.firebaseapp.com",
  projectId: "horror-stories-7511f",
  storageBucket: "horror-stories-7511f.firebasestorage.app",
  messagingSenderId: "570200102719",
  appId: "1:570200102719:web:c064da4ad8f7149f74e58a",
  measurementId: "G-6WP2K426L1"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);
