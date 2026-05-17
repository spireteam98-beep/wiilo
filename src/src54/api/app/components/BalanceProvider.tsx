"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';

interface BalanceContextType {
  userCoins: number;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  checkPurchaseStatus: (postId: number, slug: string) => Promise<boolean>;
  addToLibrary: (post: any) => Promise<void>;
  removeFromLibrary: (slug: string) => Promise<void>;
  isInLibrary: (slug: string) => Promise<boolean>;
  checkBalance: () => Promise<number>;
  deductCoins: (amount: number) => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType>({
  userCoins: 0,
  loading: true,
  error: null,
  refreshBalance: async () => {},
  removeFromLibrary: async () => {},
  checkPurchaseStatus: async () => false,
  addToLibrary: async () => {},
  isInLibrary: async () => false,
  checkBalance: async () => 0,
  deductCoins: async () => {}
});

export function useBalance() {
  return useContext(BalanceContext);
}

export const MIN_REQUIRED_BALANCE = 100;

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [userCoins, setUserCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Set up real-time listener for user's balance
        const userRef = doc(db, 'users', user.uid);
        const balanceUnsubscribe = onSnapshot(userRef, 
          (doc) => {
            if (doc.exists()) {
              setUserCoins(doc.data().coins || 0);
            } else {
              setUserCoins(0);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching balance:', error);
            setError('Failed to fetch balance');
            setLoading(false);
          }
        );

        return () => balanceUnsubscribe();
      } else {
        setUserCoins(0);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshBalance = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        setUserCoins(docSnap.data().coins || 0);
      }
    } catch (err) {
      console.error('Error refreshing balance:', err);
      setError('Failed to refresh balance');
    } finally {
      setLoading(false);
    }
  };

  const checkPurchaseStatus = async (postId: number, slug: string) => {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const purchasedItems = userData.purchasedItems || [];
        return purchasedItems.some((item: { slug: string }) => item.slug === slug);
      }
      return false;
    } catch (error) {
      console.error("Error checking purchase status:", error);
      return false;
    }
  };

  const isInLibrary = async (slug: string) => {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const library = userData.library || [];
        return library.some((item: { slug: string }) => item.slug === slug);
      }
      return false;
    } catch (error) {
      console.error("Error checking library status:", error);
      return false;
    }
  };

  const addToLibrary = async (post: any) => {
    const user = auth.currentUser;
    if (!user) {
      router.push('/sign-in');
      return;
    }

    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        library: arrayUnion({
          id: post.id,
          slug: post.slug,
          title: post.title.rendered,
          addedDate: new Date().toISOString(),
          thumbnail: post._embedded?.['wp:featuredmedia']?.[0]?.source_url
        })
      });
    } catch (error) {
      console.error("Error adding to library:", error);
    }
  };

  const removeFromLibrary = async (slug: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const library = userDoc.data().library || [];
        const updatedLibrary = library.filter((item: any) => item.slug !== slug);
        await updateDoc(userRef, { library: updatedLibrary });
      }
    } catch (err) {
      console.error('Error removing from library:', err);
      throw new Error('Failed to remove item from library');
    }
  };

  return (
    <BalanceContext.Provider 
      value={{ 
        userCoins, 
        loading, 
        error, 
        refreshBalance,
        removeFromLibrary,
        checkPurchaseStatus,
        addToLibrary,
        isInLibrary,
        checkBalance: async () => userCoins,
        deductCoins: async (amount: number) => {
          // Implement deduction logic here
        }
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
} 