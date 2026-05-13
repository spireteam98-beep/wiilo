import { firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Unwrap the dynamic business ID
    const { id: businessId } = await params;
    const body = await req.json();

    // 2. Initial Server Integrity Check
    if (!firebaseAuth || !firestoreDb) {
      return NextResponse.json(
        { error: 'server_init_error', message: 'Firebase Admin SDK not initialized.' },
        { status: 500 }
      );
    }

    // 3. Authenticate the User/Terminal
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/, '');
    if (!idToken) {
      return NextResponse.json({ error: 'unauthorized', message: 'No ID token provided.' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await firebaseAuth.verifyIdToken(idToken);
    } catch (e: any) {
      return NextResponse.json({ error: 'invalid_token', message: e.message }, { status: 401 });
    }

    // 4. Create a NEW Invoice Document
    // Path: businesses/[businessId]/invoices/[auto-generated-id]
    const invoiceRef = firestoreDb
      .collection('businesses')
      .doc(businessId)
      .collection('invoices')
      .doc();

    const invoiceData = {
      ...body,
      processedBy: decodedToken.uid,
      createdAt: new Date().toISOString(),
      // Add a native Firestore Timestamp for accurate reporting and sorting
      serverTimestamp: new Date(), 
    };

    // Save the invoice to the database
    await invoiceRef.set(invoiceData);

    // 5. Logic to reset Table Status to 'Available'
    // Since the frontend sends 'tableNo' (e.g., T-01), we query for that specific table
    if (body.tableId) {
      const tableQuery = await firestoreDb
        .collection('businesses')
        .doc(businessId)
        .collection('tables')
        .where('tableNo', '==', body.tableId)
        .limit(1)
        .get();

      if (!tableQuery.empty) {
        const tableDoc = tableQuery.docs[0];
        // Automatically reset the table status so it shows as green/ready in the POS dropdown
        await tableDoc.ref.update({ 
          status: 'Available',
          lastUpdated: new Date().toISOString()
        });
      }
    }

    // 6. Return success with the new Invoice ID
    return NextResponse.json({ 
      ok: true, 
      id: invoiceRef.id,
      message: 'Invoice created and table status reset successfully.' 
    }, { status: 201 });

  } catch (err: any) {
    console.error('CRITICAL ERROR: Invoice Transaction Failed', {
      message: err?.message,
      stack: err?.stack
    });
    
    return NextResponse.json(
      { error: 'server_error', message: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}