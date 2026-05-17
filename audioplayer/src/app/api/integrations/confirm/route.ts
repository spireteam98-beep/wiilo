import { adminInitError, firestoreDb } from '@/lib/firebase-admin';
import { generateAndSaveToken, logOAuthEvent } from '@/lib/oauth-firestore';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/integrations/confirm
 * Body: { notificationId, pin, uniqueId }
 * Verifies PIN for the notification's user, validates the provided `uniqueId` matches the notification,
 * marks notification confirmed and issues short-lived token.
 */
export async function POST(req: NextRequest) {
  try {
    if (!firestoreDb) {
      console.error('Admin SDK not initialized:', adminInitError?.message ?? 'missing credentials');
      return NextResponse.json({ error: 'server_init_error', message: adminInitError?.message ?? 'Admin SDK credentials missing' }, { status: 500 });
    }
    const body = await req.json();
    const { notificationId, pin, uniqueId } = body || {};
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers.get('user-agent') || undefined;

    if (!notificationId || !pin || !uniqueId) {
      return NextResponse.json({ error: 'invalid_request', error_description: 'Missing notificationId, pin, or uniqueId' }, { status: 400 });
    }

    const notifRef = firestoreDb.collection('user_notifications').doc(notificationId);
    const notifSnap = await notifRef.get();
    if (!notifSnap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const notif = notifSnap.data() as any;
    if (notif.status !== 'pending') return NextResponse.json({ error: 'invalid_request', error_description: 'Notification not pending' }, { status: 400 });

    // Validate uniqueId matches the notification (third-party proof)
    if (notif.uniqueId && notif.uniqueId !== uniqueId) {
      await logOAuthEvent({ eventType: 'error', clientId: notif.clientId || 'unknown', userId: notif.userId, status: 'failure', errorCode: 'invalid_unique_id', errorMessage: 'uniqueId does not match notification', ipAddress, userAgent });
      return NextResponse.json({ error: 'invalid_unique_id', error_description: 'Provided uniqueId does not match' }, { status: 400 });
    }

    const uid = notif.userId;
    // Verify PIN using server-side lookup
    // (pin-utils uses client SDK; read user doc directly for server)
    const userDoc = await firestoreDb.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() as any : null;
    const storedPin = userData?.walletPin;
    if (!storedPin || storedPin !== pin) {
      await logOAuthEvent({ eventType: 'error', clientId: notif.clientId || 'unknown', userId: uid, status: 'failure', errorCode: 'invalid_pin', errorMessage: 'Invalid PIN', ipAddress, userAgent });
      return NextResponse.json({ error: 'invalid_pin' }, { status: 401 });
    }

    // Mark notification confirmed
    await notifRef.update({ status: 'confirmed', confirmedAt: new Date() });

    // Issue short-lived token (1 hour) associated to client and user
    const accessToken = await generateAndSaveToken(notif.clientId || 'unknown', uid, notif.scope || [], ipAddress, userAgent, 1);

    await logOAuthEvent({ eventType: 'auth_approved', clientId: notif.clientId || 'unknown', userId: uid, scope: notif.scope || [], status: 'success', ipAddress, userAgent });

    return NextResponse.json({ ok: true, access_token: accessToken, token_type: 'Bearer', expires_in: 3600 }, { status: 200 });
  } catch (err) {
    console.error('Error in /api/integrations/confirm:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
