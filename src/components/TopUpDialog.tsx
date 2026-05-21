"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Coins, ShieldCheck, X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { ensureUserWalletProfile } from '@/lib/content-access';

interface CoinPackage {
  id: string;
  amount: number;
  coins: number;
  label: string;
  price: string;
  bonus?: string;
}

const COIN_PACKAGES: CoinPackage[] = [
  { id: 'pack1', amount: 1,  coins: 100, label: 'Starter',  price: 'KES 1'  },
  { id: 'pack2', amount: 2,  coins: 220, label: 'Popular',  price: 'KES 2',  bonus: '+10% bonus coins' },
  { id: 'pack3', amount: 50, coins: 600, label: 'Premium',  price: 'KES 50', bonus: '+20% bonus coins' },
];

type PaymentMethod = 'paystack' | 'waafi' | 'stripe';

interface TopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string | null;
  userDisplayName?: string | null;
  userPhotoURL?: string | null;
  currentCoins?: number;
  onSuccess?: () => void;
  onCoinsUpdated?: (coins: number) => void;
}

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function StripeInlineCheckout({
  amount,
  userId,
  userEmail,
  userDisplayName,
  userPhotoURL,
  coins,
  packageName,
  backendUrl,
  onSuccess,
}: {
  amount: number;
  userId: string;
  userEmail: string;
  userDisplayName?: string | null;
  userPhotoURL?: string | null;
  coins: number;
  packageName: string;
  backendUrl: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const firestore = useFirestore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!userId) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in before buying coins.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      await ensureUserWalletProfile(firestore, userId, userEmail, {
        displayName: userDisplayName,
        photoURL: userPhotoURL,
        failSilently: false,
      });

      const intentRes = await fetch(`${backendUrl}/stripe/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          userId,
          email: userEmail,
          coins,
          packageName,
        }),
      });

      const intentData = await intentRes.json();
      if (!intentRes.ok || !intentData.clientSecret) {
        throw new Error(intentData.error || intentData.message || 'Failed to initialize card payment.');
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card form is not ready yet.');

      const result = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { email: userEmail },
        },
      });

      if (result.error) throw new Error(result.error.message || 'Card payment failed.');
      if (result.paymentIntent?.status !== 'succeeded') {
        throw new Error('Payment was not completed. Please try again.');
      }

      const verifyRes = await fetch(`${backendUrl}/stripe/verify/${result.paymentIntent.id}`, {
        method: 'POST',
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || 'Payment verification failed.');
      }

      toast({
        title: 'Payment successful',
        description: `${coins} coins have been added to your wallet.`,
      });
      onSuccess();
    } catch (err: any) {
      toast({
        title: 'Card payment failed',
        description: err.message || 'Unable to process card payment.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="p-4 bg-white/5 border border-white/20 rounded-2xl">
        <Label className="text-[10px] text-white/50 uppercase mb-2 block font-bold">Card Information</Label>
        <CardElement
          options={{
            disableLink: true,
            hidePostalCode: true,
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'system-ui, sans-serif',
                '::placeholder': { color: '#94a3b8' },
              },
              invalid: { color: '#ef4444' },
            },
          }}
        />
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 rounded-2xl bg-[#635bff] hover:bg-[#5851db] text-white font-bold"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <ShieldCheck className="h-4 w-4 mr-2" />
        )}
        {isProcessing ? 'Processing...' : `Pay KES ${amount.toLocaleString()} Now`}
      </Button>
    </form>
  );
}

export default function TopUpDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  userDisplayName,
  userPhotoURL,
  currentCoins = 0,
  onSuccess,
  onCoinsUpdated,
}: TopUpDialogProps) {
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('paystack');
  const [waafiPhone, setWaafiPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const backendUrl =
    process.env.NEXT_PUBLIC_PAYMENT_BACKEND_URL || 'https://backend-aroy.onrender.com';
  const waafiBackendUrl =
    process.env.NEXT_PUBLIC_WAAFI_BACKEND_URL || process.env.NEXT_PUBLIC_PAYMENT_BACKEND_URL || 'https://backend-aroy.onrender.com';

  const handlePaystackSuccess = () => {
    if (selectedPkg && onCoinsUpdated) {
      onCoinsUpdated(currentCoins + selectedPkg.coins);
    }
    if (onSuccess) {
      onSuccess();
    }
    onOpenChange(false);
  };

  const handlePaystack = async () => {
    if (!selectedPkg || !userEmail) return;
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/paystack/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          amount: selectedPkg.amount,
          metadata: {
            userId,
            coins: selectedPkg.coins,
            packageName: selectedPkg.label,
            userEmail,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || 'Payment init failed');
      const url = data.data?.authorization_url;
      if (!url) throw new Error('No authorization URL returned');
      window.open(url, '_blank');
      toast({ title: 'Redirecting to Paystack', description: 'Complete payment in the new tab.' });
      handlePaystackSuccess();
    } catch (err: any) {
      toast({ title: 'Payment Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleWaafiSuccess = () => {
    if (selectedPkg && onCoinsUpdated) {
      onCoinsUpdated(currentCoins + selectedPkg.coins);
    }
    if (onSuccess) {
      onSuccess();
    }
    onOpenChange(false);
  };

  const handleWaafi = async () => {
    if (!selectedPkg || !waafiPhone) return;
    setLoading(true);
    try {
      // Build exact Waafi schema payload
      const cleanPhoneNumber = waafiPhone.replace(/\D/g, '');
      const now = Math.floor(Date.now() / 1000);
      const requestId = `REQ${Date.now()}${Math.random().toString().slice(2, 10)}`;
      const referenceId = `REF${Date.now()}`;
      const invoiceId = `INV${Date.now()}`;

      const payload = {
        schemaVersion: '1.0',
        requestId,
        timestamp: String(now),
        channelName: 'WEB',
        serviceName: 'API_PURCHASE',
        serviceParams: {
          merchantUid: process.env.NEXT_PUBLIC_WAAFI_MERCHANT_UID || 'M0910161',
          apiUserId: process.env.NEXT_PUBLIC_WAAFI_API_USER_ID || '1000146',
          apiKey: process.env.NEXT_PUBLIC_WAAFI_API_KEY || 'API-1922135978AHX',
          paymentMethod: 'MWALLET_ACCOUNT',
          payerInfo: {
            accountNo: cleanPhoneNumber,
          },
          transactionInfo: {
            referenceId,
            invoiceId,
            amount: String(selectedPkg.amount),
            currency: 'USD',
            description: `Purchase of ${selectedPkg.coins} coins - ${selectedPkg.label}`,
          },
        },
        customMetadata: {
          userId,
          coins: selectedPkg.coins,
          packageName: selectedPkg.label,
          userEmail,
        },
      };

      const res = await fetch(`${waafiBackendUrl}/api/waafi/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Waafi initiation failed');
      toast({ title: 'Waafi Request Sent', description: 'Check your phone for the payment prompt.' });
      handleWaafiSuccess();
    } catch (err: any) {
      toast({ title: 'Payment Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (method === 'paystack') void handlePaystack();
    else if (method === 'waafi') void handleWaafi();
  };

  const canCheckout =
    !!selectedPkg &&
    !!userEmail &&
    (method !== 'waafi' || waafiPhone.trim().length >= 9);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0c0c0c] border border-white/10 rounded-[32px] p-0 max-w-md w-full overflow-hidden shadow-2xl">
        <DialogDescription className="sr-only">
          Choose a coin package and payment method to top up your wallet balance.
        </DialogDescription>
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-black text-white tracking-tight">
                Top Up Coins
              </DialogTitle>
              <p className="text-xs text-white/40 mt-1 font-medium">
                Balance: <span className="text-white font-black">{currentCoins} coins</span>
                &nbsp;·&nbsp;Each video costs <span className="text-primary font-black">10 coins</span>
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Coin Packages */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              Select Package
            </p>
            <RadioGroup
              value={selectedPkg?.id ?? ''}
              onValueChange={(val) => setSelectedPkg(COIN_PACKAGES.find(p => p.id === val) ?? null)}
              className="space-y-2"
            >
              {COIN_PACKAGES.map((pkg) => (
                <Label
                  key={pkg.id}
                  htmlFor={pkg.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer',
                    selectedPkg?.id === pkg.id
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={pkg.id} id={pkg.id} className="border-white/40 text-primary" />
                    <div>
                      <p className="text-sm font-black text-white">{pkg.coins.toLocaleString()} Coins</p>
                      {pkg.bonus && (
                        <p className="text-[10px] font-bold text-green-400 uppercase tracking-wide">
                          {pkg.bonus}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">{pkg.price}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wide">{pkg.label}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              Payment Method
            </p>
            <RadioGroup
              value={method}
              onValueChange={(val) => setMethod(val as PaymentMethod)}
              className="grid grid-cols-3 gap-2"
            >
              {(['paystack', 'stripe', 'waafi'] as PaymentMethod[]).map((m) => (
                <Label
                  key={m}
                  htmlFor={m}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all cursor-pointer text-center',
                    method === m
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  )}
                >
                  <RadioGroupItem value={m} id={m} className="sr-only" />
                  <span className="text-xs font-black text-white capitalize">
                    {m === 'stripe' ? 'Card' : m === 'waafi' ? 'Waafi' : 'Paystack'}
                  </span>
                  <span className="text-[9px] text-white/40 uppercase tracking-wide">
                    {m === 'stripe' ? 'Intl.' : m === 'waafi' ? 'Mobile' : 'Africa'}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Waafi phone input */}
          {method === 'waafi' && (
            <div className="space-y-1.5">
              <Label htmlFor="waafi-phone" className="text-xs text-white/60">
                Waafi Phone Number
              </Label>
              <Input
                id="waafi-phone"
                type="tel"
                value={waafiPhone}
                onChange={(e) => setWaafiPhone(e.target.value)}
                placeholder="e.g. 2526XXXXXXX"
                className="h-12 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-white/20"
              />
            </div>
          )}

          {method === 'stripe' && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Card Details
              </p>
              {!selectedPkg && (
                <p className="text-xs text-white/50 bg-white/5 rounded-xl p-3 border border-white/10">
                  Select a package to continue with card payment.
                </p>
              )}
              {!userEmail && selectedPkg && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-xl p-3">
                  A verified email is required for card payments.
                </p>
              )}
              {selectedPkg && userEmail && (
                stripePromise ? (
                  <Elements stripe={stripePromise}>
                    <StripeInlineCheckout
                      amount={selectedPkg.amount}
                      userId={userId}
                      userEmail={userEmail}
                      userDisplayName={userDisplayName}
                      userPhotoURL={userPhotoURL}
                      coins={selectedPkg.coins}
                      packageName={selectedPkg.label}
                      backendUrl={backendUrl}
                      onSuccess={() => {
                        if (onCoinsUpdated) {
                          onCoinsUpdated(currentCoins + selectedPkg.coins);
                        }
                        if (onSuccess) {
                          onSuccess();
                        }
                        onOpenChange(false);
                      }}
                    />
                  </Elements>
                ) : (
                  <p className="text-xs text-destructive bg-destructive/10 rounded-xl p-3">
                    Stripe key missing. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment.
                  </p>
                )
              )}
            </div>
          )}

          {/* Order summary + CTA */}
          {selectedPkg && (
            <div className="bg-black/40 rounded-2xl p-4 border border-white/10 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Package</span>
                <span className="text-white font-bold">{selectedPkg.label} – {selectedPkg.coins} coins</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-white/50 text-sm">Total</span>
                <span className="text-2xl font-black text-white">{selectedPkg.price}</span>
              </div>
            </div>
          )}

          {!userEmail && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-xl p-3">
              A verified email is required to process payments.
            </p>
          )}

          {method !== 'stripe' && (
            <Button
              onClick={handleCheckout}
              disabled={!canCheckout || loading}
              className="w-full h-14 rounded-2xl text-base font-black wiillo-grad border-none shadow-xl text-white"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Coins className="h-5 w-5 mr-2" />
              )}
              {loading
                ? 'Processing...'
                : selectedPkg
                ? `Buy ${selectedPkg.coins} Coins · ${selectedPkg.price}`
                : 'Select a package'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
