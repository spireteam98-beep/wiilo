/**
 * PIN Verification Utility
 * Handles PIN verification for wallet transactions and external app access
 */

import { getSdks } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Verify user's wallet PIN
 * @param uid - Firebase user ID
 * @param enteredPin - PIN entered by user
 * @returns true if PIN matches, false otherwise
 */
export async function verifyWalletPin(uid: string, enteredPin: string): Promise<boolean> {
  try {
    const { firestore } = getSdks();
    const docRef = doc(firestore, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error('User profile not found');
      return false;
    }

    const profile = docSnap.data();
    const storedPin = profile.walletPin;

    // Direct comparison (in production, use bcrypt or similar for hashing)
    return enteredPin === storedPin;
  } catch (err) {
    console.error('Error verifying PIN:', err);
    return false;
  }
}

/**
 * Get user's wallet ID (combination of RoyalPayId and Email)
 * @param uid - Firebase user ID
 * @returns wallet ID or null
 */
export async function getWalletId(uid: string): Promise<string | null> {
  try {
    const { firestore } = getSdks();
    const docRef = doc(firestore, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const profile = docSnap.data();
    return profile.walletId || null;
  } catch (err) {
    console.error('Error getting wallet ID:', err);
    return null;
  }
}

/**
 * Get user's RoyalPay ID
 * @param uid - Firebase user ID
 * @returns RoyalPay ID or null
 */
export async function getRoyalPayId(uid: string): Promise<string | null> {
  try {
    const { firestore } = getSdks();
    const docRef = doc(firestore, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const profile = docSnap.data();
    return profile.royalPayId || null;
  } catch (err) {
    console.error('Error getting RoyalPay ID:', err);
    return null;
  }
}

/**
 * Check if user has set up wallet PIN
 * @param uid - Firebase user ID
 * @returns true if PIN is set, false otherwise
 */
export async function hasWalletPin(uid: string): Promise<boolean> {
  try {
    const { firestore } = getSdks();
    const docRef = doc(firestore, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return false;
    }

    const profile = docSnap.data();
    return !!profile.walletPin;
  } catch (err) {
    console.error('Error checking PIN:', err);
    return false;
  }
}

/**
 * Generate composite wallet identifier
 * Format: RoyalPayId-Email
 * @param royalPayId - 6-digit wallet account ID
 * @param email - User's email
 * @returns composite wallet ID
 */
export function generateWalletIdentifier(royalPayId: string, email: string): string {
  return `${royalPayId}-${email}`;
}

/**
 * Parse wallet identifier into components
 * @param walletId - Composite wallet ID (RoyalPayId-Email)
 * @returns object with royalPayId and email
 */
export function parseWalletIdentifier(walletId: string): { royalPayId: string; email: string } | null {
  const parts = walletId.split('-');
  if (parts.length < 2) {
    return null;
  }

  // RoyalPayId is first 6 characters, rest is email
  const royalPayId = parts[0];
  const email = parts.slice(1).join('-'); // In case email has hyphens

  return { royalPayId, email };
}
