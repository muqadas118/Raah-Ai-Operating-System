import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHKmxl_47AoYhKVtk3gpP9zIPDPpxi8S0",
  authDomain: "raah-7ab6d.firebaseapp.com",
  projectId: "raah-7ab6d",
  storageBucket: "raah-7ab6d.firebasestorage.app",
  messagingSenderId: "235693139355",
  appId: "1:235693139355:web:11ee305b32dd7c2114ad3e",
  measurementId: "G-HCGCL1WG4W",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
