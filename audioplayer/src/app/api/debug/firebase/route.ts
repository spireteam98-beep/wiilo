import { firebaseAdmin, firebaseAuth, firestoreDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

// DEV helper route to confirm admin initialization; DO NOT expose secrets.
export async function GET(_req: Request) {
  try {
    const initialized = !!(firebaseAdmin && firebaseAuth && firestoreDb);
    const info = {
      initialized,
      projectId: (firebaseAdmin?.options?.projectId || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ?? null,
    };
    return NextResponse.json({ ok: true, info }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: String(err?.message ?? err) }, { status: 500 });
  }
}
