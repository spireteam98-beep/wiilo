
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyEmailRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Verification is no longer required for this VOD platform
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="animate-pulse text-primary font-black tracking-widest uppercase">Redirecting to stream...</div>
    </div>
  );
}
