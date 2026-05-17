// src/components/auth/SignInButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase'; // Directly use auth from firebase
import { signInWithPopup, GoogleAuthProvider, type AuthError } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react'; 
import { useState } from 'react'; // Import useState

// Define a specific Google Icon component if not already globally available
const GoogleIcon = () => (
  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-.97 2.48-1.94 3.21v2.75h3.57c2.08-1.92 3.28-4.74 3.28-7.97z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
    <path fill="none" d="M1 1h22v22H1z" />
  </svg>
);

const SignInButton: React.FC = () => {
  // const router = useRouter(); // Not directly used for redirection here, AuthProvider handles it
 const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Successful sign-in. AuthProvider's onAuthStateChanged will handle further logic.
      toast({
        title: 'Signed In Successfully',
        description: 'Processing your login...', // More generic message as AuthProvider handles next steps
      });
    } catch (error) {
      const authError = error as AuthError;
 console.error('Google Sign-In Error in SignInButton:', authError.code, authError.message);

      if (authError.code === 'auth/popup-closed-by-user' || authError.code === 'auth/cancelled-popup-request') {
 console.info('Sign-in popup was closed or cancelled by the user, or the flow was interrupted.');
        // Do NOT show a toast message for these specific errors
      } else {
 toast({
          title: 'Sign In Failed',
          description: authError.message || 'An unexpected error occurred during sign-in. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSigningIn(false); // Ensure button is re-enabled
    }
  };

  return (
    <Button onClick={handleSignIn} className="w-full" variant="outline" disabled={isSigningIn}>
      {isSigningIn ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <GoogleIcon />
      )}
      {isSigningIn ? 'Signing In...' : 'Sign In with Google'}
    </Button>
  );
};

export default SignInButton;
