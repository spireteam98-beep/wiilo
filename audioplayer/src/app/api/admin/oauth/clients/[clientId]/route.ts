import { firestoreDb } from '@/lib/firebase-admin';
import crypto from 'crypto';
import { getAuth } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: {
    clientId: string;
  };
}

/**
 * Get OAuth Client Details
 * GET /api/admin/oauth/clients/{clientId}
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { clientId } = params;

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

    const doc = await firestoreDb
      .collection('oauth_clients')
      .doc(clientId)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'not_found', message: 'OAuth client not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    // Don't return clientSecret
    delete data!.clientSecret;

    return NextResponse.json({
      id: doc.id,
      ...data,
    });
  } catch (error) {
    console.error('Error fetching OAuth client:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to fetch OAuth client' },
      { status: 500 }
    );
  }
}

/**
 * Update OAuth Client
 * PUT /api/admin/oauth/clients/{clientId}
 */
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { clientId } = params;

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

    // Check if client exists
    const doc = await firestoreDb
      .collection('oauth_clients')
      .doc(clientId)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'not_found', message: 'OAuth client not found' },
        { status: 404 }
      );
    }

    const {
      appName,
      appIcon,
      appDescription,
      redirectUris,
      allowedScopes,
      defaultScopes,
      supportUrl,
      verified,
      active,
      rateLimit,
    } = await req.json();

    // Build update object - only update provided fields
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: decodedToken.uid,
    };

    if (appName !== undefined) updateData.appName = appName;
    if (appIcon !== undefined) updateData.appIcon = appIcon;
    if (appDescription !== undefined) updateData.appDescription = appDescription;
    if (redirectUris !== undefined) {
      if (!Array.isArray(redirectUris) || redirectUris.length === 0) {
        return NextResponse.json(
          { error: 'invalid_request', message: 'redirectUris must be a non-empty array' },
          { status: 400 }
        );
      }
      updateData.redirectUris = redirectUris;
    }
    if (allowedScopes !== undefined) {
      if (!Array.isArray(allowedScopes) || allowedScopes.length === 0) {
        return NextResponse.json(
          { error: 'invalid_request', message: 'allowedScopes must be a non-empty array' },
          { status: 400 }
        );
      }
      updateData.allowedScopes = allowedScopes;
    }
    if (defaultScopes !== undefined) updateData.defaultScopes = defaultScopes;
    if (supportUrl !== undefined) updateData.supportUrl = supportUrl;
    if (verified !== undefined) {
      updateData.verified = verified;
      if (verified && !doc.data()!.verificationDate) {
        updateData.verificationDate = new Date();
      }
    }
    if (active !== undefined) updateData.active = active;
    if (rateLimit !== undefined) updateData.rateLimit = rateLimit;

    await firestoreDb
      .collection('oauth_clients')
      .doc(clientId)
      .update(updateData);

    return NextResponse.json({
      message: 'OAuth client updated successfully',
      clientId,
    });
  } catch (error) {
    console.error('Error updating OAuth client:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to update OAuth client' },
      { status: 500 }
    );
  }
}

/**
 * Delete OAuth Client
 * DELETE /api/admin/oauth/clients/{clientId}
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { clientId } = params;

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

    // Check if client exists
    const doc = await firestoreDb
      .collection('oauth_clients')
      .doc(clientId)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'not_found', message: 'OAuth client not found' },
        { status: 404 }
      );
    }

    // Delete the client
    await firestoreDb
      .collection('oauth_clients')
      .doc(clientId)
      .delete();

    return NextResponse.json({
      message: 'OAuth client deleted successfully',
      clientId,
    });
  } catch (error) {
    console.error('Error deleting OAuth client:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to delete OAuth client' },
      { status: 500 }
    );
  }
}

/**
 * Regenerate Client Secret
 * POST /api/admin/oauth/clients/{clientId}/regenerate-secret
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { clientId } = params;
    const url = new URL(req.url);

    // Check if this is a regenerate-secret request
    if (!url.pathname.includes('regenerate-secret')) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Invalid request' },
        { status: 400 }
      );
    }

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

    // Check if client exists
    const doc = await firestoreDb
      .collection('oauth_clients')
      .doc(clientId)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'not_found', message: 'OAuth client not found' },
        { status: 404 }
      );
    }

    // Generate new secret
    const clientSecret = crypto.randomBytes(32).toString('hex');
    const clientSecretHash = crypto.createHash('sha256').update(clientSecret).digest('hex');

    // Update client with new secret
    await firestoreDb
      .collection('oauth_clients')
      .doc(clientId)
      .update({
        clientSecret: clientSecretHash,
        updatedAt: new Date(),
        updatedBy: decodedToken.uid,
      });

    return NextResponse.json(
      {
        clientSecret,
        message: 'Client secret regenerated successfully. Save it securely - you will not see it again!',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error regenerating client secret:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to regenerate client secret' },
      { status: 500 }
    );
  }
}
