// This file's content is now largely managed by src/lib/firebase.tsx
// For simplicity, we re-export the necessary items from there if this file structure is preferred.
// However, it's often cleaner to import directly from '@/lib/firebase.tsx' where needed.

'use client';

export { AuthProvider, useAuthContext as useAuth, signInWithGoogle, signOutUser } from '@/lib/firebase';
export type { User as FirebaseUser } from 'firebase/auth'; // Export User type if needed elsewhere
