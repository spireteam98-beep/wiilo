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

    // Low stock alerts: items with quantity <= reorderLevel
    const itemsSnap = await businessRef.collection('inventory').get();
    const items = itemsSnap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
    const lowStock = items.filter((it: any) => typeof it.reorderLevel === 'number' && (it.quantity ?? 0) <= it.reorderLevel);

    // Expiry alerts: batches with expiry within next 7 days
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const batchesSnap = await businessRef.collection('inventory-batches').where('expiryDate', '!=', null).get();
    const batches = batchesSnap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
    const expirySoon = batches.filter(b => { if (!b.expiryDate) return false; const ex = new Date(b.expiryDate); return ex <= in7; });

    return NextResponse.json({ ok: true, lowStock, expirySoon, counts: { items: items.length, batches: batches.length } }, { status: 200 });
  } catch (err: any) {
    console.error('List alerts failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}
