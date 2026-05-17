"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WaafiButtonProps {
  amount: number;
  currency: string;
  phoneNumber: string;
  userId: string;
  metadata: {
    coins: number;
    packageName: string;
    originalAmountKES: number;
    userId: string;
    userEmail?: string | null;
  };
}

const WaafiButton: React.FC<WaafiButtonProps> = ({
  amount,
  currency,
  phoneNumber,
  userId,
  metadata,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const backendUrl = process.env.NEXT_PUBLIC_PAYMENT_BACKEND_URL || "";
  const waafiEndpoint = backendUrl
    ? `${backendUrl}/api/waafi/initiate`
    : "/api/waafi/initiate";

  const handleWaafiPayment = async () => {
    if (!phoneNumber.trim()) {
      toast({ title: "Error", description: "Phone number is required", variant: "destructive" });
      return;
    }

    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");
    setIsLoading(true);

    try {
      // 1. Prepare data exactly as Waafi API expects
      const payload = {
        schemaVersion: "1.0",
        requestId: `REQ${Date.now()}`,
        timestamp: String(Math.floor(Date.now() / 1000)), // Unix timestamp as string
        channelName: "WEB",
        serviceName: "API_PURCHASE",
        serviceParams: {
          merchantUid: process.env.NEXT_PUBLIC_WAAFI_MERCHANT_UID || "M0910161", // Fallback for testing
          apiUserId: process.env.NEXT_PUBLIC_WAAFI_API_USER_ID || "1000146",
          apiKey: process.env.NEXT_PUBLIC_WAAFI_API_KEY || "API-1922135978AHX",
          paymentMethod: "MWALLET_ACCOUNT",
          payerInfo: {
            accountNo: cleanedPhoneNumber,
          },
          transactionInfo: {
            referenceId: `REF${Date.now()}`,
            invoiceId: `INV${Date.now()}`,
            amount: String(amount),
            currency: currency || "USD",
            description: `Purchase of ${metadata.coins} coins`,
          },
        },
        // We still send metadata so your backend can save it to the DB after payment
        customMetadata: metadata, 
      };

      const response = await fetch(waafiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Payment failed to start.");
      }

      toast({
        title: "Check Your Phone",
        description: "A payment prompt has been sent to your device.",
      });

    } catch (error: any) {
      console.error("Waafi Request Error:", error);
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleWaafiPayment}
      disabled={isLoading || !phoneNumber.trim()}
      className="w-full py-6 text-lg font-bold"
    >
      {isLoading ? (
        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
      ) : (
        `Pay ${amount} ${currency} with Waafi`
      )}
    </Button>
  );
};

export default WaafiButton;