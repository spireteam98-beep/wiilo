import {
  Firestore,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

export const CONTENT_COST_COINS = 10;

export interface WalletProfile {
  coins: number;
  consumedContentIds: string[];
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
  userEmail?: string | null
): Promise<WalletProfile> {
  try {
    const userRef = doc(firestore, 'users', userId);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      await setDoc(
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
      return { coins: 0, consumedContentIds: [] };
    }

    return normalizeWalletProfile(snapshot.data());
  } catch (error: any) {
    console.error('[content-access] ensureUserWalletProfile failed:', error?.message || error);
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
