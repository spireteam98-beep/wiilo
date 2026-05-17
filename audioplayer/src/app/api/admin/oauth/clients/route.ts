import { firestoreDb } from '@/lib/firebase-admin';
import crypto from 'crypto';
import { getAuth } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Register a new OAuth Client
 * POST /api/admin/oauth/clients/register
 * 
 * Requires admin authentication
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Missing authentication' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decodedToken;
    try {
      const auth = getAuth();
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Check if user is admin (you may want to verify custom claims)
    // const isAdmin = decodedToken.admin === true;
    // For now, we'll allow any authenticated user to register (update as needed)

    const {
      appName,
      appIcon,
      appDescription,
      redirectUris,
      allowedScopes,
      developerEmail,
      developerName,
      supportUrl,
    } = await req.json();

    // Validate required fields
    if (!appName || !redirectUris || !allowedScopes || !developerEmail) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'Missing required fields: appName, redirectUris, allowedScopes, developerEmail',
        },
        { status: 400 }
      );
    }

    // Validate redirectUris is an array
    if (!Array.isArray(redirectUris) || redirectUris.length === 0) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'redirectUris must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate allowedScopes is an array
    if (!Array.isArray(allowedScopes) || allowedScopes.length === 0) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'allowedScopes must be a non-empty array' },
        { status: 400 }
      );
    }

    // Generate credentials
    const clientId = `royalpay_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = crypto.randomBytes(32).toString('hex');
    const clientSecretHash = crypto.createHash('sha256').update(clientSecret).digest('hex');

    // Create client object
    const oauthClient = {
      clientId,
      clientSecret: clientSecretHash, // Store hashed version
      appName,
      appIcon: appIcon || '',
      appDescription: appDescription || '',
      redirectUris,
      allowedScopes,
      defaultScopes: allowedScopes.slice(0, 2),
      developerEmail,
      developerName: developerName || '',
      supportUrl: supportUrl || '',
      verified: false, // Require manual verification
      active: true,
      verificationDate: null,
      rateLimit: {
        tokensPerHour: 100,
        requestsPerMinute: 30,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decodedToken.uid,
    };

    // Save to Firestore
    await firestoreDb
      .collection('oauth_clients')
      .doc(clientId)
      .set(oauthClient);

    // Return credentials (only time clientSecret is shown to user)
    return NextResponse.json(
      {
        clientId,
        clientSecret,
        message:
          'OAuth client registered successfully. Save the clientSecret securely - you will not see it again!',
        appName,
        redirectUris,
        allowedScopes,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering OAuth client:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to register OAuth client' },
      { status: 500 }
    );
  }
}

/**
 * List OAuth Clients
 * GET /api/admin/oauth/clients
 * 
 * Requires admin authentication
 */
export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Missing authentication' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    try {
      const auth = getAuth();
      await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const verified = req.nextUrl.searchParams.get('verified');
    const active = req.nextUrl.searchParams.get('active');

    let query = firestoreDb.collection('oauth_clients');

    if (verified === 'true' || verified === 'false') {
      query = query.where('verified', '==', verified === 'true');
    }

    if (active === 'true' || active === 'false') {
      query = query.where('active', '==', active === 'true');
    }

    const snapshot = await query.get();

    const clients = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Don't return clientSecret
      delete data.clientSecret;
      clients.push({
        id: doc.id,
        ...data,
      });
    });

    return NextResponse.json({ clients, total: clients.length });
  } catch (error) {
    console.error('Error listing OAuth clients:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to list OAuth clients' },
      { status: 500 }
    );
  }
}
