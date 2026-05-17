import { filterUserDataByScope } from '@/lib/oauth';
import { getToken, hashToken, isTokenValid, logOAuthEvent, updateTokenLastUsed } from '@/lib/oauth-firestore';
import { getRoyalPayId, getWalletId } from '@/lib/pin-utils';
import { getUserProfile } from '@/lib/user';
import { getAuth } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth User Info Endpoint
 * GET /api/oauth/userinfo
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Extract Bearer Token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Missing or invalid Bearer token' },
        { status: 401 }
      );
    }

    const accessTokenPlain = authHeader.substring(7);

    // --- DEBUG LOGS ---
    console.log("--- OAuth Trace Start ---");
    console.log("Received Token:", accessTokenPlain);

    // 2. Retrieve token from Firestore
    // Note: getToken(accessTokenPlain) will SHA-256 hash this input 
    // to look for the Document ID in Firestore.
    const token = await getToken(accessTokenPlain);

    console.log("Token Found in DB?:", !!token);
    if (token) {
      console.log("Token UserID:", token.userId);
      console.log("Is Expired?:", new Date() > token.expiresAt);
    }

    // 3. Validate Token logic
    if (!isTokenValid(token)) {
      console.log("❌ Validation Failed: Token is null, expired, or revoked.");
      
      // Fixed: Use 'not_found' or 'unknown' to prevent Firestore "undefined" crash
      await logOAuthEvent({
        eventType: 'error',
        clientId: token?.clientId || 'unknown',
        userId: token?.userId || 'not_found', 
        status: 'failure',
        errorCode: 'invalid_token',
        errorMessage: 'Token is invalid, expired, or revoked',
        ipAddress: req.ip || 'unknown',
      });

      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Token is invalid or expired' },
        { status: 401 }
      );
    }

    // 4. Update last used timestamp
    const tokenHash = hashToken(accessTokenPlain);
    await updateTokenLastUsed(tokenHash);

    // 5. Fetch User Data (Parallel for speed)
    const userId = token.userId;
    const [userProfile, walletId, royalPayId] = await Promise.all([
      getUserProfile(userId).catch(() => null),
      getWalletId(userId).catch(() => null),
      getRoyalPayId(userId).catch(() => null)
    ]);

    // 6. Get Auth Info from Firebase Authentication
    let email = '';
    let displayName = '';
    let photoURL = '';
    try {
      const auth = getAuth();
      const user = await auth.getUser(userId);
      email = user.email || '';
      displayName = user.displayName || '';
      photoURL = user.photoURL || '';
    } catch (err) {
      console.error('Firebase Auth lookup failed for UID:', userId);
    }

    // 7. Build standardized response
    const userData = {
      id: userId,
      name: displayName || userProfile?.displayName || userProfile?.name || 'User',
      email: email,
      picture: photoURL,
      email_verified: !!email,
      wallet_id: walletId || undefined,
      royal_pay_id: royalPayId || undefined,
      country: userProfile?.country || undefined,
    };

    // 8. Filter by requested scopes
    const filteredData = filterUserDataByScope(userData, token.scope);

    // 9. Log success
    await logOAuthEvent({
      eventType: 'token_used',
      clientId: token.clientId,
      userId: userId,
      scope: token.scope,
      status: 'success',
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(filteredData);

  } catch (error) {
    console.error('Critical User info error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}