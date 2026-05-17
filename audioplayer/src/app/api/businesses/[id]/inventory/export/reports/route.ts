import { firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

function toCsv(rows: any[], headers: string[]) {
  const lines = [headers.join(',')];
  for (const r of rows) {
    const line = headers.map(h => {
      const v = (r[h] === undefined || r[h] === null) ? '' : String(r[h]);
      return `"${v.replace(/"/g, '""')}"`;
    }).join(',');
    lines.push(line);
  }
  return lines.join('\n');
}

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
    if (type === 'stock') {
      const itemsSnap = await businessRef.collection('inventory').get();
      const items = itemsSnap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
      const headers = ['id','name','sku','quantity','unit','categoryId','reorderLevel','unitPrice','enabled'];
      const csv = toCsv(items, headers);
      return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="report-stock.csv"' } });
    }

    if (type === 'movements' || type === 'stock-in' || type === 'stock-out') {
      let q = businessRef.collection('inventory-movements').orderBy('createdAt', 'desc').limit(1000);
      const snap = await q.get();
      const rows = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
      const headers = ['id','type','itemId','quantity','unit','supplierId','costPerUnit','batchNo','expiryDate','reason','createdAt','createdBy'];
      const csv = toCsv(rows, headers);
      return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="report-movements.csv"' } });
    }

    return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  } catch (err: any) {
    console.error('Export report failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}
