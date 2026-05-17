import { generateAndSaveAuthCode, logOAuthEvent } from '@/lib/oauth-firestore';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate OAuth Authorization Code
 * POST /api/oauth/generate-code
 * 
 * Called from the authorization page after PIN verification
 * Generates and saves authorization code to Firestore
 */
export async function POST(req: NextRequest) {
  try {
    const { clientId, userId, scope, redirectUri } = await req.json();

    // Validate required parameters
    if (!clientId || !userId || !scope || !redirectUri) {
      await logOAuthEvent({
        eventType: 'error',
        clientId: clientId || 'unknown',
        userId,
        status: 'failure',
        errorCode: 'invalid_request',
        errorMessage: 'Missing required parameters',
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers.get('user-agent') || undefined,
      });

      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Generate and save authorization code
    const code = await generateAndSaveAuthCode(
      clientId,
      userId,
      scope,
      redirectUri,
      req.ip || 'unknown',
      10 // 10 minute expiration
    );

    // Log the event
    await logOAuthEvent({
      eventType: 'auth_approved',
      clientId,
      userId,
      scope,
      status: 'success',
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ code }, { status: 200 });
  } catch (error) {
    console.error('Error generating authorization code:', error);
    
    await logOAuthEvent({
      eventType: 'error',
      clientId: 'unknown',
      status: 'failure',
      errorCode: 'server_error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      ipAddress: req.ip || 'unknown',
    });

    return NextResponse.json(
      { error: 'server_error', error_description: 'Failed to generate authorization code' },
      { status: 500 }
    );
  }
}
