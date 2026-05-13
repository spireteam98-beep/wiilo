import { firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/devices/register
 * Body: { idToken, fcmToken, deviceName? }
 * Verifies the Firebase ID token, registers the device under users/{uid}/devices/{autoId}
 * and adds the token to users/{uid}.fcmTokens (uses arrayUnion via admin SDK).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, fcmToken, deviceName } = body || {};

    if (!idToken || !fcmToken) {
      return NextResponse.json({ error: 'missing_params' }, { status: 400 });
    }

    // Verify ID token with Admin SDK
    let decoded: any;
    try {
      decoded = await firebaseAuth.verifyIdToken(idToken);
    } catch (err) {
      console.error('Invalid ID token in device register:', err);
      return NextResponse.json({ error: 'invalid_id_token' }, { status: 401 });
    }

    const uid = decoded.uid;

    // Create device document
    const devicesRef = firestoreDb.collection('users').doc(uid).collection('devices');
    const newDeviceRef = devicesRef.doc();
    const now = new Date();
    await newDeviceRef.set({
      fcmToken,
      deviceName: deviceName || null,
      createdAt: now,
      updatedAt: now,
    });

    // Add token to user's fcmTokens array using admin.firestore.FieldValue.arrayUnion
    try {
      const fv = admin.firestore.FieldValue;
      await firestoreDb.collection('users').doc(uid).update({ fcmTokens: fv.arrayUnion(fcmToken) });
    } catch (e) {
      // If update fails (e.g., doc doesn't exist), try to set the field
      try {
        const userRef = firestoreDb.collection('users').doc(uid);
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
          await userRef.set({ fcmTokens: [fcmToken], createdAt: now });
        } else {
          // As a fallback, read, dedupe and write back
          const data = userSnap.data() || {};
          const existing: string[] = Array.isArray(data.fcmTokens) ? data.fcmTokens : [];
          if (!existing.includes(fcmToken)) existing.push(fcmToken);
          await userRef.update({ fcmTokens: existing });
        }
      } catch (err2) {
        console.error('Failed to store fcm token on user doc:', err2);
      }
    }

    return NextResponse.json({ ok: true, id: newDeviceRef.id }, { status: 200 });
  } catch (err) {
    console.error('Error in /api/devices/register:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
