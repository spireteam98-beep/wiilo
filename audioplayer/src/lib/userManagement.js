// src/lib/userManagement.js
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from './firebase'; // Adjust path if needed

// Function to initialize user if not present in Firestore
export const initializeUserInFirestore = async (user) => {
  if (!user) {
    console.error("[UserManagement] User not provided for initialization.");
    return;
  }
  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const nameParts = user.displayName?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || `${firstName} ${lastName}`.trim(),
        email: user.email,
        photoURL: user.photoURL,
        firstName: firstName,
        lastName: lastName,
        country: '',
        mobile: '',
        profileComplete: false,
        preferredCategories: [],
        isAdmin: false, // Default to not admin
        coins: 0, 
        freeContentConsumedCount: 0,
        consumedContentIds: [],
        likedContentIds: [],
        savedContentIds: [],
        lastLogin: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("[UserManagement] User initialized in Firestore:", user.uid);
    } else {
      // Ensure all new fields exist on existing users
      const userData = userDoc.data();
      const updates = { lastLogin: serverTimestamp(), updatedAt: serverTimestamp() };
      if (typeof userData.profileComplete === 'undefined') updates.profileComplete = false;
      if (!userData.preferredCategories) updates.preferredCategories = [];
      if (typeof userData.isAdmin === 'undefined') updates.isAdmin = false;
      if (typeof userData.coins === 'undefined') updates.coins = 0;
      if (typeof userData.freeContentConsumedCount === 'undefined') updates.freeContentConsumedCount = 0;
      if (!userData.consumedContentIds) updates.consumedContentIds = [];
      if (!userData.likedContentIds) updates.likedContentIds = [];
      if (!userData.savedContentIds) updates.savedContentIds = [];
      if (Object.keys(updates).length > 2) { // More than just timestamps
        await updateDoc(userRef, updates);
        console.log("[UserManagement] Existing user document updated with new fields:", user.uid, updates);
      } else {
         await updateDoc(userRef, { lastLogin: serverTimestamp(), updatedAt: serverTimestamp() });
      }
    }
  } catch (error) {
    console.error("[UserManagement] Error initializing/updating user:", error);
  }
};
