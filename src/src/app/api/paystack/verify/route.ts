
// src/app/api/paystack/verify/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

// ---- Firebase Admin SDK Initialization ----
// Ensure FIREBASE_ADMIN_SDK_CONFIG environment variable is set with your service account JSON
try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG!);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[API /api/paystack/verify] Firebase Admin SDK initialized.');
  }
} catch (e: any) {
  console.error('[API /api/paystack/verify] Firebase Admin SDK initialization failed:', e.message);
  // We won't throw here, but subsequent Firestore operations will fail.
  // The function will return a 500 if dbAdmin is not available.
}

const dbAdmin = admin.apps.length ? getFirestore() : null;

export async function POST(request: NextRequest) {
  console.log('[API /api/paystack/verify] Received verification request.');

  if (!dbAdmin) {
    console.error('[API /api/paystack/verify] Firestore Admin SDK not initialized. Cannot process request.');
    return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const { reference } = await request.json();
    if (!reference) {
      console.warn('[API /api/paystack/verify] Missing payment reference in request body.');
      return NextResponse.json({ success: false, message: 'Payment reference is required.' }, { status: 400 });
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey || !(paystackSecretKey.startsWith('sk_live_') || paystackSecretKey.startsWith('sk_test_'))) {
      console.error('[API /api/paystack/verify] Paystack Secret Key is not configured or invalid in server environment variables (PAYSTACK_SECRET_KEY).');
      return NextResponse.json({ success: false, message: 'Payment gateway server configuration error. [PSK_SCFG01_SVR]' }, { status: 500 });
    }

    console.log(`[API /api/paystack/verify] Verifying reference: ${reference} with Paystack.`);
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const paystackData = await paystackResponse.json();
    console.log('[API /api/paystack/verify] Paystack verification API response status:', paystackResponse.status);
    console.log('[API /api/paystack/verify] Paystack verification API response data:', JSON.stringify(paystackData, null, 2));

    if (!paystackResponse.ok || !paystackData.status || paystackData.data?.status !== 'success') {
      console.warn(`[API /api/paystack/verify] Paystack verification failed or payment not successful for reference ${reference}. Message: ${paystackData.message}`);
      return NextResponse.json({ success: false, message: paystackData.message || 'Payment verification failed or payment not successful.' }, { status: 400 });
    }

    const transactionData = paystackData.data;
    const amountPaidKES = transactionData.amount / 100;
    const paymentMetadata = transactionData.metadata;
    const userId = paymentMetadata?.userId;
    const coinsToAddStr = paymentMetadata?.coins;
    const packageName = paymentMetadata?.packageName;

    if (!userId || typeof coinsToAddStr === 'undefined') {
      console.error(`[API /api/paystack/verify] CRITICAL: Invalid metadata from Paystack (userId or coins missing) for reference ${reference}. Metadata:`, paymentMetadata);
      // Still return success to Paystack if payment was good, but log this critical internal error.
      // We might not be able to credit coins without this metadata.
      return NextResponse.json({ success: true, message: 'Payment verified by Paystack, but metadata issue prevented crediting coins. Contact support.', credited: false });
    }

    const coinsToAdd = parseInt(coinsToAddStr, 10);
    if (isNaN(coinsToAdd) || coinsToAdd <= 0) {
      console.error(`[API /api/paystack/verify] CRITICAL: Invalid coins value in metadata for reference ${reference}. coinsToAddStr:`, coinsToAddStr);
      return NextResponse.json({ success: true, message: 'Payment verified by Paystack, but coin metadata invalid. Contact support.', credited: false });
    }

    console.log(`[API /api/paystack/verify] Payment for user ${userId} successful. Coins to add: ${coinsToAdd}, Package: ${packageName}`);

    const userRef = dbAdmin.collection('users').doc(userId);
    const userDocSnap = await userRef.get();

    const newPaymentRecord = {
      amount: amountPaidKES,
      coins: coinsToAdd,
      timestamp: Timestamp.now(),
      reference: reference,
      status: 'success',
      gateway: 'paystack',
      packageName: packageName || 'N/A',
      gatewayResponseSummary: {
        ip_address: transactionData.ip_address,
        currency: transactionData.currency,
        channel: transactionData.channel,
        card_type: transactionData.authorization?.card_type,
        bank: transactionData.authorization?.bank,
        country_code: transactionData.authorization?.country_code,
      }
    };

    if (!userDocSnap.exists) {
      console.warn(`[API /api/paystack/verify] User document for ${userId} does not exist. Creating with payment info...`);
      await userRef.set({
        uid: userId,
        email: transactionData.customer?.email || 'N/A',
        name: paymentMetadata?.userName || 'New User', // Assuming userName might be in metadata
        photoURL: paymentMetadata?.userPhotoURL || null,
        coins: coinsToAdd,
        paymentHistory: FieldValue.arrayUnion(newPaymentRecord),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastLogin: FieldValue.serverTimestamp(),
        // Add other default user fields as per your userManagement.js
        profileComplete: false,
        isAdmin: false,
        freeContentConsumedCount: 0,
        consumedContentIds: [],
        likedContentIds: [],
        savedContentIds: [],
        preferredCategories: [],
      });
    } else {
      const currentCoins = userDocSnap.data()?.coins || 0;
      const newBalance = currentCoins + coinsToAdd;
      await userRef.update({
        coins: newBalance,
        paymentHistory: FieldValue.arrayUnion(newPaymentRecord),
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`[API /api/paystack/verify] Firestore updated for user ${userId}. New balance: ${newBalance}`);
    }

    return NextResponse.json({ success: true, message: 'Payment verified and coins credited.', credited: true, coinsAdded: coinsToAdd });

  } catch (error: any) {
    console.error('[API /api/paystack/verify] Error processing Paystack verification:', error.message, error.stack);
    return NextResponse.json({ success: false, message: 'Internal server error during payment verification.' }, { status: 500 });
  }
}
