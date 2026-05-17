import { firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

// GET /api/businesses/[id]/staff -> returns staff for the specific business
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: businessId } = await params;

    if (!firebaseAuth || !firestoreDb) {
      return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    }

    // Verify authentication (pattern from your existing route)
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    if (!idToken) return NextResponse.json({ error: 'missing_auth' }, { status: 401 });

    try {
      await firebaseAuth.verifyIdToken(idToken);
    } catch (e) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
    }

    // Use the server-side SDK 'firestoreDb'
    // Pattern: businesses (collection) -> [id] (doc) -> staff (sub-collection)
    const staffSnap = await firestoreDb
      .collection('businesses')
      .doc(businessId)
      .collection('staff')
      .get();

    const staffList = staffSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ ok: true, staff: staffList }, { status: 200 });
  } catch (err: any) {
    console.error('List staff failed', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

// POST /api/businesses/[id]/staff -> creates a new staff member
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: businessId } = await params;
    const body = await req.json();
    const { name, role, phone, salary, staffId, status } = body;

    if (!firebaseAuth || !firestoreDb) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });

    // Verify token
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    const decoded = await firebaseAuth.verifyIdToken(idToken);

    const newStaffRef = firestoreDb
      .collection('businesses')
      .doc(businessId)
      .collection('staff')
      .doc(); // Generate auto-id

    const staffData = {
      name,
      role,
      phone: phone ?? '',
      salary: salary ?? 0,
      staffId: staffId, // The generated human-readable ID
      status: status ?? 'active',
      createdBy: decoded.uid,
      createdAt: new Date().toISOString(),
    };

    await newStaffRef.set(staffData);

    return NextResponse.json({ ok: true, staff: { id: newStaffRef.id, ...staffData } }, { status: 201 });
  } catch (err: any) {
    console.error('Create staff failed', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}