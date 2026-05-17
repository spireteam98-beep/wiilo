import { firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

// Receive goods against a purchase order (GRN)
export async function POST(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;
    const body = await req.json();
    const { poId, items } = body || {};
    if (!poId || !Array.isArray(items) || items.length === 0) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

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

    const poRef = businessRef.collection('inventory-purchase-orders').doc(poId);
    const poSnap = await poRef.get();
    if (!poSnap.exists) return NextResponse.json({ error: 'po_not_found' }, { status: 404 });
    const po = poSnap.data() as any;

    // Validate items against PO
    const poItemsMap: Record<string, any> = {};
    (po.items || []).forEach((it: any) => poItemsMap[it.itemId] = it);
    const now = new Date().toISOString();
    const movementRefs: any[] = [];
    for (const it of items) {
      if (!it.itemId || typeof it.quantity !== 'number') return NextResponse.json({ error: 'invalid_items' }, { status: 400 });
      if (!poItemsMap[it.itemId]) return NextResponse.json({ error: 'po_missing_item' }, { status: 400 });

      // Create IN movement for each received item
      const itemRef = businessRef.collection('inventory').doc(it.itemId);
      const itemSnap = await itemRef.get();
      if (!itemSnap.exists) return NextResponse.json({ error: 'item_not_found' }, { status: 404 });
      const item = itemSnap.data() as any;
      const currentQty = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity || 0);
      const newQty = currentQty + it.quantity;
      // movement doc
      const movementRef = businessRef.collection('inventory-movements').doc();
      const movement = { type: 'IN', itemId: it.itemId, quantity: it.quantity, unit: item.unit || null, supplierId: po.supplierId || null, costPerUnit: it.unitPrice ?? null, batchNo: it.batchNo || null, expiryDate: it.expiryDate || null, reason: `GRN from PO ${poId}`, createdBy: uid, createdAt: now };
      await movementRef.set(movement);
      movementRefs.push({ id: movementRef.id, ...movement });

      // Update item quantity
      await itemRef.update({ quantity: newQty, updatedAt: now });

      // create batch if provided
      if (it.batchNo) {
        const batchRef = businessRef.collection('inventory-batches').doc();
        await batchRef.set({ itemId: it.itemId, batchNo: it.batchNo, quantity: it.quantity, expiryDate: it.expiryDate || null, supplierId: po.supplierId || null, createdAt: now, createdBy: uid });
      }
    }

    // Update PO's items received qty and status if all received
    const updatedItems = (po.items || []).map((it: any) => {
      const received = items.find((r: any) => r.itemId === it.itemId);
      const prevReceived = it.receivedQuantity || 0;
      if (received) return { ...it, receivedQuantity: prevReceived + (received.quantity || 0) };
      return it;
    });
    let newStatus = po.status;
    if (updatedItems.every((it: any) => (it.receivedQuantity || 0) >= (it.quantity || 0))) newStatus = 'RECEIVED';
    await poRef.update({ items: updatedItems, status: newStatus, updatedAt: now, updatedBy: uid });

    return NextResponse.json({ ok: true, movements: movementRefs, po: { id: poId, items: updatedItems, status: newStatus } }, { status: 200 });
  } catch (err: any) {
    console.error('GRN receive failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}
