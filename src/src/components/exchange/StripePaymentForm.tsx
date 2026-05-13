"use client";

import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function StripePaymentForm({ amount, userId, userEmail, metadata }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const cardElement = elements.getElement(CardElement);

    try {
      // 1. Get Client Secret from your local API
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, userId, metadata }),
      });
      const { clientSecret } = await res.json();

      // 2. Confirm Payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement!, billing_details: { email: userEmail } },
      });

      if (error) throw new Error(error.message);
      if (paymentIntent.status === 'succeeded') alert("Payment Successful!");
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-white rounded-md">
        <CardElement options={{ style: { base: { fontSize: '16px', color: '#000' } } }} />
      </div>
      <Button disabled={loading || !stripe} className="w-full bg-[#635bff]">
        {loading ? <Loader2 className="animate-spin mr-2" /> : `Pay KES ${amount}`}
      </Button>
    </form>
  );
}