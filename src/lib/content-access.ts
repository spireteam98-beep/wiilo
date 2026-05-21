import {
  Firestore,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

export const CONTENT_COST_COINS = 10;

export interface WalletProfile {
  coins: number;
  consumedContentIds: string[];
}

export interface WalletProfileOptions {
  displayName?: string | null;
  photoURL?: string | null;
  failSilently?: boolean;
}

export interface ContentAccessResult {
  canAccess: boolean;
  message?: string;
  newBalance?: number;
  alreadyUnlocked?: boolean;
}

function normalizeWalletProfile(raw: any): WalletProfile {
  return {
    coins: typeof raw?.coins === 'number' ? raw.coins : 0,
    consumedContentIds: Array.isArray(raw?.consumedContentIds) ? raw.consumedContentIds : [],
  };
}

export async function ensureUserWalletProfile(
  firestore: Firestore,
  userId: string,
  userEmail?: string | null,
  options: WalletProfileOptions = {}
): Promise<WalletProfile> {
  try {
    const userRef = doc(firestore, 'users', userId);
    const snapshot = await getDoc(userRef);
    const nameParts = options.displayName?.split(' ').filter(Boolean) || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ');

    if (!snapshot.exists()) {
      await setDoc(
        userRef,
        {
          uid: userId,
          name: options.displayName || [firstName, lastName].filter(Boolean).join(' ') || null,
          email: userEmail || null,
          photoURL: options.photoURL || null,
          firstName,
          lastName,
          country: '',
          mobile: '',
          profileComplete: false,
          preferredCategories: [],
          isAdmin: false,
          coins: 0,
          freeContentConsumedCount: 0,
          consumedContentIds: [],
          freeArticleReads: [],
          likedContentIds: [],
          savedContentIds: [],
          paymentHistory: [],
          lastLogin: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return { coins: 0, consumedContentIds: [] };
    }

    const userData = snapshot.data();
    const updates: Record<string, unknown> = {
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (typeof userData.uid === 'undefined') updates.uid = userId;
    if (typeof userData.email === 'undefined') updates.email = userEmail || null;
    if (typeof userData.name === 'undefined') updates.name = options.displayName || null;
    if (typeof userData.photoURL === 'undefined') updates.photoURL = options.photoURL || null;
    if (typeof userData.firstName === 'undefined') updates.firstName = firstName;
    if (typeof userData.lastName === 'undefined') updates.lastName = lastName;
    if (typeof userData.country === 'undefined') updates.country = '';
    if (typeof userData.mobile === 'undefined') updates.mobile = '';
    if (typeof userData.profileComplete === 'undefined') updates.profileComplete = false;
    if (typeof userData.preferredCategories === 'undefined') updates.preferredCategories = [];
    if (typeof userData.isAdmin === 'undefined') updates.isAdmin = false;
    if (typeof userData.coins === 'undefined') updates.coins = 0;
    if (typeof userData.freeContentConsumedCount === 'undefined') updates.freeContentConsumedCount = 0;
    if (typeof userData.consumedContentIds === 'undefined') updates.consumedContentIds = [];
    if (typeof userData.freeArticleReads === 'undefined') updates.freeArticleReads = [];
    if (typeof userData.likedContentIds === 'undefined') updates.likedContentIds = [];
    if (typeof userData.savedContentIds === 'undefined') updates.savedContentIds = [];
    if (typeof userData.paymentHistory === 'undefined') updates.paymentHistory = [];

    await updateDoc(userRef, updates);

    const refreshed = await getDoc(userRef);
    return normalizeWalletProfile(refreshed.data());
  } catch (error: any) {
    console.error('[content-access] ensureUserWalletProfile failed:', error?.message || error);
    if (options.failSilently === false) {
      throw error;
    }
    return { coins: 0, consumedContentIds: [] };
  }
}

export async function getUserWalletProfile(
  firestore: Firestore,
  userId: string,
  userEmail?: string | null
): Promise<WalletProfile> {
  return ensureUserWalletProfile(firestore, userId, userEmail);
}

export async function checkAndGrantContentAccess(params: {
  firestore: Firestore;
  userId: string;
  userEmail?: string | null;
  contentId: string;
  costCoins?: number;
}): Promise<ContentAccessResult> {
  const { firestore, userId, userEmail, contentId, costCoins = CONTENT_COST_COINS } = params;

  if (!userId) {
    return { canAccess: false, message: 'Please sign in to continue.' };
  }

  const userRef = doc(firestore, 'users', userId);
  let outcome: ContentAccessResult = { canAccess: false, message: 'Access denied.' };

  try {
    await runTransaction(firestore, async (tx) => {
      const snap = await tx.get(userRef);

      if (!snap.exists()) {
        tx.set(
          userRef,
          {
            uid: userId,
            email: userEmail || null,
            coins: 0,
            consumedContentIds: [],
            paymentHistory: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        outcome = {
          canAccess: false,
          message: `Insufficient coins. This content costs ${costCoins} coins.`,
          newBalance: 0,
        };
        return;
      }

      const current = normalizeWalletProfile(snap.data());

      if (current.consumedContentIds.includes(contentId)) {
        outcome = {
          canAccess: true,
          newBalance: current.coins,
          alreadyUnlocked: true,
        };
        return;
      }

      if (current.coins < costCoins) {
        outcome = {
          canAccess: false,
          message: `Insufficient coins. This content costs ${costCoins} coins. Your balance is ${current.coins}.`,
          newBalance: current.coins,
        };
        return;
      }

      const newBalance = current.coins - costCoins;
      const nextConsumed = [...new Set([...current.consumedContentIds, contentId])];

      tx.set(
        userRef,
        {
          email: userEmail || null,
          coins: newBalance,
          consumedContentIds: nextConsumed,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      outcome = {
        canAccess: true,
        newBalance,
        alreadyUnlocked: false,
      };
    });
  } catch (error: any) {
    const message =
      typeof error?.message === 'string' && error.message.toLowerCase().includes('insufficient permissions')
        ? 'Permission denied by Firestore rules. Deploy updated firestore.rules and try again.'
        : 'Unable to verify content access right now. Please try again.';
    console.error('[content-access] checkAndGrantContentAccess failed:', error?.message || error);
    return { canAccess: false, message };
  }

  return outcome;
}
