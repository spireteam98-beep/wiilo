import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Initialize Firebase Admin SDK
let firebaseAdmin: any = null;
let firestoreDb: any = null;
let firebaseAuth: any = null;
let adminInitError: Error | null = null;

try {
  // Check if already initialized
  if (getApps().length === 0) {
    // Get credentials from environment variables
    let serviceAccountKey: any = null;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        if (!serviceAccountKey?.project_id) {
          console.error('FIREBASE_SERVICE_ACCOUNT_KEY parsed but missing project_id. Please ensure your service account JSON includes project_id.');
        }
      } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it is valid JSON.');
      }
    }

    let hasServiceAccount = !!(serviceAccountKey && typeof serviceAccountKey.project_id === 'string');
    let hasGoogleAppCredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    // If GOOGLE_APPLICATION_CREDENTIALS is set but looks like a relative path or file path
    // and the file does not exist in the runtime environment (common on serverless),
    // surface a clear adminInitError so we don't crash with an opaque ENOENT later.
    try {
      const gaVal = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (gaVal && !gaVal.trim().startsWith('{')) {
        // Treat as a path; check existence
        if (!fs.existsSync(gaVal)) {
          const msg = `GOOGLE_APPLICATION_CREDENTIALS is set to a file path that does not exist in the runtime: ${gaVal}. In serverless environments (Vercel) you should instead set FIREBASE_SERVICE_ACCOUNT_KEY to the JSON string.`;
          console.error('[firebase-admin] Invalid GOOGLE_APPLICATION_CREDENTIALS path:', gaVal);
          adminInitError = new Error(msg);
          // Prevent further attempts to initialize using this invalid path
          hasGoogleAppCredentials = false;
        }
      }
    } catch (err) {
      // ignore and proceed; we'll catch initialization failures later
    }

    // If GOOGLE_APPLICATION_CREDENTIALS contains a JSON string (instead of a path), write it to a temp file
    // so SDKs and libraries that expect a file path can still work. This is useful when only envs are available.
    try {
      const ga = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (ga && ga.trim().startsWith('{')) {
        const tmpPath = path.join(os.tmpdir(), `google-application-creds-${Date.now()}.json`);
        fs.writeFileSync(tmpPath, ga, { encoding: 'utf8' });
        process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
        hasGoogleAppCredentials = true;
        console.log('[firebase-admin] Wrote GOOGLE_APPLICATION_CREDENTIALS JSON to temp file:', tmpPath);
      }
    } catch (err) {
      // ignore write errors; we'll fall back to other methods or surface a helpful adminInitError
      console.warn('[firebase-admin] Failed to write GOOGLE_APPLICATION_CREDENTIALS JSON to temp file:', err);
    }

    // If no env vars were set, attempt to auto-detect a local service account JSON at workspace root (dev convenience)
    if (!hasServiceAccount && !hasGoogleAppCredentials && process.env.NODE_ENV !== 'production') {
      try {
        const files = fs.readdirSync(process.cwd());
        const candidate = files.find(f => /-firebase-adminsdk-.*\.json$/.test(f));
        if (candidate) {
          const filePath = path.join(process.cwd(), candidate);
          const raw = fs.readFileSync(filePath, 'utf8');
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.project_id) {
              serviceAccountKey = parsed;
              console.log('[firebase-admin] Detected local service account file for dev:', filePath);
            } else {
              console.warn('[firebase-admin] Found JSON file but missing project_id:', filePath);
            }
          } catch (parseErr) {
            console.warn('[firebase-admin] Failed to parse detected service account JSON:', filePath, parseErr);
          }
        }
      } catch (err) {
        // ignore read errors; we'll throw a clear error later if needed
      }
      // Recompute hasServiceAccount as we might have set it from the dev auto-detect
      hasServiceAccount = !!(serviceAccountKey && typeof serviceAccountKey.project_id === 'string');
    }

    if (hasServiceAccount) {
      // If we have a serviceAccountKey available but no GOOGLE_APPLICATION_CREDENTIALS,
      // write a temporary file with its contents and set the env var. This helps libraries
      // that expect a file path in environments such as serverless functions where
      // only env vars are available.
      try {
        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
          const tmpPath = path.join(os.tmpdir(), `google-application-creds-${Date.now()}.json`);
          fs.writeFileSync(tmpPath, JSON.stringify(serviceAccountKey), { encoding: 'utf8' });
          process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
          hasGoogleAppCredentials = true;
          console.log('[firebase-admin] Wrote FIREBASE_SERVICE_ACCOUNT_KEY to temp GOOGLE_APPLICATION_CREDENTIALS file:', tmpPath);
        }
      } catch (err) {
        console.warn('[firebase-admin] Failed to write service account JSON to tmp file:', err);
      }
      // Normalize private_key if necessary
      // If the private_key contains escaped newlines (e.g., "\\n"), convert them into real newlines
      if (serviceAccountKey && typeof serviceAccountKey.private_key === 'string' && serviceAccountKey.private_key.indexOf('\\n') !== -1) {
        serviceAccountKey.private_key = serviceAccountKey.private_key.replace(/\\n/g, '\n');
      }
      firebaseAdmin = initializeApp({
        credential: cert(serviceAccountKey),
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.log('[firebase-admin] Initialized with FIREBASE_SERVICE_ACCOUNT_KEY:', { projectId: serviceAccountKey.project_id });
    } else if (hasGoogleAppCredentials) {
      // If using GOOGLE_APPLICATION_CREDENTIALS, rely on the application default
      firebaseAdmin = initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.log('[firebase-admin] Initialized with GOOGLE_APPLICATION_CREDENTIALS', { projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
      if (!process.env.FIREBASE_PROJECT_ID && !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        console.warn('Using GOOGLE_APPLICATION_CREDENTIALS but FIREBASE_PROJECT_ID not set. Consider setting FIREBASE_PROJECT_ID in .env.local for clarity.');
      }
    } else if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_PROJECT_ID) {
      // In production we expect environment set via GCP metadata or env vars
      firebaseAdmin = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      // Not enough credentials provided; don't throw during module import
      // because Next.js may import modules during build-time and we don't want the build to crash. 
      // Instead, capture the error and log it; consumers should check for `firestoreDb`/`firebaseAuth`.
      const required = `Set FIREBASE_SERVICE_ACCOUNT_KEY (JSON) or GOOGLE_APPLICATION_CREDENTIALS (path) and FIREBASE_PROJECT_ID. Also ensure the service account JSON contains a project_id and private_key.`;
      adminInitError = new Error(`Firebase Admin credentials not found. ${required}`);
      console.error('[firebase-admin] Initialization skipped, missing credentials:', adminInitError.message);
    }
    // Log for easier debugging (no secrets): which envs are present
    console.log('[firebase-admin] ENV_PRESENT: hasServiceAccount=', hasServiceAccount, ', hasGoogleAppCredentials=', hasGoogleAppCredentials, ', FIREBASE_PROJECT_ID=', !!process.env.FIREBASE_PROJECT_ID);
  } else {
    firebaseAdmin = getApp();
    console.log('[firebase-admin] Using existing initialized app');
  }

  firestoreDb = getFirestore();
  firebaseAuth = getAuth();
  console.log('[firebase-admin] firestoreDb and firebaseAuth are ready');
} catch (error) {
  adminInitError = error as Error;
  console.error('Failed to initialize Firebase Admin SDK:', adminInitError.message);
}

export { adminInitError, firebaseAdmin, firebaseAuth, firestoreDb };

