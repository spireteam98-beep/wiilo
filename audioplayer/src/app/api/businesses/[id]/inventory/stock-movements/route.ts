import { firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

// GET: list stock movements
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

    const snap = await businessRef.collection('inventory-movements').orderBy('createdAt', 'desc').limit(200).get();
    const movements = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
    return NextResponse.json({ ok: true, movements }, { status: 200 });
  } catch (err: any) {
    console.error('List stock movements failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}

// POST: create a stock movement (IN/OUT/ADJUST) and update inventory quantities accordingly
export async function POST(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const {
      type,
      itemId,
      quantity,
      unit,
      supplierId,
      costPerUnit,
      batchNo,
      expiryDate,
      reason,
      transferTo,
    } = body || {};
    if (!type || !itemId || typeof quantity !== 'number') return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    if (quantity <= 0 && type !== 'ADJUST') return NextResponse.json({ error: 'quantity_must_be_positive' }, { status: 400 });
    if (type === 'ADJUST' && typeof quantity !== 'number') return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    if (!idToken) return NextResponse.json({ error: 'missing_auth' }, { status: 401 });
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const businessRef = firestoreDb.collection('businesses').doc(businessId);
    const businessSnap = await businessRef.get();
    if (!businessSnap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const business = businessSnap.data() as any;
    // owner or same business user
    if (business.ownerUid !== uid) {
      const userDoc = await firestoreDb.collection('users').doc(uid).get();
      const userData = userDoc.data() || {};
      if (userData.businessId !== businessId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Get inventory item
    const itemRef = businessRef.collection('inventory').doc(itemId);
    const itemSnap = await itemRef.get();
    if (!itemSnap.exists) return NextResponse.json({ error: 'item_not_found' }, { status: 404 });
    const item = itemSnap.data() as any;

    // Validate supplier if provided
    if (supplierId) {
      const supSnap = await businessRef.collection('inventory-suppliers').doc(supplierId).get();
      if (!supSnap.exists) return NextResponse.json({ error: 'invalid_supplier' }, { status: 400 });
    }

    // Compute updated quantity
    let newQuantity = (typeof item.quantity === 'number' ? item.quantity : Number(item.quantity || 0));
    if (type === 'IN') {
      newQuantity += quantity;
    } else if (type === 'OUT') {
      newQuantity -= quantity;
      if (newQuantity < 0) newQuantity = 0; // avoid negative stock for simplicity
    } else if (type === 'ADJUST') {
      newQuantity = quantity;
    } else if (type === 'TRANSFER') {
      if (!transferTo) return NextResponse.json({ error: 'missing_transfer_target' }, { status: 400 });
      // transfer behaves like an OUT on this business's stock
      newQuantity -= quantity;
      if (newQuantity < 0) newQuantity = 0;
    }

    const now = new Date().toISOString();

    // Create movement record
    const movementRef = businessRef.collection('inventory-movements').doc();
    const movement: any = { type, itemId, quantity, unit: unit ?? item.unit ?? '', supplierId: supplierId ?? null, costPerUnit: costPerUnit ?? null, batchNo: batchNo ?? null, expiryDate: expiryDate ?? null, reason: reason ?? '', createdBy: uid, createdAt: now };
    if (type === 'TRANSFER') movement.transferTo = transferTo;
    await movementRef.set(movement);

    // Update item quantity and updatedAt
    await itemRef.update({ quantity: newQuantity, updatedAt: now });

    // If batch provided, create a batch record for incoming stock
    if (type === 'IN' && batchNo) {
      const batchRef = businessRef.collection('inventory-batches').doc();
      await batchRef.set({ itemId, batchNo, quantity, expiryDate: expiryDate ?? null, supplierId: supplierId ?? null, createdAt: now, createdBy: uid });
    }

    return NextResponse.json({ ok: true, movement: { id: movementRef.id, ...movement }, newQuantity }, { status: 201 });
  } catch (err: any) {
    console.error('Create stock movement failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}
