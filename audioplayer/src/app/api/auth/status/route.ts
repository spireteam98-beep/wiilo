import { adminInitError, firestoreDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/status?id={notificationId}
 * Returns notification status: { confirmed: boolean, status, notification }
 */
export async function GET(req: NextRequest) {
  try {
    if (!firestoreDb) {
      console.error('Admin SDK not initialized:', adminInitError?.message ?? 'missing credentials');
      return NextResponse.json({ error: 'server_init_error', message: adminInitError?.message ?? 'Admin SDK credentials missing' }, { status: 500 });
    }
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

    const doc = await firestoreDb.collection('user_notifications').doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const data = doc.data();
    const confirmed = data?.status === 'confirmed' || data?.status === 'approved';
    return NextResponse.json({ confirmed, status: data?.status || 'unknown', notification: data || null }, { status: 200 });
  } catch (err) {
    console.error('Error in /api/auth/status:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
