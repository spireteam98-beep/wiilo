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

    const itemsSnap = await businessRef.collection('inventory').get();
    const items = itemsSnap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
    const low = items.filter(it => typeof it.reorderLevel === 'number' && (it.quantity ?? 0) <= it.reorderLevel);
    const suggestions = low.map(it => {
      const desired = (it.reorderLevel || 0) * 2; // suggest to double reorder level
      const needed = Math.max(0, desired - (it.quantity || 0));
      return { id: it.id, name: it.name, sku: it.sku, currentQty: it.quantity || 0, reorderLevel: it.reorderLevel, suggestedQty: needed };
    });
    return NextResponse.json({ ok: true, suggestions, count: suggestions.length }, { status: 200 });
  } catch (err: any) {
    console.error('Reorder suggestions failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}
