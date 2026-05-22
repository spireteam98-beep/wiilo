"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CreditCard, Landmark, Loader2, Coins, ShieldCheck, Smartphone } from 'lucide-react';
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
  { id: 'pack1', amount: 1, coins: 100, label: 'Starter', price: '$1' },
  { id: 'pack2', amount: 2, coins: 220, label: 'Popular', price: '$2', bonus: '+10% bonus coins' },
  { id: 'pack3', amount: 5, coins: 600, label: 'Premium', price: '$5', bonus: '+20% bonus coins' },
];

type PaymentMethod = 'paystack' | 'waafi' | 'stripe';

const usdToKesRate = Number(process.env.NEXT_PUBLIC_USD_TO_KES_RATE) || 130;

const formatUsd = (amount: number) => `$${amount.toLocaleString()}`;
const formatKes = (amount: number) => `KES ${amount.toLocaleString()}`;
const getMpesaAmount = (pkg: CoinPackage) => Math.round(pkg.amount * usdToKesRate);
const getPackagePrice = (pkg: CoinPackage, method: PaymentMethod) =>
  method === 'paystack' ? formatKes(getMpesaAmount(pkg)) : formatUsd(pkg.amount);

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

      if (result.error) throw new Error(result.error.message || 'Mastercard/VISA payment failed.');
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
        title: 'Mastercard/VISA payment failed',
        description: err.message || 'Unable to process Mastercard/VISA payment.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="border border-[#d7d2cc] bg-[#fbfaf8] p-4">
        <Label className="mb-2 block font-['Logic_Monospace',monospace] text-[10px] font-bold uppercase tracking-[0.18em] text-[#6e6259]">
          Mastercard/VISA Information
        </Label>
        <CardElement
          options={{
            disableLink: true,
            hidePostalCode: true,
            style: {
              base: {
                fontSize: '16px',
                color: '#111111',
                fontFamily: 'Georgia, serif',
                '::placeholder': { color: '#8a8179' },
              },
              invalid: { color: '#c90000' },
            },
          }}
        />
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="h-12 w-full rounded-none border border-[#111] bg-[#111] font-['Logic_Monospace',monospace] text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#c90000]"
      >
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="mr-2 h-4 w-4" />
        )}
        {isProcessing ? 'Processing...' : `Pay ${formatUsd(amount)} Now`}
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
      const mpesaAmount = getMpesaAmount(selectedPkg);
      const res = await fetch(`${backendUrl}/paystack/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          amount: mpesaAmount,
          metadata: {
            userId,
            coins: selectedPkg.coins,
            packageName: selectedPkg.label,
            userEmail,
            usdAmount: selectedPkg.amount,
            kesAmount: mpesaAmount,
            currency: 'KES',
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || 'Payment init failed');
      const url = data.data?.authorization_url;
      if (!url) throw new Error('No authorization URL returned');
      window.open(url, '_blank');
      toast({ title: 'Redirecting to M-Pesa', description: 'Complete payment in the new tab.' });
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
      if (!res.ok) throw new Error(data.message || 'Mobile money initiation failed');
      toast({ title: 'Mobile Money Request Sent', description: 'Check your phone for the payment prompt.' });
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
  const paymentLocked = !selectedPkg;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[440px] overflow-hidden rounded-none border border-[#111] bg-[#f8f5f0] p-0 text-[#111] shadow-[0_20px_70px_rgba(17,17,17,0.24)] sm:w-full">
        <DialogDescription className="sr-only">
          Choose a coin package and payment method to top up your wallet balance.
        </DialogDescription>

        <div className="px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
          <div className="border-b-4 border-[#111] pb-3 pr-8">
            <p className="font-['Logic_Monospace',monospace] text-[9px] font-bold uppercase tracking-[0.2em] text-[#c90000]">
              Wiillo Wallet
            </p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <DialogTitle className="font-['Atlantic_Serif',Georgia,serif] text-4xl font-semibold leading-none tracking-normal">
                Top Up
              </DialogTitle>
              <div className="text-right">
                <p className="font-['Logic_Monospace',monospace] text-[9px] font-bold uppercase tracking-[0.16em] text-[#6e6259]">
                  Balance
                </p>
                <p className="font-['Atlantic_Serif',Georgia,serif] text-3xl font-semibold leading-none text-[#c90000]">
                  {currentCoins.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <section className="space-y-2">
              <p className="font-['Logic_Monospace',monospace] text-[9px] font-bold uppercase tracking-[0.2em] text-[#6e6259]">
                Coin Package
              </p>
              <RadioGroup
                value={selectedPkg?.id ?? ''}
                onValueChange={(val) => setSelectedPkg(COIN_PACKAGES.find(p => p.id === val) ?? null)}
                className="divide-y divide-[#d7d2cc] border-y border-[#111]"
              >
                {COIN_PACKAGES.map((pkg) => (
                  <Label
                    key={pkg.id}
                    htmlFor={pkg.id}
                    className={cn(
                      'grid min-h-[3.9rem] cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 px-1.5 py-2.5 transition-colors',
                      selectedPkg?.id === pkg.id ? 'bg-[#c90000] text-white' : 'hover:bg-white/70'
                    )}
                  >
                    <RadioGroupItem
                      value={pkg.id}
                      id={pkg.id}
                      className={cn(
                        'focus:ring-[#c90000]',
                        selectedPkg?.id === pkg.id ? 'border-white text-white' : 'border-[#111] text-[#c90000]'
                      )}
                    />
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className={cn(
                          "font-['Atlantic_Serif',Georgia,serif] text-2xl font-semibold leading-none",
                          selectedPkg?.id === pkg.id ? 'text-white' : 'text-[#111]'
                        )}>
                          {pkg.coins.toLocaleString()}
                        </p>
                        <p className={cn(
                          "font-['Logic_Monospace',monospace] text-[9px] font-bold uppercase tracking-[0.1em]",
                          selectedPkg?.id === pkg.id ? 'text-white/85' : 'text-[#6e6259]'
                        )}>
                          Coins / {pkg.label}
                        </p>
                      </div>
                      {pkg.bonus && (
                        <p className={cn(
                          "mt-0.5 font-['Logic_Monospace',monospace] text-[9px] font-bold uppercase tracking-[0.1em]",
                          selectedPkg?.id === pkg.id ? 'text-white' : 'text-[#c90000]'
                        )}>
                          {pkg.bonus}
                        </p>
                      )}
                    </div>
                    <p className={cn(
                      "font-['Logic_Monospace',monospace] text-[10px] font-bold uppercase tracking-[0.08em]",
                      selectedPkg?.id === pkg.id ? 'text-white' : 'text-[#111]'
                    )}>
                      {formatUsd(pkg.amount)}
                    </p>
                  </Label>
                ))}
              </RadioGroup>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="font-['Logic_Monospace',monospace] text-[9px] font-bold uppercase tracking-[0.2em] text-[#6e6259]">
                  Payment Method
                </p>
                {paymentLocked && (
                  <p className="font-['Logic_Monospace',monospace] text-[9px] font-bold uppercase tracking-[0.08em] text-[#c90000]">
                    Select coins first
                  </p>
                )}
              </div>
              <RadioGroup
                value={selectedPkg ? method : ''}
                onValueChange={(val) => {
                  if (!selectedPkg) return;
                  setMethod(val as PaymentMethod);
                }}
                className="grid grid-cols-1 border border-[#111] min-[430px]:grid-cols-3"
              >
                {(['paystack', 'stripe', 'waafi'] as PaymentMethod[]).map((m) => {
                  const Icon = m === 'stripe' ? CreditCard : m === 'waafi' ? Smartphone : Landmark;
                  const label =
                    m === 'stripe'
                      ? (
                        <>
                          Mastercard
                          <span className="block">VISA</span>
                        </>
                      )
                      : m === 'waafi'
                        ? (
                          <>
                            EVC, ZAAD
                            <span className="block">&amp; Golis</span>
                          </>
                        )
                        : 'M-Pesa';
                  const isSelected = selectedPkg && method === m;

                  return (
                    <Label
                      key={m}
                      htmlFor={m}
                      aria-disabled={paymentLocked}
                      className={cn(
                        'grid min-h-[3.4rem] grid-cols-[1.25rem_1fr] items-center gap-2 border-b border-[#111] p-2.5 transition-colors last:border-b-0 min-[430px]:min-h-[4.25rem] min-[430px]:border-b-0 min-[430px]:border-r min-[430px]:last:border-r-0',
                        paymentLocked
                          ? 'cursor-not-allowed bg-[#eee9e2] text-[#8a8179]'
                          : 'cursor-pointer hover:bg-white',
                        !paymentLocked && (isSelected ? 'bg-[#c90000] text-white hover:bg-[#c90000]' : 'bg-[#fbfaf8] text-[#111]')
                      )}
                    >
                      <RadioGroupItem value={m} id={m} disabled={paymentLocked} className="sr-only" />
                      <Icon className="h-4 w-4" />
                      <span className="whitespace-normal font-['Logic_Monospace',monospace] text-[11px] font-bold uppercase leading-4 tracking-[0.04em]">
                        {label}
                      </span>
                    </Label>
                  );
                })}
              </RadioGroup>
            </section>

            {selectedPkg && method === 'waafi' && (
              <section className="space-y-1.5">
                <Label
                  htmlFor="waafi-phone"
                  className="font-['Logic_Monospace',monospace] text-[9px] font-bold uppercase tracking-[0.12em] text-[#6e6259]"
                >
                  EVC, ZAAD & Golis Phone Number
                </Label>
                <Input
                  id="waafi-phone"
                  type="tel"
                  value={waafiPhone}
                  onChange={(e) => setWaafiPhone(e.target.value)}
                  placeholder="e.g. 2526XXXXXXX"
                  className="h-11 rounded-none border-[#111] bg-white font-['AGaramondPro',Georgia,serif] text-base text-[#111] placeholder:text-[#8a8179] focus-visible:ring-[#c90000]"
                />
              </section>
            )}

            {selectedPkg && method === 'stripe' && (
              <section className="space-y-2">
                <p className="font-['Logic_Monospace',monospace] text-[9px] font-bold uppercase tracking-[0.18em] text-[#6e6259]">
                  Mastercard/VISA Details
                </p>
                {!userEmail && (
                  <p className="border border-[#c90000] bg-white p-2.5 font-['Logic_Monospace',monospace] text-[10px] font-bold uppercase tracking-[0.08em] text-[#c90000]">
                    A verified email is required for Mastercard/VISA payments.
                  </p>
                )}
                {userEmail && (
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
                    <p className="border border-[#c90000] bg-white p-2.5 font-['Logic_Monospace',monospace] text-[10px] font-bold uppercase tracking-[0.08em] text-[#c90000]">
                      Stripe key missing. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment.
                    </p>
                  )
                )}
              </section>
            )}

            {selectedPkg && method !== 'stripe' && (
              <section className="border-y border-[#111] bg-white py-2.5">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-['AGaramondPro',Georgia,serif] text-base leading-5 text-[#111]">
                    {selectedPkg.label}, {selectedPkg.coins.toLocaleString()} coins
                  </p>
                  <p className="shrink-0 font-['Atlantic_Serif',Georgia,serif] text-3xl font-semibold leading-none text-[#c90000]">
                    {getPackagePrice(selectedPkg, method)}
                  </p>
                </div>
              </section>
            )}

            {!userEmail && (
              <p className="border border-[#c90000] bg-white p-2.5 font-['Logic_Monospace',monospace] text-[10px] font-bold uppercase tracking-[0.08em] text-[#c90000]">
                A verified email is required to process payments.
              </p>
            )}

            {method !== 'stripe' && (
              <Button
                onClick={handleCheckout}
                disabled={!canCheckout || loading}
                className="h-12 w-full rounded-none border border-[#111] bg-[#111] font-['Logic_Monospace',monospace] text-[11px] font-bold uppercase tracking-[0.1em] text-white shadow-none hover:bg-[#c90000] disabled:border-[#d7d2cc] disabled:bg-[#d7d2cc] disabled:text-[#8a8179]"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Coins className="mr-2 h-4 w-4" />
                )}
                {loading
                  ? 'Processing...'
                  : selectedPkg
                    ? `Buy ${selectedPkg.coins} Coins - ${getPackagePrice(selectedPkg, method)}`
                    : 'Select a package'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
