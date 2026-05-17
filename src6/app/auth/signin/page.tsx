'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const GoogleIcon = () => (
  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-.97 2.48-1.94 3.21v2.75h3.57c2.08-1.92 3.28-4.74 3.28-7.97z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function SignInPage() {
  const { user, signInWithGoogle, loading: authLoading, isUserProfileLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If user is logged in and profile is ready, go to home
    if (!authLoading && user && !isUserProfileLoading) {
      router.replace('/');
    }
  }, [user, authLoading, isUserProfileLoading, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: 'Welcome',
        description: 'Signing you in...',
      });
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          title: 'Sign In Failed',
          description: error.message || 'Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  // Loading state
  if (authLoading || (user && isUserProfileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground font-medium">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Back to Home Button - Very important for guest UX */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
        <ArrowLeft size={16} />
        Back to Articles
      </Link>

      <Card className="w-full max-w-sm shadow-2xl border-white/10 bg-card/50 backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black text-white tracking-tighter">
		  iCasti</CardTitle>
          <CardDescription className="text-balance">
            Please sign in to read the full article and manage your assets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleGoogleSignIn} 
            className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold transition-transform active:scale-95" 
            variant="default"
          >
            <GoogleIcon /> Sign In with Google
          </Button>
          
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Guest Access Available</span></div>
          </div>

          <Button 
            variant="link" 
            className="w-full text-xs text-muted-foreground" 
            asChild
          >
            <Link href="/">Continue as Guest (Preview Only)</Link>
          </Button>

          <p className="text-[10px] text-center text-muted-foreground/60 pt-4">
            By signing in, you agree to our Terms of Service.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}