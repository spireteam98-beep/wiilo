import { firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';

// Custom alphabet: No confusing characters like 0/O or 1/l
const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { firstName, lastName } = await req.json();

    const userRef = firestoreDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    // Prevent overwriting an existing ID
    if (userDoc.exists && userDoc.data()?.royalPayId) {
      return NextResponse.json({ error: 'Profile already setup' }, { status: 400 });
    }

    // Generate unique ID and verify it doesn't exist in DB
    let royalPayId = '';
    let isUnique = false;
    while (!isUnique) {
      royalPayId = `RP-${nanoid()}`;
      const snapshot = await firestoreDb.collection('users').where('royalPayId', '==', royalPayId).get();
      if (snapshot.empty) isUnique = true;
    }

    const profileData = {
      firstName,
      lastName,
      royalPayId,
      email: decodedToken.email,
      walletBalance: 0,
      createdAt: new Date().toISOString(),
    };

    await userRef.set(profileData, { merge: true });

    return NextResponse.json({ ok: true, royalPayId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}