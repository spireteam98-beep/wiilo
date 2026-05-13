// src/lib/userInteractions.ts
import { db } from './firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp } from 'firebase/firestore';
import type { UserProfile } from './firebase';

/**
 * Toggles the like status of a content item for a user.
 * Adds to likedContentIds if not present, removes if present.
 * Returns true if liked, false if unliked.
 */
export const toggleLikeContent = async (userId: string, contentId: string): Promise<boolean> => {
  if (!userId || !contentId) {
    console.error("[UserInteractions] User ID or Content ID is missing for toggleLikeContent.");
    throw new Error("User ID or Content ID is missing.");
  }
  const userRef = doc(db, 'users', userId);
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.error(`[UserInteractions] User document not found for ID: ${userId}`);
      throw new Error("User profile not found.");
    }
    const userData = userDoc.data() as UserProfile;
    const likedContentIds = userData.likedContentIds || [];

    if (likedContentIds.includes(contentId)) {
      // Item is already liked, so unlike it
      await updateDoc(userRef, {
        likedContentIds: arrayRemove(contentId),
        updatedAt: serverTimestamp()
      });
      console.log(`[UserInteractions] Content ${contentId} unliked by user ${userId}`);
      return false; // Indicates item was unliked
    } else {
      // Item is not liked, so like it
      await updateDoc(userRef, {
        likedContentIds: arrayUnion(contentId),
        updatedAt: serverTimestamp()
      });
      console.log(`[UserInteractions] Content ${contentId} liked by user ${userId}`);
      return true; // Indicates item was liked
    }
  } catch (error) {
    console.error("[UserInteractions] Error toggling like status:", error);
    throw error;
  }
};

/**
 * Toggles the save status of a content item for a user.
 * Adds to savedContentIds if not present, removes if present.
 * Returns true if saved, false if unsaved.
 */
export const toggleSaveContent = async (userId: string, contentId: string): Promise<boolean> => {
  if (!userId || !contentId) {
    console.error("[UserInteractions] User ID or Content ID is missing for toggleSaveContent.");
    throw new Error("User ID or Content ID is missing.");
  }
  const userRef = doc(db, 'users', userId);
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.error(`[UserInteractions] User document not found for ID: ${userId}`);
      throw new Error("User profile not found.");
    }
    const userData = userDoc.data() as UserProfile;
    const savedContentIds = userData.savedContentIds || [];

    if (savedContentIds.includes(contentId)) {
      // Item is already saved, so unsave it
      await updateDoc(userRef, {
        savedContentIds: arrayRemove(contentId),
        updatedAt: serverTimestamp()
      });
      console.log(`[UserInteractions] Content ${contentId} unsaved by user ${userId}`);
      return false; // Indicates item was unsaved
    } else {
      // Item is not saved, so save it
      await updateDoc(userRef, {
        savedContentIds: arrayUnion(contentId),
        updatedAt: serverTimestamp()
      });
      console.log(`[UserInteractions] Content ${contentId} saved by user ${userId}`);
      return true; // Indicates item was saved
    }
  } catch (error) {
    console.error("[UserInteractions] Error toggling save status:", error);
    throw error;
  }
};
