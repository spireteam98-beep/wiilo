'use client';

import PinVerificationModal from '@/components/pin-verification-modal';
import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { filterUserDataByScope, getScopeDescription } from '@/lib/oauth';
import { getRoyalPayId, getWalletId, verifyWalletPin } from '@/lib/pin-utils';
import { getUserProfile } from '@/lib/user';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function OAuthAuthorizePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useFirebaseAuth();

  // OAuth parameters
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const scope = searchParams.get('scope')?.split(' ') || ['profile', 'email'];
  const appName = searchParams.get('app_name') || 'Unknown App';
  const appIcon = searchParams.get('app_icon');

  // UI states
  const [showPinModal, setShowPinModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scopes, setScopes] = useState<string[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Validate OAuth request on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!clientId || !redirectUri || !state) {
        if (mounted) setError('Invalid OAuth request. Missing required parameters.');
        return;
      }

      // Validate redirect URI against registered client on the server
      try {
        const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri });
        const resp = await fetch(`/api/oauth/validate?${params.toString()}`);
        const data = await resp.json();
        if (!resp.ok) {
          const msg = data?.error_description || data?.error || 'Invalid redirect URI or client';
          if (mounted) setError(`OAuth validation error: ${msg}`);
          return;
        }
      } catch (err) {
        console.warn('Failed to validate oauth client params', err);
        // allow continuing; server may be down — but still set scopes so UI shows
      }

      if (mounted) setScopes(scope);
    })();

    return () => {
      mounted = false;
    };
  }, [clientId, redirectUri, state, scope]);

  const loadUserData = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      const walletId = await getWalletId(user.uid);
      const royalPayId = await getRoyalPayId(user.uid);
      setUserInfo({
        id: user.uid,
        name: profile?.displayName || user.displayName || 'User',
        email: user.email,
        profileImage: user.photoURL,
        walletId: walletId,
        royalPayId: royalPayId,
        country: profile?.country,
        verified: true,
      });
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Failed to load user profile');
    }
  }, [user]);

  // Load user data when authenticated
  useEffect(() => {
    if (user && !loading) {
      loadUserData();
    }
  }, [user, loading, loadUserData]);

  // Notify backend once when userInfo and OAuth params are ready.
  const notificationSent = useRef(false);
  useEffect(() => {
    if (!userInfo || !clientId || !redirectUri || notificationSent.current) return;
    notificationSent.current = true;
    (async () => {
      try {
        await fetch('/api/oauth/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            userId: userInfo.id,
            scope: scopes,
            redirectUri,
            appName,
            appIcon,
          }),
        });
      } catch (err) {
        console.warn('Failed to create oauth request notification', err);
      }
    })();
  }, [userInfo, clientId, redirectUri, scopes, appName, appIcon]);

  const redirected = useRef(false);
  useEffect(() => {
    if (!loading && !user && !redirected.current) {
      redirected.current = true;
      const params = new URLSearchParams({
        redirect: `/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`,
      });
      router.push(`/login?${params.toString()}`);
    }
  }, [loading, user, router, clientId, redirectUri, state]);

  // Show loading state
  if (loading || !userInfo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff9b2a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Handle PIN verification
  const handlePinVerify = async (pin: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Verify PIN
      const isValid = await verifyWalletPin(user.uid, pin);

      if (!isValid) {
        throw new Error('Invalid PIN');
      }

      // Generate authorization code and save to Firestore
      const response = await fetch('/api/oauth/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          userId: user.uid,
          scope: scopes,
          redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate authorization code');
      }

      const { code } = await response.json();

      // Filter user data by scope
      const filteredData = filterUserDataByScope(userInfo, scopes);

      // Encode the response
      const responseParams = new URLSearchParams({
        code: code,
        state: state || '',
        user_data: JSON.stringify(filteredData),
      });

      // Redirect back to app with authorization
      const finalRedirectUrl = `${redirectUri}?${responseParams.toString()}`;
      setShowPinModal(false);

      // Delay redirect to show success
      setTimeout(() => {
        window.location.href = finalRedirectUrl;
      }, 1000);
    } catch (err) {
      console.error('PIN verification failed:', err);
      setError(err instanceof Error ? err.message : 'PIN verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deny
  const handleDeny = () => {
    const errorParams = new URLSearchParams({
      error: 'access_denied',
      error_description: 'User denied authorization',
      state: state || '',
    });

    const redirectUrl = `${redirectUri}?${errorParams.toString()}`;
    window.location.href = redirectUrl;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Authorization Card */}
        <div
          className="rounded-[28px] bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] border border-white/10 p-6 shadow-2xl"
          style={{
            boxShadow: `
              0 70px 120px -20px rgba(249, 115, 22, 0.3),
              inset 0 2px 0 rgba(255,255,255,0.02)
            `,
          }}
        >
          {/* App Icon */}
          {appIcon && (
            <div className="flex justify-center mb-6">
              <img
                src={appIcon}
                alt={appName}
                className="w-16 h-16 rounded-full border-2 border-white/20"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Sign in to {appName}
          </h1>

          <p className="text-white/60 text-center text-sm mb-6">
            <span className="font-semibold text-white">{appName}</span> would like to access your RoyalPay account
          </p>

          {/* User Info */}
          <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
            <div className="flex items-center gap-3">
              {userInfo.profileImage && (
                <img
                  src={userInfo.profileImage}
                  alt={userInfo.name}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="text-white font-semibold">{userInfo.name}</p>
                <p className="text-white/60 text-sm">{userInfo.email}</p>
              </div>
            </div>
          </div>

          {/* Requested Permissions */}
          <div className="mb-6">
            <p className="text-white/60 text-xs font-semibold mb-3">THIS APP WILL HAVE ACCESS TO:</p>
            <div className="space-y-2">
              {scopes.map((s) => (
                <div key={s} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#ff9b2a] flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <p className="text-white/70 text-sm">{getScopeDescription(s)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Security Note */}
          <div className="bg-[#ff9b2a]/10 border border-[#ff9b2a]/20 rounded-lg p-3 mb-6">
            <p className="text-xs text-[#ff9b2a]">
              🔒 <span className="font-semibold">Secure:</span> RoyalPay will never share your PIN with this app. You'll confirm with your PIN each time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setShowPinModal(true)}
              className="w-full px-4 py-3 rounded-full bg-gradient-to-r from-[#ff9b2a] to-[#ff6816] text-white font-semibold transition-all hover:shadow-lg"
            >
              Continue with PIN
            </button>

            <button
              onClick={handleDeny}
              className="w-full px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition-all border border-white/10"
            >
              Cancel
            </button>
          </div>

          {/* Footer Info */}
          <p className="text-xs text-white/40 text-center mt-6">
            You're signing in using RoyalPay OAuth. Your data is protected and you remain in control.
          </p>
        </div>
      </div>

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinVerify}
        title="Confirm Authorization"
        description={`Enter your PIN to authorize ${appName}`}
      />
    </div>
  );
}
