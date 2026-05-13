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

    const snap = await businessRef.collection('inventory-suppliers').orderBy('name').get();
    const suppliers = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
    return NextResponse.json({ ok: true, suppliers }, { status: 200 });
  } catch (err: any) {
    console.error('List suppliers failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const { name, contact, address, priceList, status } = body || {};
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
    const ref = businessRef.collection('inventory-suppliers').doc();
    const supplier = { name, contact: contact ?? '', address: address ?? '', priceList: priceList ?? null, status: status ?? 'active', createdAt: now, updatedAt: now };
    await ref.set(supplier);
    return NextResponse.json({ ok: true, id: ref.id, supplier }, { status: 201 });
  } catch (err: any) {
    console.error('Create supplier failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const { id: supplierId, name, contact, address, priceList, status } = body || {};
    if (!supplierId || !name) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

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

    const supRef = businessRef.collection('inventory-suppliers').doc(supplierId);
    const supSnap = await supRef.get();
    if (!supSnap.exists) return NextResponse.json({ error: 'supplier_not_found' }, { status: 404 });
    const now = new Date().toISOString();
    await supRef.update({ name, contact: contact ?? '', address: address ?? '', priceList: priceList ?? null, status: status ?? 'active', updatedAt: now });
    return NextResponse.json({ ok: true, supplier: { id: supplierId, name, contact, address, priceList, status } }, { status: 200 });
  } catch (err: any) {
    console.error('Update supplier failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const { id: supplierId } = body || {};
    if (!supplierId) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

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

    const supRef = businessRef.collection('inventory-suppliers').doc(supplierId);
    const supSnap = await supRef.get();
    if (!supSnap.exists) return NextResponse.json({ error: 'supplier_not_found' }, { status: 404 });
    // Prevent deletion if supplier is used in movements
    const movementsUsing = await businessRef.collection('inventory-movements').where('supplierId', '==', supplierId).limit(1).get();
    if (!movementsUsing.empty) return NextResponse.json({ error: 'supplier_in_use', message: 'Supplier is referenced by stock movements' }, { status: 400 });
    // Prevent deletion if any category references this supplier as default
    const categoriesUsing = await businessRef.collection('inventory-categories').where('defaultSupplierId', '==', supplierId).limit(1).get();
    if (!categoriesUsing.empty) return NextResponse.json({ error: 'supplier_in_use', message: 'Supplier is set as default for one or more categories' }, { status: 400 });
    await supRef.delete();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error('Delete supplier failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

