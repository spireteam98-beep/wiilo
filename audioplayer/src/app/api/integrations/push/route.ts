import { adminInitError, firestoreDb } from '@/lib/firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/integrations/push
 * Body: { uniqueId, userId? (firebase uid), royalPayId? (lookup), scope?, appName?, appIcon? }
 * Creates a user_notifications entry and attempts to send an FCM multicast to user's devices.
 */
export async function POST(req: NextRequest) {
  try {
    if (!firestoreDb) {
      console.error('Admin SDK not initialized:', adminInitError?.message ?? 'missing credentials');
      return NextResponse.json({ error: 'server_init_error', message: adminInitError?.message ?? 'Admin SDK credentials missing' }, { status: 500 });
    }
    const body = await req.json();

    const { uniqueId, userId, royalPayId, scope, appName, appIcon } = body || {};

    if (!uniqueId || (!userId && !royalPayId)) {
      return NextResponse.json({ error: 'invalid_request', error_description: 'Missing uniqueId or user identifier' }, { status: 400 });
    }

    // Resolve uid
    let uid = userId;
    if (!uid && royalPayId) {
      const q = await firestoreDb.collection('users').where('royalPayId', '==', royalPayId).limit(1).get();
      if (!q.empty) {
        uid = q.docs[0].id;
      }
    }

    if (!uid) return NextResponse.json({ error: 'not_found', error_description: 'User not found' }, { status: 404 });

    const now = new Date();
    const notifRef = firestoreDb.collection('user_notifications').doc();
    const payload = {
      id: notifRef.id,
      userId: uid,
      uniqueId,
      scope: scope || [],
      appName: appName || null,
      appIcon: appIcon || null,
      type: 'oauth_request',
      status: 'pending',
      createdAt: now,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
    };

    await notifRef.set(payload);

    // Attempt to send FCM
    try {
      const userDoc = await firestoreDb.collection('users').doc(uid).get();
      const userData = userDoc.exists ? userDoc.data() : null;
      const tokens: string[] = [];

      if (userData) {
        if (Array.isArray(userData.fcmTokens)) tokens.push(...userData.fcmTokens.filter((t: any) => typeof t === 'string'));
        if (userData.fcmToken && typeof userData.fcmToken === 'string') tokens.push(userData.fcmToken);
      }

      try {
        const devicesSnap = await firestoreDb.collection('users').doc(uid).collection('devices').get();
        devicesSnap.forEach((d: any) => {
          const dd = d.data();
          if (dd && dd.fcmToken && typeof dd.fcmToken === 'string') tokens.push(dd.fcmToken);
        });
      } catch (e) {}

      const uniqueTokens = Array.from(new Set(tokens)).filter(Boolean);
      if (uniqueTokens.length > 0) {
        const messaging = getMessaging();
        const notificationTitle = appName ? `${appName} requests access` : 'Sign-in request';
        const notificationBody = `A request to sign in via ${appName || 'an app'} is waiting. Tap to approve.`;

        const message = {
          tokens: uniqueTokens,
          notification: { title: notificationTitle, body: notificationBody },
          data: { type: 'oauth_request', notificationId: notifRef.id, clientId: clientId, redirectUri: redirectUri || '', scope: JSON.stringify(scope || []) },
        } as any;

        try {
          const resp = await messaging.sendMulticast(message);
          console.log('Integrations push sendMulticast result:', resp);
        } catch (sendErr) {
          console.error('Integrations push send failed:', sendErr);
        }
      }
    } catch (err) {
      console.error('Error attempting to send FCM in integrations/push:', err);
    }

    return NextResponse.json({ ok: true, id: notifRef.id }, { status: 200 });
  } catch (err) {
    console.error('Error in /api/integrations/push:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
