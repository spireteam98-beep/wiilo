// src/lib/firebase.tsx
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  type Auth, 
  type User as FirebaseUser,
  FacebookAuthProvider // If you want Facebook login
} from "firebase/auth";
import { getFirestore, type Firestore, doc, getDoc, Timestamp, serverTimestamp as firestoreServerTimestamp } from "firebase/firestore";
import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react";
import { initializeUserInFirestore } from './userManagement';
import { useRouter, usePathname } from 'next/navigation';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAl1iiyOrU49GOJdezPc-6zQPeonpJxl0I",
  authDomain: "wirenext-b4b65.firebaseapp.com",
  projectId: "wirenext-b4b65",
  storageBucket: "wirenext-b4b65.appspot.com", 
  messagingSenderId: "486545175288",
  appId: "1:486545175288:web:6d53203232567ae786810d",
  measurementId: "G-9H1ZKBRWK0"
};

let app: FirebaseApp;
let authInstance: Auth; 
let dbInstance: Firestore; 

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
authInstance = getAuth(app);
dbInstance = getFirestore(app);

export interface UserProfile {
  uid: string;
  name?: string | null;
  email?: string | null;
  photoURL?: string | null;
  coins?: number;
  paymentHistory?: any[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastLogin?: Timestamp;
  firstName?: string;
  lastName?: string;
  country?: string;
  mobile?: string;
  profileComplete?: boolean;
  preferredCategories?: string[];
  isAdmin?: boolean;
  freeContentConsumedCount?: number;
  consumedContentIds?: string[];
  likedContentIds?: string[];
  savedContentIds?: string[];
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signOutUser: () => Promise<void>;
  loading: boolean; 
  isUserProfileLoading: boolean;
  error: Error | null; 
  firebaseAuth: Auth;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => { 
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

// --- Define signInWithGoogle and signOutUser OUTSIDE the component ---
const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(authInstance, provider);
  return result.user;
};

const signOutUser = async (): Promise<void> => {
  await signOut(authInstance);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserProfileLoading, setIsUserProfileLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null); 
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserProfile = useCallback(async (currentUser: FirebaseUser | null) => {
    if (!currentUser) {
      setUserProfile(null);
      setIsUserProfileLoading(false);
      return;
    }
    setIsUserProfileLoading(true);
    try {
      const userRef = doc(dbInstance, "users", currentUser.uid);
      const userDocSnap = await getDoc(userRef);
      if (userDocSnap.exists()) {
        setUserProfile(userDocSnap.data() as UserProfile);
      } else {
        setUserProfile(null); 
      }
    } catch (e) {
      setError(e as Error);
      setUserProfile(null);
    } finally {
      setIsUserProfileLoading(false);
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    const currentUser = authInstance.currentUser;
    if (currentUser) {
      await fetchUserProfile(currentUser);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    const unsubscribe = authInstance.onAuthStateChanged(
      async (currentUser) => {
        setLoading(true);
        setIsUserProfileLoading(true);
        setUser(currentUser);

        if (currentUser) {
          try {
            await initializeUserInFirestore(currentUser);
            await fetchUserProfile(currentUser);
          } catch (e) {
            setError(e as Error);
            setUserProfile(null);
            setIsUserProfileLoading(false); 
          }
        } else {
          setUserProfile(null);
          setIsUserProfileLoading(false);
        }
        setLoading(false);
      },
      (err) => { 
        setError(err);
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        setIsUserProfileLoading(false);
      }
    );
    return () => {
      unsubscribe();
    };
  }, [fetchUserProfile]);

  useEffect(() => {
    if (loading || isUserProfileLoading) return;
    const isAuthPage = pathname === '/auth/signin';
    const isProfileSetupPage = pathname === '/profile/setup';
    const isPreferencesPage = pathname === '/profile/preferences';

    if (user) {
      if (isAuthPage) {
        router.replace('/');
        return;
      }
      if (userProfile && !userProfile.profileComplete && !isProfileSetupPage && !isPreferencesPage) {
        router.replace('/profile/setup');
        return;
      }
      if (userProfile && userProfile.profileComplete && (!userProfile.preferredCategories || userProfile.preferredCategories.length === 0) && !isPreferencesPage) {
        router.replace('/profile/preferences');
        return;
      }
      if (userProfile && userProfile.profileComplete && isProfileSetupPage) {
        if (!userProfile.preferredCategories || userProfile.preferredCategories.length === 0) {
          router.replace('/profile/preferences');
        } else {
          router.replace('/');
        }
        return;
      }
      if (userProfile && !userProfile.profileComplete && isPreferencesPage) {
        router.replace('/profile/setup');
        return;
      }
      if (userProfile && userProfile.profileComplete && userProfile.preferredCategories && userProfile.preferredCategories.length > 0 && isPreferencesPage) {
        router.replace('/');
        return;
      }
    } else {
      if (!isAuthPage) {
        router.replace('/auth/signin');
      }
    }
  }, [user, userProfile, loading, isUserProfileLoading, router, pathname]);

  const contextValue = { 
    user, 
    userProfile, 
    signInWithGoogle,
    signOutUser, 
    loading, 
    isUserProfileLoading, 
    error, 
    firebaseAuth: authInstance,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { 
  authInstance as auth, 
  dbInstance as db, 
  GoogleAuthProvider, 
  Timestamp as FirebaseTimestamp, 
  firestoreServerTimestamp, 
  signInWithGoogle, 
  signOutUser
};
