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

  // Use env variable if backend is on a different domain, else use relative path
  const backendUrl =
    process.env.NEXT_PUBLIC_PAYMENT_BACKEND_URL || "";
  const waafiEndpoint = backendUrl
    ? `${backendUrl}/api/waafi/initiate`
    : "/api/waafi/initiate";

  const handleWaafiPayment = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your Waafi phone number.",
        variant: "destructive",
      });
      return;
    }
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");
    if (!/^\d{9,15}$/.test(cleanedPhoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number (9-15 digits).",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(waafiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency,
          phoneNumber: cleanedPhoneNumber,
          userId,
          metadata,
        }),
      });

      const contentType = response.headers.get("content-type");
      let responseData: any = {};
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const responseText = await response.text();
        toast({
          title: "Waafi Initiation Error",
          description: `Server error: ${response.status}. Please check console or try again later.`,
          variant: "destructive",
        });
        throw new Error(
          `Failed to initiate Waafi payment. Server responded with ${response.status} and non-JSON content: ${responseText}`
        );
      }

      if (!response.ok || !responseData.success) {
        toast({
          title: "Waafi Initiation Error",
          description:
            responseData.message ||
            `Payment initiation failed. Status: ${response.status}`,
          variant: "destructive",
        });
        throw new Error(
          responseData.message ||
            `Failed to initiate payment with Waafi. Status: ${response.status}`
        );
      }

      toast({
        title: "Waafi Payment Initiated",
        description:
          responseData.message ||
          "Please check your phone to authorize the payment.",
      });
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Waafi Payment Error",
        description:
          errorMessage || "Could not start Waafi payment. Please try again.",
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
      className="send-money-button w-full text-sm py-2.5"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      {isLoading ? "Processing..." : `Pay with Waafi`}
    </Button>
  );
};

export default WaafiButton;
