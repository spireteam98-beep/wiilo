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

    const snap = await businessRef.collection('inventory-purchase-orders').orderBy('createdAt', 'desc').limit(200).get();
    const orders = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
    return NextResponse.json({ ok: true, orders }, { status: 200 });
  } catch (err: any) {
    console.error('List purchase orders failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const { supplierId, items, expectedDeliveryDate, note } = body || {};
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: 'missing_items' }, { status: 400 });

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

    // Simple items validation
    for (const it of items) {
      if (!it.itemId || typeof it.quantity !== 'number' || it.quantity <= 0) return NextResponse.json({ error: 'invalid_items' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const docRef = businessRef.collection('inventory-purchase-orders').doc();
    const po = { supplierId: supplierId || null, items, expectedDeliveryDate: expectedDeliveryDate || null, status: 'OPEN', note: note || '', createdBy: uid, createdAt: now };
    await docRef.set(po);
    return NextResponse.json({ ok: true, order: { id: docRef.id, ...po } }, { status: 201 });
  } catch (err: any) {
    console.error('Create purchase order failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const { id, status, items } = body || {};
    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

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

    const poRef = businessRef.collection('inventory-purchase-orders').doc(id);
    const poSnap = await poRef.get();
    if (!poSnap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const updates: any = {};
    if (status) updates.status = status;
    if (items) updates.items = items;
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'no_updates' }, { status: 400 });
    updates.updatedAt = new Date().toISOString();
    updates.updatedBy = uid;
    await poRef.update(updates);
    const updated = (await poRef.get()).data();
    return NextResponse.json({ ok: true, order: { id: poRef.id, ...(updated as any) } }, { status: 200 });
  } catch (err: any) {
    console.error('Update purchase order failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}
