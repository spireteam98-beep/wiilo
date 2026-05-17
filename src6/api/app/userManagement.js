import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from './firebase.js'; // Adjust path if needed

// Function to initialize user if not present in Firestore
export const initializeUser = async (user) => {
  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        articleCount: 0, // Set initial article count to 0
        lastAccessDate: new Date().toISOString(), // Set initial access date
        subscription: false, // Set initial subscription status to false
        balance: 0, // Initialize wallet balance
      });
    }
  } catch (error) {
    console.error("Error initializing user:", error);
    throw error;
  }
};

// Function to track article access and check wallet balance
export const trackArticleAccess = async (navigate, setShowPreview) => {
  try {
    const user = auth.currentUser;
    console.log("trackArticleAccess - Current user:", user); // Debugging statement
    if (user) {
      const topupRef = doc(db, "topup", user.uid); // Reference to the topup document for the user
      const topupDoc = await getDoc(topupRef);
      console.log("trackArticleAccess - Topup document data:", topupDoc.data()); // Debugging statement

      let { coins: balance } = topupDoc.data(); // Fetch balance from topup document

      if (balance < 1) {
        // Redirect to top-up page if balance is less than $1
        if (window.confirm("Your wallet balance is too low to access this article. Please top up your account.")) {
          navigate('/top-up');
        }
      } else {
        balance -= 2; // Deduct $1 from the wallet balance
        await updateDoc(topupRef, {
          coins: balance, // Update the wallet balance
        });
        console.log("trackArticleAccess - Updated balance:", balance); // Debugging statement

        if (balance < 10) {
          // Show content preview with buttons if balance is low but still positive
          setShowPreview(true);
        }
      }
    } else {
      console.warn("trackArticleAccess - No authenticated user found.");
    }
  } catch (error) {
    console.error("Error tracking article access:", error);
    throw error;
  }
};
