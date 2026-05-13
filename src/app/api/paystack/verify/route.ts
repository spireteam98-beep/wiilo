import { type NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import '@/lib/firebase-admin';

const dbAdmin = admin.apps.length ? admin.firestore() : null;

export async function POST(request: NextRequest) {
  if (!dbAdmin) {
    return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const { reference } = await request.json();
    if (!reference) {
      return NextResponse.json({ success: false, message: 'Payment reference is required.' }, { status: 400 });
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey || !(paystackSecretKey.startsWith('sk_live_') || paystackSecretKey.startsWith('sk_test_'))) {
      return NextResponse.json(
        { success: false, message: 'Payment gateway server configuration error. [PSK_SCFG01_SVR]' },
        { status: 500 }
      );
    }

    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status || paystackData.data?.status !== 'success') {
      return NextResponse.json(
        {
          success: false,
          message: paystackData.message || 'Payment verification failed or payment not successful.',
        },
        { status: 400 }
      );
    }

    const transactionData = paystackData.data;
    const amountPaidKES = transactionData.amount / 100;
    const paymentMetadata = transactionData.metadata;
    const userId = paymentMetadata?.userId;
    const coinsToAddStr = paymentMetadata?.coins;
    const packageName = paymentMetadata?.packageName;

    if (!userId || typeof coinsToAddStr === 'undefined') {
      return NextResponse.json({
        success: true,
        message: 'Payment verified by Paystack, but metadata issue prevented crediting coins. Contact support.',
        credited: false,
      });
    }

    const coinsToAdd = parseInt(coinsToAddStr, 10);
    if (isNaN(coinsToAdd) || coinsToAdd <= 0) {
      return NextResponse.json({
        success: true,
        message: 'Payment verified by Paystack, but coin metadata invalid. Contact support.',
        credited: false,
      });
    }

    const userRef = dbAdmin.collection('users').doc(userId);
    const userDocSnap = await userRef.get();

    if (userDocSnap.exists) {
      const existingHistory = userDocSnap.data()?.paymentHistory || [];
      const alreadyCredited = Array.isArray(existingHistory)
        && existingHistory.some((entry: any) => entry?.reference === reference);

      if (alreadyCredited) {
        return NextResponse.json({
          success: true,
          message: 'Payment already verified and wallet already updated.',
          credited: true,
          coinsAdded: 0,
        });
      }
    }

    const newPaymentRecord = {
      amount: amountPaidKES,
      coins: coinsToAdd,
      timestamp: Timestamp.now(),
      reference,
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
      },
    };

    if (!userDocSnap.exists) {
      await userRef.set({
        uid: userId,
        email: transactionData.customer?.email || 'N/A',
        name: paymentMetadata?.userName || 'New User',
        photoURL: paymentMetadata?.userPhotoURL || null,
        coins: coinsToAdd,
        paymentHistory: FieldValue.arrayUnion(newPaymentRecord),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastLogin: FieldValue.serverTimestamp(),
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
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and coins credited.',
      credited: true,
      coinsAdded: coinsToAdd,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error during payment verification.' },
      { status: 500 }
    );
  }
}
