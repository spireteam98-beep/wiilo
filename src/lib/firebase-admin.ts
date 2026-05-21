
import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';
import fs from 'node:fs';

export const hasExplicitFirebaseAdminCredentials = () =>
  Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE ||
      (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS
  );

if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const serviceAccountFile = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE;
    const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
      });
      console.log('[FirebaseAdmin] Initialized with FIREBASE_SERVICE_ACCOUNT_KEY');
    } else if (serviceAccountFile && fs.existsSync(serviceAccountFile)) {
      const raw = fs.readFileSync(serviceAccountFile, "utf8");
      const serviceAccount = JSON.parse(raw);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
      console.log('[FirebaseAdmin] Initialized with FIREBASE_SERVICE_ACCOUNT_KEY_FILE');
    } else if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      console.log('[FirebaseAdmin] Initialized with split env credentials');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.NODE_ENV === "production") {
      // Last fallback: Application Default Credentials
      admin.initializeApp({ projectId });
      console.log('[FirebaseAdmin] Initialized with default credentials');
    } else {
      console.warn(
        '[FirebaseAdmin] Skipped initialization: local Firebase Admin credentials are not configured.'
      );
    }
  } catch (error: any) {
    console.error('[FirebaseAdmin] Initialization error:', error.message);
  }
}

// Helper to get Auth safely
export const getAdminAuth = () => {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin SDK not initialized correctly. Check environment variables.');
  }
  return admin.auth();
};

// Helper to get Firestore safely
export const getAdminDb = () => {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin SDK not initialized correctly. Check environment variables.');
  }
  return admin.firestore();
};
