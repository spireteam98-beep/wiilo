"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { ensureUserWalletProfile } from '@/lib/content-access';

const GoogleIcon = () => (
  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-.97 2.48-1.94 3.21v2.75h3.57c2.08-1.92 3.28-4.74 3.28-7.97z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await ensureUserWalletProfile(firestore, result.user.uid, result.user.email, {
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });
      toast({ title: "Welcome back", description: "Successfully signed in to wiillo." });
      router.push('/');
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          title: "Sign in failed",
          description: error.message || "Could not sign in. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
        <div className="hidden lg:flex flex-col justify-center h-full p-12 bg-primary rounded-[40px] text-white relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <span className="text-3xl font-black tracking-tighter text-white">wiillo</span>
            </div>
            <h2 className="text-5xl font-black tracking-tighter leading-none mb-6">Welcome back to your calm command center.</h2>
            <p className="text-white/80 text-lg leading-relaxed max-w-md">
              Sign in instantly with your Google account. No password required.
            </p>
          </div>
        </div>

        <Card className="p-10 lg:p-16 border-none shadow-wiillo bg-white/80 backdrop-blur-xl rounded-[40px]">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-2">Sign in</h1>
              <p className="text-muted text-sm">Access your workspace and dashboard.</p>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-14 text-base font-black bg-white text-black hover:bg-white/90 border border-border shadow rounded-2xl"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <GoogleIcon />}
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            <div className="pt-6 border-t border-border/50 text-center">
              <p className="text-sm text-muted">
                New to wiillo?{' '}
                <Link href="/signup" className="font-black text-primary hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
