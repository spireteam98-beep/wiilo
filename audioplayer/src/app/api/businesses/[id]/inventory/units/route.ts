import { firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    if (!idToken) return NextResponse.json({ error: 'missing_auth' }, { status: 401 });
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const businessRef = firestoreDb.collection('businesses').doc(businessId);
    const businessSnap = await businessRef.get();
    if (!businessSnap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const business = businessSnap.data() as any;
    if (business.ownerUid !== uid) {
      const userDoc = await firestoreDb.collection('users').doc(uid).get();
      const userData = userDoc.data() || {};
      if (userData.businessId !== businessId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const snap = await businessRef.collection('inventory-units').orderBy('name').get();
    const units = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
    return NextResponse.json({ ok: true, units }, { status: 200 });
  } catch (err: any) {
    console.error('List units failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const { name, symbol, description } = body || {};
    if (!name) return NextResponse.json({ error: 'name_required' }, { status: 400 });

    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    if (!idToken) return NextResponse.json({ error: 'missing_auth' }, { status: 401 });
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const businessRef = firestoreDb.collection('businesses').doc(businessId);
    const businessSnap = await businessRef.get();
    if (!businessSnap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const business = businessSnap.data() as any;
    if (business.ownerUid !== uid) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const now = new Date().toISOString();
    const ref = businessRef.collection('inventory-units').doc();
    const u = { name, symbol: symbol ?? '', description: description ?? '', createdAt: now, updatedAt: now };
    await ref.set(u);
    return NextResponse.json({ ok: true, id: ref.id, unit: u }, { status: 201 });
  } catch (err: any) {
    console.error('Create unit failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const { id: unitId, name, symbol, description } = body || {};
    if (!unitId || !name) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    if (!idToken) return NextResponse.json({ error: 'missing_auth' }, { status: 401 });
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const businessRef = firestoreDb.collection('businesses').doc(businessId);
    const businessSnap = await businessRef.get();
    if (!businessSnap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const business = businessSnap.data() as any;
    if (business.ownerUid !== uid) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const unitRef = businessRef.collection('inventory-units').doc(unitId);
    const unitSnap = await unitRef.get();
    if (!unitSnap.exists) return NextResponse.json({ error: 'unit_not_found' }, { status: 404 });
    const now = new Date().toISOString();
    await unitRef.update({ name, symbol: symbol ?? '', description: description ?? '', updatedAt: now });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error('Update unit failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const { id: unitId } = body || {};
    if (!unitId) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    if (!idToken) return NextResponse.json({ error: 'missing_auth' }, { status: 401 });
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const businessRef = firestoreDb.collection('businesses').doc(businessId);
    const businessSnap = await businessRef.get();
    if (!businessSnap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const business = businessSnap.data() as any;
    if (business.ownerUid !== uid) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const unitRef = businessRef.collection('inventory-units').doc(unitId);
    const unitSnap = await unitRef.get();
    if (!unitSnap.exists) return NextResponse.json({ error: 'unit_not_found' }, { status: 404 });
    // Prevent deletion if any item uses the unit
    const itemsUsing = await businessRef.collection('inventory').where('unit', '==', unitSnap.data()?.name || '').limit(1).get();
    if (!itemsUsing.empty) return NextResponse.json({ error: 'unit_in_use', message: 'Unit is used by inventory items' }, { status: 400 });
    await unitRef.delete();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error('Delete unit failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}
