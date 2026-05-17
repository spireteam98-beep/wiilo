"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

type VerifyState = 'idle' | 'loading' | 'success' | 'error';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerifyState>('idle');
  const [message, setMessage] = useState('Preparing payment verification...');
  const [coinsAdded, setCoinsAdded] = useState<number | null>(null);

  const reference = useMemo(
    () => searchParams.get('trxref') || searchParams.get('reference'),
    [searchParams]
  );

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!reference) {
        setState('error');
        setMessage('Missing payment reference. Please contact support if you were charged.');
        return;
      }

      setState('loading');
      setMessage('Verifying your payment and updating wallet balance...');

      try {
        const res = await fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        });

        const data = await res.json();
        if (cancelled) return;

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Payment verification failed.');
        }

        setCoinsAdded(Number(data.coinsAdded || 0));
        setState('success');
        setMessage(data.message || 'Payment verified and wallet updated successfully.');
      } catch (error: any) {
        if (cancelled) return;
        setState('error');
        setMessage(error?.message || 'Unable to verify payment at this time.');
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        {state === 'loading' && <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />}
        {state === 'success' && <CheckCircle2 className="h-12 w-12 mx-auto text-green-400" />}
        {state === 'error' && <XCircle className="h-12 w-12 mx-auto text-red-400" />}

        <h1 className="mt-4 text-2xl font-black tracking-tight">
          {state === 'success' ? 'Payment Completed' : state === 'error' ? 'Payment Check Failed' : 'Processing Payment'}
        </h1>

        <p className="mt-3 text-sm text-white/70">{message}</p>

        {state === 'success' && coinsAdded !== null && (
          <p className="mt-2 text-sm text-primary font-bold">
            Coins added: {coinsAdded}
          </p>
        )}

        <div className="mt-7 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-black"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

function PaymentSuccessFallback() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h1 className="mt-4 text-2xl font-black tracking-tight">Processing Payment</h1>
        <p className="mt-3 text-sm text-white/70">Loading payment details...</p>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
