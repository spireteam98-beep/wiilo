import { adminInitError, firestoreDb } from '@/lib/firebase-admin';
import { generateAndSaveToken, logOAuthEvent } from '@/lib/oauth-firestore';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/confirm
 * Body: { id: notificationId, pin }
 * Verifies PIN for the user tied to notification, updates notification to confirmed,
 * issues an access token and sets it as an httpOnly cookie.
 */
export async function POST(req: NextRequest) {
  try {
    if (!firestoreDb) {
      console.error('Admin SDK not initialized:', adminInitError?.message ?? 'missing credentials');
      return NextResponse.json({ error: 'server_init_error', message: adminInitError?.message ?? 'Admin SDK credentials missing' }, { status: 500 });
    }
    const body = await req.json();
    const { id, pin } = body || {};
    if (!id || !pin) return NextResponse.json({ error: 'missing_params' }, { status: 400 });

    const notifRef = firestoreDb.collection('user_notifications').doc(id);
    const notifSnap = await notifRef.get();
    if (!notifSnap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const notif = notifSnap.data();
    const userId = notif.userId;

    // Fetch user and check PIN
    const userRef = firestoreDb.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    const profile = userSnap.data();
    const storedPin = profile?.walletPin;

    if (!storedPin || String(pin) !== String(storedPin)) {
      await logOAuthEvent({
        eventType: 'auth_denied',
        clientId: notif.clientId || 'external',
        userId,
        scope: notif.scope || [],
        status: 'failure',
        errorCode: 'invalid_pin',
        errorMessage: 'Invalid PIN',
        ipAddress: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
        userAgent: req.headers.get('user-agent') || undefined,
      });

      return NextResponse.json({ error: 'invalid_pin' }, { status: 401 });
    }

    // PIN valid — mark notification confirmed and issue token
    await notifRef.update({ status: 'confirmed', confirmedAt: new Date() });

    const ipAddress = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
    const userAgent = req.headers.get('user-agent') || undefined;
    const tokenPlain = await generateAndSaveToken(notif.clientId || 'external', userId, notif.scope || [], ipAddress, userAgent, 1);

    await logOAuthEvent({
      eventType: 'token_issued',
      clientId: notif.clientId || 'external',
      userId,
      scope: notif.scope || [],
      status: 'success',
      ipAddress,
      userAgent,
    });

    const res = NextResponse.json({ ok: true, id, access_token: tokenPlain }, { status: 200 });
    // Set httpOnly cookie for the token (maxAge 1 hour)
    res.cookies.set('royalpay_token', tokenPlain, { httpOnly: true, path: '/', maxAge: 3600 });
    return res;
  } catch (err) {
    console.error('Error in /api/auth/confirm:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
