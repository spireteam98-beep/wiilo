import { firebaseAuth, firestoreDb } from '@/lib/firebase-admin';

export async function isAdminUid(uid?: string | null) {
  if (!uid) return false;
  try {
    if (firebaseAuth) {
      const user = await firebaseAuth.getUser(uid);
      if (user && (user.customClaims as any)?.admin) return true;
    }
  } catch (err) {
    // ignore; we'll fallback to admins collection
  }
  try {
    if (!firestoreDb) return false;
    const doc = await firestoreDb.collection('admins').doc(uid).get();
    return doc.exists;
  } catch (err) {
    return false;
  }
}

export async function verifyAdminFromRequest(req: Request) {
  // Either x-admin-secret OR verified token uid with admin claim or admins doc
  const secret = req.headers.get('x-admin-secret');
  if (process.env.NODE_ENV === 'development' && secret === process.env.ADMIN_SECRET) {
    return { ok: true, reason: 'dev_secret' };
  }
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { ok: false };
  try {
    if (!firebaseAuth) return { ok: false };
    const decoded = await firebaseAuth.verifyIdToken(token);
    if (!decoded?.uid) return { ok: false };
    const isAdmin = await isAdminUid(decoded.uid);
    return { ok: isAdmin, uid: decoded.uid };
  } catch (err) {
    console.error('Failed to verify admin token', err);
    return { ok: false };
  }
}

export default { isAdminUid, verifyAdminFromRequest };
