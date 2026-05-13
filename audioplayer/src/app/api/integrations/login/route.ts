import { firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/integrations/login
 * Header: Authorization: Bearer <Firebase ID Token>
 * Body (optional): { fcmToken?: string, deviceId?: string, deviceName?: string }
 * Verifies ID token, returns basic user info, and optionally registers device FCM token.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    if (!auth.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'missing_auth' }, { status: 401 });
    }

    const idToken = auth.substring(7);
    let decoded: any;
    try {
      decoded = await firebaseAuth.verifyIdToken(idToken);
    } catch (err) {
      console.error('Invalid ID token in /api/integrations/login:', err);
      return NextResponse.json({ error: 'invalid_id_token' }, { status: 401 });
    }

    const uid = decoded.uid as string;
    const body = await req.json().catch(() => ({}));
    const { fcmToken, deviceId, deviceName } = body || {};

    // Ensure user doc exists and fetch profile
    const userRef = firestoreDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : null;

    // Optionally register device
    if (fcmToken) {
      try {
        const devicesRef = userRef.collection('devices');
        const newDeviceRef = deviceId ? devicesRef.doc(deviceId) : devicesRef.doc();
        const now = new Date();
        await newDeviceRef.set({ fcmToken, deviceName: deviceName || null, createdAt: now, updatedAt: now }, { merge: true });

        // Add token to user's fcmTokens array
        const fv = admin.firestore.FieldValue;
        await userRef.update({ fcmTokens: fv.arrayUnion(fcmToken) });
      } catch (err) {
        console.warn('Failed to register device token (integration login):', err);
      }
    }

    // Return minimal profile
    const profile = {
      uid,
      email: decoded.email || (userData && userData.email) || null,
      name: (userData && userData.displayName) || decoded.name || null,
      royalPayId: userData?.royalPayId || null,
    };

    return NextResponse.json({ ok: true, profile }, { status: 200 });
  } catch (err) {
    console.error('Error in /api/integrations/login:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
