'use client';

import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';

const SignOutButton: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Signed Out',
        description: 'Successfully signed out.',
      });
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Sign Out Failed',
        description: (error as Error).message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-destructive hover:text-destructive-foreground hover:bg-destructive/90">
      <LogOut className="mr-2 h-4 w-4" /> Sign Out
    </Button>
  );
};

export default SignOutButton;
