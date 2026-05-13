import { firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

function parseCsv(csv: string) {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const obj: any = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = cols[j] || '';
    rows.push(obj);
  }
  return rows;
}

export async function POST(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (!firestoreDb || !firebaseAuth) return NextResponse.json({ error: 'server_init_error' }, { status: 500 });
    const resolved = await params as any;
    const businessId = resolved.id;

    // detect content-type
    const contentType = req.headers.get('content-type') || '';
    let items: any[] = [];
    if (contentType.includes('text/csv')) {
      const bodyText = await req.text();
      items = parseCsv(bodyText);
    } else {
      const body = await req.json().catch(() => null);
      items = (body && body.items) || [];
    }
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: 'no_items' }, { status: 400 });

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

    const batch = firestoreDb.batch();
    const now = new Date().toISOString();
    const created: string[] = [];
    const summary: any[] = [];
    for (const raw of items) {
      const name = raw.name || raw.Name || raw.NAME;
      if (!name) continue; // skip
      const sku = raw.sku || raw.SKU || '';
      const qty = typeof raw.quantity === 'number' ? raw.quantity : Number(raw.quantity || 0);
      const unit = raw.unit || raw.Unit || '';
      const categoryId = raw.categoryId || raw.category || raw.Category || null;
      const reorderLevel = typeof raw.reorderLevel === 'number' ? raw.reorderLevel : (raw.reorderLevel ? Number(raw.reorderLevel) : undefined);
      const unitPrice = typeof raw.unitPrice === 'number' ? raw.unitPrice : (raw.unitPrice ? Number(raw.unitPrice) : undefined);
      const enabled = raw.enabled === 'false' || raw.enabled === false ? false : true;
      const newRef = businessRef.collection('inventory').doc();
      const item = { name, sku, quantity: qty, unitPrice, unit: unit || '', categoryId: categoryId || null, reorderLevel, enabled, createdBy: uid, createdAt: now, updatedAt: now };
      const rowSummary: any = { name: item.name, sku: item.sku, quantity: item.quantity, unit: item.unit, categoryId: item.categoryId, errors: [] };
      // Validate category and unit are valid (if provided)
      if (item.categoryId) {
        const catSnap = await businessRef.collection('inventory-categories').doc(item.categoryId).get();
        if (!catSnap.exists) rowSummary.errors.push(`Category ${item.categoryId} not found`);
      }
      if (item.unit) {
        const unitSnap = await businessRef.collection('inventory-units').where('name', '==', item.unit).limit(1).get();
        if (unitSnap.empty) rowSummary.errors.push(`Unit ${item.unit} not found`);
      }
      summary.push(rowSummary);
      // if dryRun, skip commit
      const url = new URL(req.url);
      const dryRun = url.searchParams.get('dryRun') === 'true';
      if (dryRun) continue;
      batch.set(newRef, item);
      created.push(newRef.id);
      // If qty > 0, create IN movement
      if (qty > 0) {
        const movementRef = businessRef.collection('inventory-movements').doc();
        const movement = { type: 'IN', itemId: newRef.id, quantity: qty, unit: item.unit || '', supplierId: null, costPerUnit: typeof unitPrice === 'number' ? unitPrice : null, batchNo: null, expiryDate: null, reason: 'Opening stock (bulk import)', createdBy: uid, createdAt: now };
        batch.set(movementRef, movement);
      }
    }
    const url = new URL(req.url);
    const dryRun = url.searchParams.get('dryRun') === 'true';
    if (dryRun) {
      return NextResponse.json({ ok: true, dryRun: true, items: summary }, { status: 200 });
    }
    await batch.commit();
    return NextResponse.json({ ok: true, created }, { status: 201 });
  } catch (err: any) {
    console.error('Bulk import failed', err);
    return NextResponse.json({ error: 'server_error', message: String(err?.message ?? err) }, { status: 500 });
  }
}
