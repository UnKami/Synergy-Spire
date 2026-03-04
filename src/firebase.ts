import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9GKnPT__H4UNmrhyvg3BVdG318Ad0Vrk",
  authDomain: "synergy-spire.firebaseapp.com",
  projectId: "synergy-spire",
  storageBucket: "synergy-spire.firebasestorage.app",
  messagingSenderId: "843292570884",
  appId: "1:843292570884:web:12808a2a01a4b13e924c51",
  measurementId: "G-7EV49RMWEY"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const signIn = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in anonymously", error);
    throw error;
  }
};
