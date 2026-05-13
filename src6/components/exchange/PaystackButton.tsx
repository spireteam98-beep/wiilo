// Example: src/components/exchange/PaystackButton.tsx

"use client";

import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaystackButtonProps {
  amount: number;
  email: string;
  userId: string;
  metadata: {
    coins: number;
    packageName: string;
    userName?: string;
    userEmail?: string;
  };
}

const PaystackButton = ({ amount, email, userId, metadata }: PaystackButtonProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const user = auth.currentUser;

  // Use the backend URL from .env.local, fallback to localhost for dev
  const paymentBackendUrl = process.env.NEXT_PUBLIC_PAYMENT_BACKEND_URL || 'https://backend-aroy.onrender.com';

  const handlePayment = async () => {
    setError(null);
    setIsLoading(true);

    if (!user?.email) {
      const msg = 'Please ensure your email is verified before making a purchase.';
      setError(msg);
      toast({ title: "Email Required", description: msg, variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (!email) {
      const msg = 'A valid email address is required for payment.';
      setError(msg);
      toast({ title: "Email Required", description: msg, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const payload = {
      email,
      amount, // KES amount, backend will multiply by 100
      metadata: {
        userId,
        coins: metadata.coins,
        packageName: metadata.packageName,
        userName: user?.displayName || 'N/A',
        userEmail: user?.email,
      }
    };

    const backendInitializeUrl = `${paymentBackendUrl}/paystack/initialize`;

    try {
      const response = await fetch(backendInitializeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.status) {
        const errorMsg = responseData.message || `Backend initialization error. Status: ${response.status}`;
        throw new Error(errorMsg + ` [PSK_BE_INIT_FAIL]`);
      }

      const authorizationUrl = responseData.data?.authorization_url;
      if (authorizationUrl) {
        window.open(authorizationUrl, '_blank');
        toast({
          title: 'Redirecting to Paystack',
          description: 'Please complete your payment in the new tab.',
        });
      } else {
        throw new Error('Authorization URL not found in backend response. [NO_AUTH_URL_BE]');
      }
    } catch (err: any) {
      let displayError = 'An unexpected error occurred during payment setup.';
      if (err.message.includes('Failed to fetch')) {
        displayError = `Failed to connect to payment server at ${backendInitializeUrl}. Please ensure the backend server is running.`;
      } else {
        displayError = err.message;
      }
      setError(displayError);
      toast({
        title: 'Payment Setup Error',
        description: displayError,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-center">
      {error && (
        <div className="text-destructive text-sm mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
          {error}
        </div>
      )}
      <Button
        onClick={handlePayment}
        disabled={isLoading || !user?.email}
        className="send-money-button w-full text-sm py-2.5"
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isLoading ? 'Processing...' : `Pay KES ${amount.toLocaleString()}`}
      </Button>
      {!user?.email && (
        <p className="text-xs text-destructive mt-2">Please ensure your email is verified to make a purchase.</p>
      )}
      <p className="text-xs text-muted-foreground mt-3">
        You will be redirected to Paystack in a new tab to complete your payment securely.
      </p>
    </div>
  );
};

export default PaystackButton;
