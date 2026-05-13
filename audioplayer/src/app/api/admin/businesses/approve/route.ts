import { verifyAdminFromRequest } from '@/lib/admin';
import { adminInitError, firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

// This dev-only admin endpoint flips a business to approved
// POST body: { id: string, action: 'approve' | 'reject' | 'suspend' | 'archive' }
export async function POST(req: Request) {
  try {
    if (!firebaseAuth || !firestoreDb) {
      console.error('Admin SDK not initialized:', adminInitError?.message ?? 'missing credentials');
      return NextResponse.json({ error: 'server_init_error', message: adminInitError?.message ?? 'Admin SDK credentials missing' }, { status: 500 });
    }
    const body = await req.json();
    const { id, action } = body || {};
    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });
    if (!action) return NextResponse.json({ error: 'missing_action' }, { status: 400 });

    // Verify admin via helper (either secret or admin token/claim)
    const verified = await verifyAdminFromRequest(req);
    if (!verified?.ok) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    }

    // Validate action to status mapping
    const mapping: Record<string, string> = {
      approve: 'active',
      reject: 'rejected',
      suspend: 'suspended',
      archive: 'archived',
      pending: 'pending',
    };
    const status = mapping[action];
    if (!status) return NextResponse.json({ error: 'invalid_action' }, { status: 400 });

    const docRef = firestoreDb.collection('businesses').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const data = doc.data();

    await docRef.update({
      status,
      approved: status === 'active',
      approvedAt: status === 'active' ? new Date().toISOString() : null,
    });

    return NextResponse.json({ ok: true, id, status }, { status: 200 });
  } catch (err: any) {
    console.error('Admin approve error', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}
