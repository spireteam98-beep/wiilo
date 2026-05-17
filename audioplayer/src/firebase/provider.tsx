// firebase/provider.tsx
'use client';

import { AuthProvider } from '@/contexts/firebase-auth';
import { FirebaseApp } from 'firebase/app';
import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSdks } from './index';

interface FirebaseContextProps {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  user: User | null;
}

const FirebaseContext = createContext<FirebaseContextProps | undefined>(undefined);


export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [firebaseInstance, setFirebaseInstance] = useState<{
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);

  useEffect(() => {
    const instance = getSdks();
    setFirebaseInstance(instance);
  }, []);
  
  if (!firebaseInstance) {
    // You can return a loader here if needed
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


export const FirebaseProvider: React.FC<{
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  children: React.ReactNode;
}> = ({ firebaseApp, auth, firestore, children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, [auth]);

  return (
    <FirebaseContext.Provider value={{ firebaseApp, auth, firestore, user }}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error("useFirebase must be used within FirebaseProvider");
  return context;
};

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useUser = () => ({ user: useFirebase().user });
