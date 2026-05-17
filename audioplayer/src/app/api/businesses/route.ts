import { adminInitError, firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
const VALID_BUSINESS_TYPES = [
  'restaurant',
  'hotel',
  'airline',
];

// POST /api/businesses  - create a new business for the authenticated user
export async function POST(req: Request) {
  try {
    if (!firebaseAuth || !firestoreDb) {
      console.error('Firebase Admin not initialized:', adminInitError?.message ?? 'missing credentials');
      return NextResponse.json({ error: 'server_init_error', message: adminInitError?.message ?? 'Firebase Admin SDK not initialized on server.' }, { status: 500 });
    }
    const body = await req.json();
    const { name, description, type } = body || {};
    if (!name) return NextResponse.json({ error: 'name_required' }, { status: 400 });
    if (!type) return NextResponse.json({ error: 'type_required' }, { status: 400 });
    if (!VALID_BUSINESS_TYPES.includes(type)) return NextResponse.json({ error: 'invalid_type' }, { status: 400 });

    // Verify bearer token
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    if (!idToken) return NextResponse.json({ error: 'missing_auth' }, { status: 401 });

    // Verify ID token; catch and return explicit auth-related responses when verification fails
    let decoded;
    try {
      decoded = await firebaseAuth.verifyIdToken(idToken);
    } catch (e: any) {
      console.error('verifyIdToken failed', { message: e?.message ?? String(e), code: e?.code ?? null });
      return NextResponse.json({ error: 'invalid_token', message: String(e?.message ?? e), code: e?.code ?? null }, { status: 401 });
    }
    const uid = decoded.uid;

    // Check existing businesses for this owner
    const businessesSnap = await firestoreDb.collection('businesses').where('ownerUid', '==', uid).limit(1).get();
    if (!businessesSnap.empty) {
      const existing = businessesSnap.docs[0].data();
      return NextResponse.json({ error: 'already_exists', business: existing }, { status: 403 });
    }

    const newDocRef = firestoreDb.collection('businesses').doc();
    const businessData = {
      name,
      description: description ?? '',
      ownerUid: uid,
      type,
      approved: false,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await newDocRef.set(businessData);

    // Link business ID to user profile
    await firestoreDb.collection('users').doc(uid).set({ businessId: newDocRef.id }, { merge: true });

    return NextResponse.json({ ok: true, id: newDocRef.id, business: businessData }, { status: 201 });
  } catch (err: any) {
    // Log full error for server-side diagnostics (will appear in Vercel logs)
    console.error('Create business failed', {
      message: err?.message ?? String(err),
      code: err?.code ?? null,
      stack: err?.stack ?? null,
    });
    // Include error.code and message in the response to help debugging (safe non-sensitive info)
    return NextResponse.json(
      { error: 'server_error', code: err?.code ?? null, message: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

// GET /api/businesses -> returns businesses for authenticated user
export async function GET(req: Request) {
  try {
    if (!firebaseAuth || !firestoreDb) return NextResponse.json({ error: 'server_init_error', message: 'Firebase Admin SDK not initialized on server.' }, { status: 500 });
    // Must provide Authorization header with ID token
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    if (!idToken) return NextResponse.json({ error: 'missing_auth' }, { status: 401 });

    let decoded;
    try {
      decoded = await firebaseAuth.verifyIdToken(idToken);
    } catch (e: any) {
      console.error('verifyIdToken failed (list)', { message: e?.message ?? String(e), code: e?.code ?? null });
      return NextResponse.json({ error: 'invalid_token', message: String(e?.message ?? e), code: e?.code ?? null }, { status: 401 });
    }
    const uid = decoded.uid;

    const businessesSnap = await firestoreDb.collection('businesses').where('ownerUid', '==', uid).get();
    const list = businessesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, businesses: list }, { status: 200 });
  } catch (err: any) {
    console.error('List businesses failed', { message: err?.message ?? String(err), code: err?.code ?? null, stack: err?.stack ?? null });
    return NextResponse.json({ error: 'server_error', code: err?.code ?? null, message: String(err?.message ?? err) }, { status: 500 });
  }
}
