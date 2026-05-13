"use client";

import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; // <--- Add this line
import { Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Use your Publishable Key (starts with pk_test_ or pk_live_)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeButtonProps {
  amount: number;
  userId: string;
  userEmail: string | null;
  metadata: {
    coins: number;
    packageName: string;
  };
}

const CheckoutForm = ({ amount, userId, userEmail, metadata }: StripeButtonProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !userEmail) return;

    setIsProcessing(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_PAYMENT_BACKEND_URL;
      
      // 1. Create Payment Intent on your Render Backend
      const response = await fetch(`${backendUrl}/stripe/create-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount, // Backend does Math.round(amount * 100)
          userId,
          email: userEmail,
          coins: metadata.coins,
          packageName: metadata.packageName,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to initiate payment");

      // 2. Confirm the payment with the CardElement info
      const cardElement = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement!,
          billing_details: { email: userEmail },
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.paymentIntent.status === "succeeded") {
        // 3. Verify with backend to add coins to Firebase
        const verifyRes = await fetch(`${backendUrl}/stripe/verify/${result.paymentIntent.id}`, {
          method: "POST"
        });
        const verifyData = await verifyRes.json();

        if (verifyData.success) {
          toast({ title: "Success!", description: `Added ${metadata.coins} coins to your account.` });
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-white/5 border border-white/20 rounded-xl glass-input-like">
        <Label className="text-[10px] text-white/50 uppercase mb-2 block font-bold">Card Information</Label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#ffffff",
                fontFamily: "Inter, sans-serif",
                "::placeholder": { color: "#94a3b8" },
              },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-[#635bff] hover:bg-[#5851db] text-white py-6 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ShieldCheck className="h-5 w-5" />
        )}
        {isProcessing ? "Processing..." : `Pay KES ${amount.toLocaleString()} Now`}
      </Button>
    </form>
  );
};

// Main wrapper that provides the Stripe context
const StripeButton: React.FC<StripeButtonProps> = (props) => (
  <Elements stripe={stripePromise}>
    <CheckoutForm {...props} />
  </Elements>
);

export default StripeButton;