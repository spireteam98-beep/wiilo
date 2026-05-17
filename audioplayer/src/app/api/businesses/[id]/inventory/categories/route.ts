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

    // Authorization: owner or same business user
    const business = businessSnap.data() as any;
    if (business.ownerUid !== uid) {
      const userDoc = await firestoreDb.collection('users').doc(uid).get();
      const userData = userDoc.data() || {};
      if (userData.businessId !== businessId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const snap = await businessRef.collection('inventory-categories').orderBy('name').get();
    const categories = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
    return NextResponse.json({ ok: true, categories }, { status: 200 });
  } catch (err: any) {
    console.error('List categories failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const { name, description, parentId, defaultUnit, storageType, defaultSupplierId } = body || {};
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
    const catRef = businessRef.collection('inventory-categories').doc();
    const cat = { name, description: description ?? '', parentId: parentId ?? null, defaultUnit: defaultUnit ?? '', storageType: storageType ?? 'dry', defaultSupplierId: defaultSupplierId ?? null, createdAt: now, updatedAt: now };
    await catRef.set(cat);
    return NextResponse.json({ ok: true, id: catRef.id, category: cat }, { status: 201 });
  } catch (err: any) {
    console.error('Create category failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const { id: categoryId, name, description, parentId, defaultUnit, storageType, defaultSupplierId } = body || {};
    if (!categoryId || !name) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

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

    const catRef = businessRef.collection('inventory-categories').doc(categoryId);
    const catSnap = await catRef.get();
    if (!catSnap.exists) return NextResponse.json({ error: 'category_not_found' }, { status: 404 });
    const now = new Date().toISOString();
    await catRef.update({ name, description: description ?? '', parentId: parentId ?? null, defaultUnit: defaultUnit ?? '', storageType: storageType ?? 'dry', defaultSupplierId: defaultSupplierId ?? null, updatedAt: now });
    return NextResponse.json({ ok: true, category: { id: categoryId, name, description, parentId, defaultUnit, storageType, defaultSupplierId } }, { status: 200 });
  } catch (err: any) {
    console.error('Update category failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const { id: categoryId } = body || {};
    if (!categoryId) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

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

    const catRef = businessRef.collection('inventory-categories').doc(categoryId);
    const catSnap = await catRef.get();
    if (!catSnap.exists) return NextResponse.json({ error: 'category_not_found' }, { status: 404 });
    // Prevent deletion if category used by items
    const itemsUsingSnap = await businessRef.collection('inventory').where('categoryId', '==', categoryId).limit(1).get();
    if (!itemsUsingSnap.empty) return NextResponse.json({ error: 'category_in_use', message: 'Category in use by inventory items' }, { status: 400 });
    await catRef.delete();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error('Delete category failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

