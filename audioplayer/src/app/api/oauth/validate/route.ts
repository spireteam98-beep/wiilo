import { firestoreDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validate OAuth client_id and redirect_uri
 * GET /api/oauth/validate?client_id=...&redirect_uri=...
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');
    const redirectUri = url.searchParams.get('redirect_uri');

    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: 'invalid_request', error_description: 'Missing client_id or redirect_uri' }, { status: 400 });
    }

    const clientDoc = await firestoreDb.collection('oauth_clients').doc(clientId).get();
    if (!clientDoc.exists) {
      return NextResponse.json({ error: 'invalid_client', error_description: 'Client not found' }, { status: 404 });
    }

    const clientData = clientDoc.data() as any;
    const allowedRedirects: string[] = clientData?.redirectUris || clientData?.allowedRedirectUris || clientData?.redirect_uris || [];

    const matches = allowedRedirects.includes(redirectUri);

    if (!matches) {
      // return a clear error so calling UIs can show a helpful message
      return NextResponse.json({ error: 'invalid_redirect_uri', error_description: 'Redirect URI does not match registered client redirect URIs' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error validating oauth client redirect:', err);
    return NextResponse.json({ error: 'server_error', error_description: 'Error validating client' }, { status: 500 });
  }
}

// No POST handler — only GET is required by this endpoint.
