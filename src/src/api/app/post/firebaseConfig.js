import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCbIFY9QTrt2t6stwF_5Zpv5eqFgyPCFNQ",
  authDomain: "danguud-fb076.firebaseapp.com",
  projectId: "danguud-fb076",
  storageBucket: "danguud-fb076.appspot.com",
  messagingSenderId: "1043615951245",
  appId: "1:1043615951245:web:c9f432b643b50dde9535c4",
  measurementId: "G-BG041MHFX8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };