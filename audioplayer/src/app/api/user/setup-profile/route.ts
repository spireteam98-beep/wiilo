import { firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { firstName, lastName, countryCode, whatsapp, pin } = await req.json();

    // 1. Multi-Tenant Atomic Counter Logic
    // We use a transaction to ensure no two users get the same KE0001
    const countryCounterRef = firestoreDb.collection('counters').doc(countryCode.toUpperCase());
    
    const royalPayId = await firestoreDb.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(countryCounterRef);
      let nextNumber = 1;

      if (counterDoc.exists) {
        nextNumber = counterDoc.data()?.lastNumber + 1;
      }

      transaction.set(countryCounterRef, { lastNumber: nextNumber }, { merge: true });

      // Format: KE + 0001 (padded to 4 digits)
      return `${countryCode.toUpperCase()}${nextNumber.toString().padStart(4, '0')}`;
    });

    // 2. Hash the PIN (Simple version for demo, use bcrypt in production)
    const hashedPin = pin; // Store securely

    const profileData = {
      firstName,
      lastName,
      royalPayId, // Functions as 12-digit Mastercard equivalent
      whatsapp,   // Functions as Bank Account Number
      countryCode,
      walletBalance: 0,
      pin: hashedPin, // Required for sensitive actions
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await firestoreDb.collection('users').doc(uid).set(profileData, { merge: true });

    return NextResponse.json({ ok: true, royalPayId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}