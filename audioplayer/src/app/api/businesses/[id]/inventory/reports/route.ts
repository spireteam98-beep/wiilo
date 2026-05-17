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

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'stock';
    const categoryIdFilter = url.searchParams.get('categoryId') || null;
    const unitFilter = url.searchParams.get('unit') || null;
    const groupBy = url.searchParams.get('group') || null;

    // Basic stock report
    if (type === 'stock') {
      const itemsSnap = await businessRef.collection('inventory').get();
      const items = itemsSnap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));

      // Compute average cost using IN movements per item
      const movementsSnap = await businessRef.collection('inventory-movements').where('type', '==', 'IN').get();
      const movements = movementsSnap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
      const costMap: Record<string, { totalCost: number; totalQty: number }> = {};
      movements.forEach(m => {
        if (!m.itemId) return;
        const c = costMap[m.itemId] || { totalCost: 0, totalQty: 0 };
        if (typeof m.costPerUnit === 'number') {
          c.totalCost += (m.costPerUnit * (m.quantity || 0));
          c.totalQty += (m.quantity || 0);
        }
        costMap[m.itemId] = c;
      });

      let filteredItems = items;
      if (categoryIdFilter) filteredItems = filteredItems.filter(it => it.categoryId === categoryIdFilter);
      if (unitFilter) filteredItems = filteredItems.filter(it => it.unit === unitFilter);

      const rows = filteredItems.map(it => {
        const avg = costMap[it.id] && costMap[it.id].totalQty > 0 ? (costMap[it.id].totalCost / costMap[it.id].totalQty) : 0;
        return { id: it.id, name: it.name, sku: it.sku || '', quantity: it.quantity || 0, avgCost: avg, stockValue: (it.quantity || 0) * avg, categoryId: it.categoryId || null };
      });
      const totalValue = rows.reduce((s, r) => s + (r.stockValue || 0), 0);
      if (groupBy === 'category') {
        // group rows by categoryId
        const map: Record<string, any> = {};
        rows.forEach(r => {
          const k = r.categoryId || 'uncategorized';
          if (!map[k]) map[k] = { categoryId: r.categoryId, items: [], totalValue: 0 }; 
          map[k].items.push(r);
          map[k].totalValue += (r.stockValue || 0);
        });
        const grouped = Object.values(map);
        return NextResponse.json({ ok: true, grouped, totalValue }, { status: 200 });
      }
      return NextResponse.json({ ok: true, rows, totalValue }, { status: 200 });
    }

    // Movements report (IN/OUT) or other quick reports
    if (type === 'movements' || type === 'stock-in' || type === 'stock-out' || type === 'consumption' || type === 'audit') {
      const q = businessRef.collection('inventory-movements').orderBy('createdAt', 'desc').limit(1000);
      const snap = await q.get();
      const movements = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
      let res = movements;
      if (type === 'stock-in') res = movements.filter(m => m.type === 'IN');
      if (type === 'stock-out' || type === 'consumption') res = movements.filter(m => m.type === 'OUT');
      return NextResponse.json({ ok: true, movements: res }, { status: 200 });
    }

    return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  } catch (err: any) {
    console.error('Reports failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}
