import { adminInitError, firestoreDb } from '@/lib/firebase-admin';
import { generateAndSaveToken, logOAuthEvent } from '@/lib/oauth-firestore';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify wallet PIN and issue a short-lived access token for external apps.
 * POST /api/oauth/verify-pin
 * Body: { clientId, userId, pin, scope?: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    if (!firestoreDb) {
      console.error('Admin SDK not initialized:', adminInitError?.message ?? 'missing credentials');
      return NextResponse.json({ error: 'server_init_error', message: adminInitError?.message ?? 'Admin SDK credentials missing' }, { status: 500 });
    }
    const body = await req.json();
    const { clientId, userId, pin, scope } = body || {};

    if (!clientId || !userId || !pin) {
      await logOAuthEvent({
        eventType: 'error',
        clientId: clientId || 'unknown',
        userId,
        status: 'failure',
        errorCode: 'invalid_request',
        errorMessage: 'Missing required parameters',
        ipAddress: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
        userAgent: req.headers.get('user-agent') || undefined,
      });

      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    // Fetch user profile from Firestore
    const userRef = firestoreDb.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      await logOAuthEvent({
        eventType: 'error',
        clientId,
        userId,
        status: 'failure',
        errorCode: 'user_not_found',
        errorMessage: 'User not found',
        ipAddress: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
        userAgent: req.headers.get('user-agent') || undefined,
      });
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    }

    const profile = userSnap.data();
    const storedPin = profile?.walletPin;

    // Simple PIN check (production: use hashed pins + rate limiting)
    if (!storedPin || String(pin) !== String(storedPin)) {
      await logOAuthEvent({
        eventType: 'auth_denied',
        clientId,
        userId,
        scope: scope || [],
        status: 'failure',
        errorCode: 'invalid_pin',
        errorMessage: 'Invalid PIN provided',
        ipAddress: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
        userAgent: req.headers.get('user-agent') || undefined,
      });
      return NextResponse.json({ error: 'invalid_pin' }, { status: 401 });
    }

    // PIN valid — generate access token
    const ipAddress = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
    const userAgent = req.headers.get('user-agent') || undefined;
    const tokenPlain = await generateAndSaveToken(clientId, userId, scope || [], ipAddress, userAgent, 1);

    await logOAuthEvent({
      eventType: 'token_issued',
      clientId,
      userId,
      scope: scope || [],
      status: 'success',
      ipAddress,
      userAgent,
    });

    // Return token to caller (bearer token)
    return NextResponse.json({ access_token: tokenPlain, token_type: 'bearer', expires_in: 3600 }, { status: 200 });
  } catch (error) {
    console.error('Error in verify-pin route:', error);
    try {
      await logOAuthEvent({
        eventType: 'error',
        clientId: 'unknown',
        status: 'failure',
        errorCode: 'server_error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: (req as any).ip || 'unknown',
        userAgent: req.headers.get('user-agent') || undefined,
      });
    } catch (e) {
      // ignore logging errors
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
