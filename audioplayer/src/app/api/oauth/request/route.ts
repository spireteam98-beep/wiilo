import { adminInitError, firestoreDb } from '@/lib/firebase-admin';
import { logOAuthEvent } from '@/lib/oauth-firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Create a pending OAuth request notification for the user.
 * POST /api/oauth/request
 * Body: { clientId, userId, scope, redirectUri, appName?, appIcon? }
 */
export async function POST(req: NextRequest) {
  try {
    if (!firestoreDb) {
      console.error('Admin SDK not initialized:', adminInitError?.message ?? 'missing credentials');
      return NextResponse.json({ error: 'server_init_error', message: adminInitError?.message ?? 'Admin SDK credentials missing' }, { status: 500 });
    }
    const { clientId, userId, scope, redirectUri, appName, appIcon } = await req.json();

    if (!clientId || !userId) {
      await logOAuthEvent({
        eventType: 'error',
        clientId: clientId || 'unknown',
        userId,
        status: 'failure',
        errorCode: 'invalid_request',
        errorMessage: 'Missing required parameters for oauth request notification',
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers.get('user-agent') || undefined,
      });

      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    const now = new Date();
    const notifRef = firestoreDb.collection('user_notifications').doc();

    const payload = {
      id: notifRef.id,
      userId,
      clientId,
      scope: scope || [],
      redirectUri: redirectUri || null,
      appName: appName || null,
      appIcon: appIcon || null,
      type: 'oauth_request',
      status: 'pending',
      createdAt: now,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000), // expire in 10 minutes
    };

    await notifRef.set(payload);
    // Try to send FCM push to user's registered device tokens (if Admin SDK available)
    try {
      // Fetch potential tokens from user document
      const userDoc = await firestoreDb.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      const tokens: string[] = [];

      // Common patterns: `fcmTokens` array on user doc, or `devices` subcollection
      if (userData) {
        if (Array.isArray(userData.fcmTokens)) {
          for (const t of userData.fcmTokens) {
            if (typeof t === 'string' && t.length) tokens.push(t);
          }
        }
        // legacy single field
        if (userData.fcmToken && typeof userData.fcmToken === 'string') {
          tokens.push(userData.fcmToken);
        }
      }

      // Check devices subcollection for `fcmToken` fields
      try {
        const devicesSnap = await firestoreDb.collection('users').doc(userId).collection('devices').get();
        devicesSnap.forEach((d: any) => {
          const dd = d.data();
          if (dd && dd.fcmToken && typeof dd.fcmToken === 'string') {
            tokens.push(dd.fcmToken);
          }
        });
      } catch (e) {
        // ignore if devices subcollection doesn't exist or permissions denied
      }

      // Deduplicate tokens
      const uniqueTokens = Array.from(new Set(tokens)).filter(Boolean);

      if (uniqueTokens.length > 0) {
        const messaging = getMessaging();
        const notificationTitle = appName ? `${appName} requests access` : 'Sign-in request';
        const notificationBody = `A request to sign in via ${appName || 'an app'} is waiting. Tap to approve.`;

        const message = {
          tokens: uniqueTokens,
          notification: {
            title: notificationTitle,
            body: notificationBody,
          },
          data: {
            type: 'oauth_request',
            notificationId: notifRef.id,
            clientId: clientId,
            redirectUri: redirectUri || '',
            scope: JSON.stringify(scope || []),
          },
        } as any;

        try {
          const resp = await messaging.sendMulticast(message);
          console.log('FCM sendMulticast result:', resp);
        } catch (sendErr) {
          console.error('Failed to send FCM multicast:', sendErr);
        }
      }

    } catch (err) {
      console.error('Error attempting to send FCM notification:', err);
    }

    await logOAuthEvent({
      eventType: 'auth_requested',
      clientId,
      userId,
      scope: scope || [],
      status: 'success',
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ ok: true, id: notifRef.id }, { status: 200 });
  } catch (error) {
    console.error('Error creating oauth request notification:', error);

    await logOAuthEvent({
      eventType: 'error',
      clientId: 'unknown',
      status: 'failure',
      errorCode: 'server_error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      ipAddress: (req as any).ip || 'unknown',
    });

    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
