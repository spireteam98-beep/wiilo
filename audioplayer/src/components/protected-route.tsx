'use client';

import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireCompleteProfile?: boolean;
}

/**
 * ProtectedRoute component ensures that only authenticated users can access the page.
 * Optionally requires that user has completed their profile.
 * - Unauthenticated users are redirected to /login
 * - Users without complete profile are redirected to /signup (if requireCompleteProfile is true)
 */
export function ProtectedRoute({ children, requireCompleteProfile = true }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, userProfile, isUserProfileLoading, initialized, refreshUserProfile } = useFirebaseAuth();
  const [profileChecked, setProfileChecked] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    // Wait for the auth system to be initialized
    if (!initialized) return;

    // If we've finished loading and there's no user, send to login
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    const runProfileChecks = async () => {
      if (!user || !requireCompleteProfile) {
        setProfileChecked(true);
        setProfileComplete(true);
        return;
      }

      // If the auth provider is currently fetching the profile, wait
      if (isUserProfileLoading) {
        setProfileChecked(false);
        return;
      }

      // If we already have a profile from the auth context, use it
      if (userProfile) {
        // Consider profile complete if it has first + last name.
        // royalPayId is optional and not required to access protected pages by default.
        const isComplete = !!(userProfile?.firstName && userProfile?.lastName);
        setProfileComplete(isComplete);
        setProfileChecked(true);
        if (!isComplete) {
          router.push('/signup');
        }
        return;
      }

      // No profile in context and not loading — attempt a refresh once before redirecting
      try {
        await refreshUserProfile();
      } catch (err) {
        console.error('Error refreshing profile:', err);
      }

      // After refresh, check context again
      if (userProfile) {
        const isComplete = !!(userProfile?.firstName && userProfile?.lastName);
        setProfileComplete(isComplete);
        setProfileChecked(true);
        if (!isComplete) {
          router.push('/signup');
        }
      } else {
        // Still no profile — redirect to signup
        setProfileChecked(true);
        router.push('/signup');
      }
    };

    runProfileChecks();
  }, [initialized, user, loading, userProfile, isUserProfileLoading, router, requireCompleteProfile, refreshUserProfile]);

  // Show loading state while checking authentication
  if (loading || !profileChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children until we're sure user is authenticated and profile is complete
  if (!user || (requireCompleteProfile && !profileComplete)) {
    return null; // Will be redirected by useEffect
  }

  return <>{children}</>;
}
