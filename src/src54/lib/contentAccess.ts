// src/lib/contentAccess.ts
import { db } from './firebase';
import { doc, updateDoc, arrayUnion, increment, serverTimestamp, type Timestamp } from 'firebase/firestore';
import type { UserProfile } from './firebase';

export const FREE_LIMIT = 10;
export const CONTENT_COST = 10;
export const LOW_BALANCE_THRESHOLD = 10; // User is warned if balance will be *less than* this after transaction (e.g., if balance is 10, and cost is 10, new balance is 0, which is < 10, so warn)

export interface ContentAccessResult {
  canAccess: boolean;
  message?: string;
  profileWasUpdated?: boolean; // Indicates if Firestore was updated by this function call
  newBalance?: number;        // Current balance after potential deduction
  showLowBalanceWarning?: boolean;
}

// Removed markArticleAsConsumed function as consumption is now immediate.

export async function checkAndGrantContentAccess(
  contentId: string,
  userProfile: UserProfile | null,
  userId: string
  // contentType parameter removed
): Promise<ContentAccessResult> {
  console.log(`[ContentAccess] Checking access for contentId: ${contentId}, userId: ${userId}`);

  if (!userId || !userProfile) {
    console.warn("[ContentAccess] No userId or userProfile provided.");
    return { canAccess: false, message: "User not authenticated or profile not loaded.", profileWasUpdated: false };
  }

  const userRef = doc(db, 'users', userId);

  // 1. Already consumed?
  if (userProfile.consumedContentIds?.includes(contentId)) {
    console.log(`[ContentAccess] User ${userId} already consumed ${contentId}. Access granted.`);
    return { canAccess: true, profileWasUpdated: false, newBalance: userProfile.coins, showLowBalanceWarning: (userProfile.coins || 0) < LOW_BALANCE_THRESHOLD };
  }

  const currentFreeConsumedCount = userProfile.freeContentConsumedCount || 0;
  const currentCoins = userProfile.coins || 0;
  let updatedData: Partial<UserProfile> = {
    consumedContentIds: arrayUnion(contentId) as any,
    updatedAt: serverTimestamp() as Timestamp,
  };
  let newBalance = currentCoins;
  let accessMethodForLog = "";

  // 2. Within free limit?
  if (currentFreeConsumedCount < FREE_LIMIT) {
    updatedData.freeContentConsumedCount = increment(1) as any;
    newBalance = currentCoins; // No change to coin balance
    accessMethodForLog = "free tier";
    console.log(`[ContentAccess] Granting access via ${accessMethodForLog} for content ${contentId} to user ${userId}. New free count: ${currentFreeConsumedCount + 1}.`);
  }
  // 3. Past free limit, check coins
  else if (currentCoins >= CONTENT_COST) {
    updatedData.coins = increment(-CONTENT_COST) as any;
    newBalance = currentCoins - CONTENT_COST;
    accessMethodForLog = "paid tier";
    console.log(`[ContentAccess] Granting access via ${accessMethodForLog} for content ${contentId} to user ${userId}. Deducting ${CONTENT_COST} coins. Old balance: ${currentCoins}, New balance: ${newBalance}.`);
  }
  // 4. Insufficient coins (and free tier exhausted)
  else {
    console.log(`[ContentAccess] User ${userId} has insufficient coins/free tier for content ${contentId}. Balance: ${currentCoins}, Free count: ${currentFreeConsumedCount}.`);
    return {
      canAccess: false,
      message: `Insufficient coins or free plays. This content costs ${CONTENT_COST} coins or uses a free play. Your balance: ${currentCoins} coins, Free plays left: ${FREE_LIMIT - currentFreeConsumedCount}. Please top up.`,
      profileWasUpdated: false,
      newBalance: currentCoins
    };
  }

  try {
    await updateDoc(userRef, updatedData);
    console.log(`[ContentAccess] Firestore updated for user ${userId} after consuming ${contentId} via ${accessMethodForLog}.`);
    return {
      canAccess: true,
      profileWasUpdated: true,
      newBalance: newBalance,
      showLowBalanceWarning: newBalance < LOW_BALANCE_THRESHOLD
    };
  } catch (error) {
    console.error(`[ContentAccess] Error updating Firestore for ${accessMethodForLog} consumption for user ${userId}, content ${contentId}:`, error);
    // Decide if access should still be granted if DB update fails (potentially leading to free access if retried)
    // For now, denying access if the DB update fails to ensure consistency.
    return {
      canAccess: false,
      message: "Failed to record content access. Please try again.",
      profileWasUpdated: false,
      newBalance: currentCoins // Revert to original balance state if update failed
    };
  }
}
