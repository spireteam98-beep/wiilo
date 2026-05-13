// firebase/index.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

type FirebaseSdks = {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

let sdks: FirebaseSdks | null = null;

export function getSdks() {
  if (sdks) {
    return sdks;
  }
  const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  sdks = { firebaseApp, auth, firestore };
  return sdks;
}

export * from './config';
export * from './provider';
export * from './client-provider';
export * from './use-memo-firebase';
export { useFirestore } from './provider';
