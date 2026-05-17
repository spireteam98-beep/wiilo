// app/providers.tsx
'use client';
import { AuthProvider } from '@/contexts/firebase-auth';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </FirebaseClientProvider>
  );
}
