import { adminInitError, firestoreDb } from '@/lib/firebase-admin';
import { logOAuthEvent } from '@/lib/oauth-firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/start
 * Body: { royalPayId, clientId? }
 * Finds user by royalPayId, creates `user_notifications` and sends FCM push.
 */
export async function POST(req: NextRequest) {
  try {
    if (!firestoreDb) {
      console.error('Admin SDK not initialized:', adminInitError?.message ?? 'missing credentials');
      return NextResponse.json({ error: 'server_init_error', message: adminInitError?.message ?? 'Admin SDK credentials missing' }, { status: 500 });
    }
    const body = await req.json();
    const { royalPayId, clientId, appName, appIcon } = body || {};

    if (!royalPayId) {
      return NextResponse.json({ error: 'missing_royalPayId' }, { status: 400 });
    }

    // Find user by royalPayId
    const usersQ = await firestoreDb.collection('users').where('royalPayId', '==', royalPayId).limit(1).get();
    if (usersQ.empty) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    }
    const userDoc = usersQ.docs[0];
    const userId = userDoc.id;

    // Create notification
    const notifRef = firestoreDb.collection('user_notifications').doc();
    const now = new Date();
    const payload = {
      id: notifRef.id,
      userId,
      clientId: clientId || 'external',
      scope: [],
      redirectUri: null,
      appName: appName || null,
      appIcon: appIcon || null,
      type: 'oauth_request',
      status: 'pending',
      createdAt: now,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
    };

    await notifRef.set(payload);

    // Attempt to send FCM (reuse patterns from oauth/request route)
    try {
      const userData = userDoc.data();
      const tokens: string[] = [];
      if (userData) {
        if (Array.isArray(userData.fcmTokens)) tokens.push(...userData.fcmTokens.filter(Boolean));
        if (userData.fcmToken) tokens.push(userData.fcmToken);
      }
      try {
        const devicesSnap = await firestoreDb.collection('users').doc(userId).collection('devices').get();
        devicesSnap.forEach((d: any) => {
          const dd = d.data();
          if (dd && dd.fcmToken) tokens.push(dd.fcmToken);
        });
      } catch (e) {
        // ignore
      }
      const unique = Array.from(new Set(tokens)).filter(Boolean);
      if (unique.length > 0) {
        const messaging = getMessaging();
        const message = {
          tokens: unique,
          notification: {
            title: appName ? `${appName} requests sign-in` : 'Sign-in request',
            body: 'Approve sign-in in your RoyalPay app',
          },
          data: {
            type: 'oauth_request',
            notificationId: notifRef.id,
            clientId: clientId || 'external',
          },
        } as any;
        try {
          const resp = await messaging.sendMulticast(message);
          console.log('Auth start FCM result', resp);
        } catch (err) {
          console.error('Failed to send FCM in auth/start', err);
        }
      }
    } catch (err) {
      console.error('Error trying to send FCM on auth/start', err);
    }

    await logOAuthEvent({
      eventType: 'auth_requested',
      clientId: clientId || 'external',
      userId,
      scope: [],
      status: 'success',
      ipAddress: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ ok: true, id: notifRef.id }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/auth/start:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
