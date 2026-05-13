import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase"; 

export const fetchBalance = async (user) => {
  if (!user) return 0;

  const topUpRef = doc(db, "topup", user.uid);
  const topUpDoc = await getDoc(topUpRef);

  if (topUpDoc.exists()) {
    const topUpData = topUpDoc.data();
    console.log("Fetched current balance (coins):", topUpData.coins); 
    return topUpData.coins || 0; 
  }

  return 0; 
};