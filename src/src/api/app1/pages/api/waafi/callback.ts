
// pages/api/waafi/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Ensure this path is correct

// Placeholder for Waafi's callback verification logic (e.g., signature check)
// You MUST implement proper verification based on Waafi's documentation.
const verifyWaafiCallback = (req: NextApiRequest): boolean => {
  // Example: Check for a specific header or a signature from Waafi
  // const waafiSignature = req.headers['x-waafi-signature']; // Or similar header
  // const calculatedSignature = crypto.createHmac('sha256', process.env.WAAFI_WEBHOOK_SECRET) // Use a webhook secret
  //                             .update(JSON.stringify(req.body)) // Or raw body if required
  //                             .digest('hex');
  // if (waafiSignature !== calculatedSignature) {
  //   console.error("Waafi callback signature mismatch.");
  //   return false;
  // }
  console.log("Waafi callback received. TODO: Implement proper verification based on Waafi's documentation.");
  return true; // For now, assume it's valid. REPLACE WITH ACTUAL VERIFICATION.
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`[API /api/waafi/callback] Received request. Method: ${req.method}`);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    console.warn(`[API /api/waafi/callback] Method Not Allowed: Received ${req.method}, expected POST.`);
    return res.status(405).end('Method Not Allowed');
  }

  console.log("[API /api/waafi/callback] Request Body:", req.body);
  console.log("[API /api/waafi/callback] Request Headers:", req.headers);


  if (!verifyWaafiCallback(req)) {
    console.error("[API /api/waafi/callback] Callback verification failed.");
    return res.status(403).json({ success: false, message: "Callback verification failed." });
  }

  try {
    // Adapt this based on the actual payload structure from Waafi
    const {
      // Example fields from a hypothetical Waafi callback payload
      status, // e.g., "SUCCESS", "FAILED"
      transactionId, // This should be the referenceId we sent (or Waafi's transaction ID)
      amountPaid, // Amount paid in the target currency (e.g., SOS or USD if currency was USD)
      currency,   // Currency of amountPaid (e.g., "SOS" or "USD")
      msisdn,     // Payer's phone number
      customReference // The JSON stringified metadata we sent
    } = req.body;

    if (!customReference) {
        console.error("[API /api/waafi/callback] Waafi callback missing 'customReference' (our metadata).");
        return res.status(400).json({ success: false, message: "Callback data incomplete (missing customReference)." });
    }
    
    let internalMetadata;
    try {
        internalMetadata = JSON.parse(customReference);
    } catch (parseError) {
        console.error("[API /api/waafi/callback] Error parsing customReference from Waafi callback:", parseError, "Raw customReference:", customReference);
        return res.status(400).json({ success: false, message: "Invalid customReference format." });
    }


    const { userId, coins, originalAmountKES, packageName, internalTxId } = internalMetadata;

    if (!userId || !coins || !internalTxId) {
      console.error("[API /api/waafi/callback] Waafi callback missing critical metadata: userId, coins, or internalTxId.");
      return res.status(400).json({ success: false, message: "Callback metadata incomplete." });
    }

    // It's good to check if Waafi's transactionId matches the internalTxId we sent, for reconciliation.
    if (transactionId && transactionId !== internalTxId) {
        console.warn(`[API /api/waafi/callback] Waafi callback transactionId (${transactionId}) does not match internalTxId (${internalTxId}). Proceeding, but investigate.`);
    }


    if (status && status.toUpperCase() === 'SUCCESS') { // Adapt 'SUCCESS' to Waafi's actual success status string
      const userRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userRef);

      const paymentRecord = {
        method: 'waafi',
        amount: originalAmountKES, // Log KES amount for consistency
        coins: coins,
        timestamp: serverTimestamp(),
        reference: internalTxId, // Our internal transaction ID
        gatewayTransactionId: req.body.waafiTransactionId || transactionId || 'N/A', // Waafi's specific ID from their payload
        status: 'success',
        packageName: packageName,
        currency: "KES", // Record payment in KES
        gatewayResponseSummary: { // Store some raw Waafi data for reference
            waafiStatus: status,
            waafiAmountPaid: amountPaid, // This is the amount in the currency Waafi processed (e.g., USD)
            waafiCurrency: currency,   // This is the currency Waafi processed (e.g., "USD")
            waafiMsisdn: msisdn,
        }
      };

      if (userDocSnap.exists()) {
        const currentCoins = userDocSnap.data().coins || 0;
        await updateDoc(userRef, {
          coins: currentCoins + coins,
          paymentHistory: arrayUnion(paymentRecord),
          updatedAt: serverTimestamp(),
        });
      } else {
        // This case should ideally not happen if user is created on signup
        // But handle it defensively
        console.warn(`[API /api/waafi/callback] User document for ${userId} not found. Creating one for Waafi payment.`);
        await setDoc(userRef, {
          uid: userId,
          email: `waafi_user_${userId}@example.com`, // Placeholder, ideally get from auth if possible
          name: `Waafi User ${userId}`,
          photoURL: null,
          firstName: '',
          lastName: '',
          country: '',
          mobile: msisdn || '', // Use Waafi phone number if available
          profileComplete: false,
          preferredCategories: [],
          isAdmin: false,
          coins: coins,
          paymentHistory: arrayUnion(paymentRecord),
          freeContentConsumedCount: 0,
          consumedContentIds: [],
          likedContentIds: [],
          savedContentIds: [],
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          subscription: false, // Default value
        });
      }
      console.log(`[API /api/waafi/callback] Waafi payment successful for user ${userId}. ${coins} coins added.`);
      return res.status(200).json({ success: true, message: "Payment processed successfully." });
    } else {
      console.log(`[API /api/waafi/callback] Waafi payment not successful or status unknown for user ${userId}. Status: ${status}`);
      // Optionally log failed or pending transactions
      // Example: Log to a 'failed_transactions' collection or update a transaction record
      return res.status(200).json({ success: false, message: `Payment status: ${status || 'unknown'}` });
    }
  } catch (error: any) {
    console.error('[API /api/waafi/callback] Error processing Waafi callback:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error processing Waafi callback.' });
  }
}
