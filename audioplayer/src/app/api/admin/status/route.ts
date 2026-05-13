import { adminInitError, firebaseAdmin, firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const initialized = !!(firebaseAdmin && firestoreDb && firebaseAuth);
    return NextResponse.json({ ok: true, initialized, error: adminInitError?.message ?? null }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}
