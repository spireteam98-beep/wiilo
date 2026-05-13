import { firestoreDb } from '@/lib/firebase-admin';
import crypto from 'crypto';
import { getAuth } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Regenerate OAuth Client Secret
 * POST /api/admin/oauth/clients/{clientId}/regenerate-secret
 * 
 * Generates a new client secret for the given OAuth client
 */
export async function POST(req: NextRequest, { params }: { params: { clientId: string } }) {
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
