// firebase/client-provider.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FirebaseApp } from "firebase/app";
import { Auth } from "firebase/auth";
import { Firestore } from "firebase/firestore";
import { getSdks } from "./index";
import { FirebaseProvider } from "./provider";

// This provider is responsible for initializing Firebase on the client side.
export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [firebaseInstance, setFirebaseInstance] = useState<{
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the component mounts.
    // This is the correct place to initialize Firebase.
    const instance = getSdks();
    setFirebaseInstance(instance);
  }, []);

  if (!firebaseInstance) {
    // Render nothing or a loading spinner until Firebase is initialized.
    return null;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseInstance.app}
      auth={firebaseInstance.auth}
      firestore={firebaseInstance.firestore}
    >
      {children}
    </FirebaseProvider>
  );
};
