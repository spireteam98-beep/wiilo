'use client';

import { Button } from '@/components/ui/button';
import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const GoogleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle, initialized } = useFirebaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirected = useRef(false);

  // Redirect once if already authenticated (wait until auth is initialized)
  useEffect(() => {
    if (!initialized) return;
    if (user && !redirected.current) {
      redirected.current = true;
      router.push('/');
    }
  }, [initialized, user, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const u = await signInWithGoogle();
      // Ensure UI isn't left stuck in loading state — signInWithGoogle handles redirect via onAuthStateChanged;
      // however it's useful to set loading false if popup succeeded but redirect didn't complete.
      if (u) setIsLoading(false);
      // signInWithGoogle triggers auth state change, which will redirect via useEffect above
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
      setIsLoading(false);
    }
  };

  // Show loading state while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  // Redirect in progress
  if (initialized && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">RoyalPay</h1>
          <p className="text-muted-foreground text-lg">Your Personal Digital Wallet</p>
        </div>

        {/* Auth Card */}
        <div className="rounded-lg border border-border/20 bg-card/50 backdrop-blur-sm p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Welcome Back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in with your Gmail account to get started
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            size="lg"
            className="w-full h-12 gap-3 rounded-lg bg-white text-black hover:bg-gray-100 font-semibold"
          >
            <GoogleIcon />
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </Button>

          {/* Info Text */}
          <div className="space-y-3 pt-4 border-t border-border/20">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                <span className="text-white font-medium">Gmail Required:</span> You must have a valid Gmail account to sign up
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                <span className="text-white font-medium">Create Account:</span> New users will be automatically registered
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                <span className="text-white font-medium">Secure:</span> Your data is encrypted and stored securely
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
