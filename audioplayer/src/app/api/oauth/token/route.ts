import { firestoreDb } from '@/lib/firebase-admin';
import {
    generateAndSaveToken,
    getAuthCode,
    isAuthCodeValid,
    logOAuthEvent,
    markAuthCodeAsUsed,
} from '@/lib/oauth-firestore';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Token Endpoint
 * POST /api/oauth/token
 * 
 * Exchange authorization code for access token
 * 
 * Request body:
 * {
 *   "grant_type": "authorization_code",
 *   "code": "...",
 *   "client_id": "...",
 *   "client_secret": "...",
 *   "redirect_uri": "..."
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { grant_type, code, client_id, client_secret, redirect_uri } = body;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers.get('user-agent') || undefined;

    // Validate grant type
    if (grant_type !== 'authorization_code') {
      await logOAuthEvent({
        eventType: 'error',
        clientId: client_id || 'unknown',
        status: 'failure',
        errorCode: 'unsupported_grant_type',
        errorMessage: 'Only authorization_code grant type is supported',
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        { error: 'unsupported_grant_type' },
        { status: 400 }
      );
    }

    // Validate required parameters
    if (!code || !client_id || !client_secret || !redirect_uri) {
      await logOAuthEvent({
        eventType: 'error',
        clientId: client_id || 'unknown',
        status: 'failure',
        errorCode: 'invalid_request',
        errorMessage: 'Missing required parameters',
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Retrieve authorization code from Firestore
    const authCode = await getAuthCode(code);

    // Validate authorization code
    if (!isAuthCodeValid(authCode)) {
      await logOAuthEvent({
        eventType: 'error',
        clientId: client_id,
        status: 'failure',
        errorCode: 'invalid_grant',
        errorMessage: 'Authorization code is invalid, expired, or already used',
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Authorization code is invalid or expired' },
        { status: 400 }
      );
    }

    // Verify client_id and redirect_uri match
    if (authCode.clientId !== client_id || authCode.redirectUri !== redirect_uri) {
      await logOAuthEvent({
        eventType: 'error',
        clientId: client_id,
        userId: authCode.userId,
        status: 'failure',
        errorCode: 'invalid_grant',
        errorMessage: 'client_id or redirect_uri does not match',
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'client_id or redirect_uri mismatch' },
        { status: 400 }
      );
    }

    // Validate client credentials against oauth_clients collection
    const clientDoc = await firestoreDb
      .collection('oauth_clients')
      .doc(client_id)
      .get();

    if (!clientDoc.exists) {
      await logOAuthEvent({
        eventType: 'error',
        clientId: client_id,
        userId: authCode.userId,
        status: 'failure',
        errorCode: 'invalid_client',
        errorMessage: 'OAuth client not found',
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Client not found' },
        { status: 401 }
      );
    }

    const clientData = clientDoc.data();
    if (!clientData) {
      await logOAuthEvent({
        eventType: 'error',
        clientId: client_id,
        userId: authCode.userId,
        status: 'failure',
        errorCode: 'invalid_client',
        errorMessage: 'OAuth client data is invalid',
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Client is invalid' },
        { status: 401 }
      );
    }

    // Verify client secret
    const clientSecretHash = crypto
      .createHash('sha256')
      .update(client_secret)
      .digest('hex');

    if (clientData.clientSecret !== clientSecretHash) {
      await logOAuthEvent({
        eventType: 'error',
        clientId: client_id,
        userId: authCode.userId,
        status: 'failure',
        errorCode: 'invalid_client',
        errorMessage: 'Invalid client secret',
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Invalid client credentials' },
        { status: 401 }
      );
    }

    // Check if client is active and verified
    if (!clientData.active) {
      await logOAuthEvent({
        eventType: 'error',
        clientId: client_id,
        userId: authCode.userId,
        status: 'failure',
        errorCode: 'invalid_client',
        errorMessage: 'OAuth client is not active',
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Client is not active' },
        { status: 401 }
      );
    }

    if (!clientData.verified) {
      await logOAuthEvent({
        eventType: 'error',
        clientId: client_id,
        userId: authCode.userId,
        status: 'failure',
        errorCode: 'invalid_client',
        errorMessage: 'OAuth client is not verified',
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Client is not verified' },
        { status: 401 }
      );
    }

    // Verify requested scopes are allowed
    const requestedScopes = authCode.scope;
    const allowedScopes = clientData.allowedScopes || [];

    const invalidScopes = requestedScopes.filter(scope => !allowedScopes.includes(scope));
    if (invalidScopes.length > 0) {
      await logOAuthEvent({
        eventType: 'error',
        clientId: client_id,
        userId: authCode.userId,
        status: 'failure',
        errorCode: 'invalid_scope',
        errorMessage: `Client not allowed to request scopes: ${invalidScopes.join(', ')}`,
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        {
          error: 'invalid_scope',
          error_description: `Client not allowed to request scopes: ${invalidScopes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Generate and save access token
    const accessToken = await generateAndSaveToken(
      client_id,
      authCode.userId,
      authCode.scope,
      ipAddress,
      userAgent,
      1 // 1 hour expiration
    );

    // Mark authorization code as used
    await markAuthCodeAsUsed(code);

    // Log successful token issuance
    await logOAuthEvent({
      eventType: 'token_issued',
      clientId: client_id,
      userId: authCode.userId,
      scope: authCode.scope,
      status: 'success',
      ipAddress,
      userAgent,
    });

    const expiresIn = 3600; // 1 hour
    const tokenType = 'Bearer';

    return NextResponse.json({
      access_token: accessToken,
      token_type: tokenType,
      expires_in: expiresIn,
      scope: authCode.scope.join(' '),
    });
  } catch (error) {
    console.error('OAuth token error:', error);

    await logOAuthEvent({
      eventType: 'error',
      clientId: 'unknown',
      status: 'failure',
      errorCode: 'server_error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      ipAddress: req.ip || 'unknown',
    });

    return NextResponse.json(
      { error: 'server_error', error_description: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
