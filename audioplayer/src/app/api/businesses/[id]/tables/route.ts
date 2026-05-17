import { firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

// GET: List all tables for a specific business
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: businessId } = await params;
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    
    if (!idToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    await firebaseAuth.verifyIdToken(idToken);

    const snapshot = await firestoreDb
      .collection('businesses')
      .doc(businessId)
      .collection('tables')
      .get();

    const tables = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ ok: true, tables });
  } catch (err) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

// POST: Create a new table
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: businessId } = await params;
    const body = await req.json();
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    
    await firebaseAuth.verifyIdToken(idToken);

    const newTableRef = firestoreDb
      .collection('businesses')
      .doc(businessId)
      .collection('tables')
      .doc();

    const tableData = {
      ...body,
      createdAt: new Date().toISOString(),
    };

    await newTableRef.set(tableData);
    return NextResponse.json({ ok: true, table: { id: newTableRef.id, ...tableData } });
  } catch (err) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}