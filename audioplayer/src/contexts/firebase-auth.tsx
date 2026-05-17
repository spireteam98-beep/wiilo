// src/contexts/firebase-auth.tsx or AuthContext.tsx (be consistent with your import paths)
'use client';

import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase-config';
import { generateUUID } from '@/lib/utils';
import {
    FacebookAuthProvider,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    type Auth,
    type User as FirebaseUser,
} from 'firebase/auth';
import {
    Timestamp,
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

export interface UserProfile {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  uid: string;
  name?: string | null;
  email?: string | null;
  photoURL?: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastLogin?: Timestamp;
  isAdmin?: boolean;
  bio?: string;
  phone?: string;
  preferences?: string[];
  casticardPin?: string;
  coins?: number;
  casticardNumber?: string;
  casticardStatus?: 'active' | 'inactive' | 'frozen';
  paymentHistory?: any[];
  freeContentConsumedCount?: number;
  consumedContentIds?: string[];
  likedContentIds?: string[];
  savedContentIds?: string[];
  businessId?: string | null;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signInWithFacebook: () => Promise<FirebaseUser | null>;
  signOutUser: () => Promise<void>;
  loading: boolean;
  isUserProfileLoading: boolean;
  authError: string | null;
  initialized: boolean;
  firebaseAuth: Auth;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Alias for backwards compatibility / named import convenience:
export const useFirebaseAuth = useAuthContext;

async function initializeUserInFirestore(firebaseUser: FirebaseUser): Promise<UserProfile> {
  if (!db) throw new Error("Firestore is not initialized.");
  const userRef = doc(db, 'users', firebaseUser.uid);
  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const display = firebaseUser.displayName || '';
      const parts = display.trim().split(/\s+/);
      const firstName = parts.length ? parts.shift() || '' : '';
      const lastName = parts.join(' ');
      const newUserProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        lastLogin: serverTimestamp() as Timestamp,
        isAdmin: false,
        coins: 10,
        casticardNumber: generateUUID().replace(/-/g, '').substring(0, 16),
        casticardStatus: 'active',
        freeContentConsumedCount: 0,
        consumedContentIds: [],
        likedContentIds: [],
        savedContentIds: [],
        businessId: null,
        bio: 'Welcome to AudioFlow!',
        phone: '',
        preferences: ['music', 'podcasts'],
        casticardPin: '0000',
      };
      await setDoc(userRef, newUserProfile);
      console.log('New user document with Casticard created for:', firebaseUser.uid);
      return newUserProfile;
    } else {
      await updateDoc(userRef, { lastLogin: serverTimestamp() });
      console.log('User document updated for last login:', firebaseUser.uid);
      return userSnap.data() as UserProfile;
    }
  } catch (error) {
    console.error('Error initializing user in Firestore:', error);
    throw error;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [isUserProfileLoading, setIsUserProfileLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const initializedRef = React.useRef(false);

  const fetchUserProfile = useCallback(async (currentUser: FirebaseUser | null) => {
    if (!currentUser) {
      setUserProfile(null);
      setIsUserProfileLoading(false);
      return;
    }
    setIsUserProfileLoading(true);
    setAuthError(null);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userRef);
      if (userDocSnap.exists()) {
        setUserProfile(userDocSnap.data() as UserProfile);
      } else {
        setUserProfile(null);
      }
    } catch (e: any) {
      console.error("Error fetching user profile:", e);
      setAuthError(e.message || "Failed to fetch user profile.");
      setUserProfile(null);
    } finally {
      setIsUserProfileLoading(false);
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await fetchUserProfile(currentUser);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setLoading(true);
        setUser(currentUser);
        if (currentUser) {
          try {
            await initializeUserInFirestore(currentUser);
            await fetchUserProfile(currentUser);
          } catch (e: any) {
            setAuthError(e.message || "Error processing user data.");
            setUserProfile(null);
          }
        } else {
            setUserProfile(null);
            // Ensure profile-loading flag is cleared when there is no authenticated user
            setIsUserProfileLoading(false);
        }
        setLoading(false);
        if (!initializedRef.current) {
          initializedRef.current = true;
          setInitialized(true);
        }
      },
      (err: any) => {
        setAuthError(err.message || "Error in auth state listener.");
        setUser(null);
        setUserProfile(null);
        // Ensure profile-loading flag is cleared on error as well
        setIsUserProfileLoading(false);
        setLoading(false);
        if (!initializedRef.current) {
          initializedRef.current = true;
          setInitialized(true);
        }
      }
    );
    return () => unsubscribe();
  }, [fetchUserProfile]);

  const contextSignInWithGoogle = async (): Promise<FirebaseUser | null> => {
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Debug: print result & attempt to ensure the ID token is ready
      console.log('[auth] signInWithPopup succeeded', { uid: result.user?.uid, email: result.user?.email });
      try {
        const idToken = await result.user.getIdToken();
        console.log('[auth] Obtained idToken length:', idToken ? idToken.length : 0);
      } catch (tkErr) {
        console.warn('[auth] Could not obtain idToken on sign-in:', tkErr);
      }
      // Some environments may block popups. If the popup succeeded but the auth state
      // didn't update (rare), we'll proactively push home to cause a client re-render.
      try {
        router.push('/');
      } catch (pushErr) {
        // ignore; router may be unavailable in some environments
      }
      return result.user;
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      const description = error.code === 'auth/popup-closed-by-user'
        ? "Sign-in popup was closed."
        : "An unknown error occurred.";
      setAuthError(description);
      toast({ title: "Sign-in Failed", description, variant: "destructive" });
      // If popup was blocked by the browser, try a `signInWithRedirect` fallback.
      if (error?.code && error.code === 'auth/popup-blocked') {
        console.warn('[auth] Popup blocked — falling back to signInWithRedirect');
        try {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          import('firebase/auth').then(({signInWithRedirect}) => signInWithRedirect(auth, new GoogleAuthProvider()));
        } catch (redirectErr) {
          console.warn('[auth] Redirect fallback failed:', redirectErr);
        }
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const contextSignInWithFacebook = async (): Promise<FirebaseUser | null> => {
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new FacebookAuthProvider();
      provider.setCustomParameters({
        display: 'popup',
        scope: 'email,public_profile',
      });
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error: any) {
      console.error("Error signing in with Facebook:", error);
      let description = "An unknown error occurred.";
      if (error.code === 'auth/popup-closed-by-user') {
        description = "The Facebook login popup was closed. Please ensure your Facebook App settings have the correct 'Valid OAuth Redirect URIs' from your Firebase project.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        description = "An account already exists with the same email address but different sign-in credentials.";
      }
      setAuthError(description);
      toast({ title: "Sign-in Failed", description, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const contextSignOutUser = async (): Promise<void> => {
    setLoading(true);
    setAuthError(null);
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error: any) {
      console.error("Error signing out:", error);
      setAuthError(error.message || "Failed to sign out.");
      toast({ title: "Sign-out Failed", description: "An unknown error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    userProfile,
    signInWithGoogle: contextSignInWithGoogle,
    signInWithFacebook: contextSignInWithFacebook,
    signOutUser: contextSignOutUser,
    loading,
    isUserProfileLoading,
    authError,
    initialized,
    firebaseAuth: auth,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
