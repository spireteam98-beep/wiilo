import { firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

// GET /api/businesses/:id/inventory -> list inventory for the business (if user authorized)
export async function GET(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    // verify auth token
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    if (!idToken) return NextResponse.json({ error: 'missing_auth' }, { status: 401 });

    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // Check business exists
    const businessRef = firestoreDb.collection('businesses').doc(businessId);
    const businessSnap = await businessRef.get();
    if (!businessSnap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const business = businessSnap.data();

    // Simple authorization: user must be the owner or have users/{uid}.businessId === businessId
    if (business.ownerUid !== uid) {
      const userDoc = await firestoreDb.collection('users').doc(uid).get();
      const userData = userDoc.data() || {};
      if (userData.businessId !== businessId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const itemsSnap = await businessRef.collection('inventory').orderBy('createdAt', 'desc').get();
    const items = itemsSnap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (err: any) {
    console.error('List inventory failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

// POST /api/businesses/:id/inventory -> add an inventory item to the business (owner/profile)
export async function POST(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const { name, sku, quantity, unit, categoryId, reorderLevel, description, storageLocation, unitPrice, enabled } = body || {};
    if (!name) return NextResponse.json({ error: 'name_required' }, { status: 400 });
    if (!categoryId) return NextResponse.json({ error: 'category_required' }, { status: 400 });

    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    if (!idToken) return NextResponse.json({ error: 'missing_auth' }, { status: 401 });

    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // Check business exists
    const businessRef = firestoreDb.collection('businesses').doc(businessId);
    const businessSnap = await businessRef.get();
    if (!businessSnap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const business = businessSnap.data();

    // Authorization: owner or same business user
    if (business.ownerUid !== uid) {
      const userDoc = await firestoreDb.collection('users').doc(uid).get();
      const userData = userDoc.data() || {};
      if (userData.businessId !== businessId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const newRef = businessRef.collection('inventory').doc();
    const now = new Date().toISOString();
    const item = {
      name,
      sku: sku ?? '',
      quantity: typeof quantity === 'number' ? quantity : Number(quantity || 0),
      unitPrice: typeof unitPrice === 'number' ? unitPrice : undefined,
      unit: unit ?? '',
      categoryId: categoryId ?? null,
      reorderLevel: typeof reorderLevel === 'number' ? reorderLevel : undefined,
      enabled: typeof enabled === 'boolean' ? enabled : true,
      description: description ?? '',
      storageLocation: storageLocation ?? '',
      createdBy: uid,
      createdAt: now,
      updatedAt: now,
    };
    // Verify category exists
    if (item.categoryId) {
      const catSnap = await businessRef.collection('inventory-categories').doc(item.categoryId).get();
      if (!catSnap.exists) return NextResponse.json({ error: 'invalid_category' }, { status: 400 });
    }
    // Verify unit exists (optional)
    if (item.unit) {
      const unitSnap = await businessRef.collection('inventory-units').where('name', '==', item.unit).limit(1).get();
      if (unitSnap.empty) return NextResponse.json({ error: 'invalid_unit' }, { status: 400 });
    }
    await newRef.set(item);
    // If opening quantity provided, create an initial IN movement to seed stock
    if ((typeof item.quantity === 'number' && item.quantity > 0) || (Number(quantity || 0) > 0)) {
      try {
        const movementRef = businessRef.collection('inventory-movements').doc();
        const movement = { type: 'IN', itemId: newRef.id, quantity: item.quantity || Number(quantity || 0), unit: item.unit || '', supplierId: null, costPerUnit: typeof item.unitPrice === 'number' ? item.unitPrice : null, batchNo: null, expiryDate: null, reason: 'Opening stock', createdBy: uid, createdAt: now };
        await movementRef.set(movement);
      } catch (e) {
        console.error('Failed to create opening stock movement', e);
      }
    }
    return NextResponse.json({ ok: true, id: newRef.id, item }, { status: 201 });
  } catch (err: any) {
    console.error('Create inventory failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const { id: itemId, name, sku, quantity, unit, categoryId, reorderLevel, description, storageLocation, unitPrice, enabled } = body || {};
    if (!itemId || !name) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    if (!idToken) return NextResponse.json({ error: 'missing_auth' }, { status: 401 });
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const businessRef = firestoreDb.collection('businesses').doc(businessId);
    const businessSnap = await businessRef.get();
    if (!businessSnap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const business = businessSnap.data() as any;
    // Authorization: owner or same business user
    if (business.ownerUid !== uid) {
      const userDoc = await firestoreDb.collection('users').doc(uid).get();
      const userData = userDoc.data() || {};
      if (userData.businessId !== businessId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const itemRef = businessRef.collection('inventory').doc(itemId);
    const itemSnap = await itemRef.get();
    if (!itemSnap.exists) return NextResponse.json({ error: 'item_not_found' }, { status: 404 });
    // Prevent deletion if this item has stock movements
    const movementsUsing = await businessRef.collection('inventory-movements').where('itemId', '==', itemId).limit(1).get();
    if (!movementsUsing.empty) return NextResponse.json({ error: 'item_in_use', message: 'Item has associated stock movements and cannot be deleted' }, { status: 400 });
    const now = new Date().toISOString();
    await itemRef.update({ name, sku: sku ?? '', quantity: typeof quantity === 'number' ? quantity : Number(quantity ?? 0), unit: unit ?? '', categoryId: categoryId ?? null, reorderLevel: typeof reorderLevel === 'number' ? reorderLevel : undefined, description: description ?? '', storageLocation: storageLocation ?? '', unitPrice: typeof unitPrice === 'number' ? unitPrice : undefined, enabled: typeof enabled === 'boolean' ? enabled : true, updatedAt: now });
    return NextResponse.json({ ok: true, item: { id: itemId, name, sku, quantity, unit, categoryId, reorderLevel, description, storageLocation, unitPrice, enabled } }, { status: 200 });
  } catch (err: any) {
    console.error('Update inventory failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const { id: itemId } = body || {};
    if (!itemId) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

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

    const itemRef = businessRef.collection('inventory').doc(itemId);
    const itemSnap = await itemRef.get();
    if (!itemSnap.exists) return NextResponse.json({ error: 'item_not_found' }, { status: 404 });
    await itemRef.delete();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error('Delete inventory failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

