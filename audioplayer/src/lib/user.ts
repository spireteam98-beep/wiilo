'use client';

import { getSdks } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UserProfile = {
  firstName?: string;
  lastName?: string;
  country?: string;
  whatsapp?: string;
  royalPayId?: string;
  accountId?: string;
  walletPin?: string;
  walletId?: string;
  displayName?: string | null;
  businessId?: string | null;
  email?: string | null;
  photoURL?: string | null;
  profileComplete?: boolean;
};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { firestore } = getSdks();
  const docRef = doc(firestore, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

export async function setUserProfile(uid: string, profile: UserProfile): Promise<void> {
  const { firestore } = getSdks();
  const docRef = doc(firestore, 'users', uid);
  return setDoc(docRef, profile, { merge: true });
}
