"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase-config';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';

type FirebaseUser = {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
} | null;

type AuthContextValue = {
  user: FirebaseUser;
  loading: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signOut: () => Promise<void>;
};

const FirebaseAuthContext = createContext<AuthContextValue | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser({ uid: fbUser.uid, displayName: fbUser.displayName, email: fbUser.email, photoURL: fbUser.photoURL });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      setUser({ uid: u.uid, displayName: u.displayName, email: u.email, photoURL: u.photoURL });
      return u;
    } catch (err) {
      console.error('Google sign-in failed', err);
      return null;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  return (
    <FirebaseAuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) {
    throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  }
  return ctx;
}

export default FirebaseAuthProvider;
