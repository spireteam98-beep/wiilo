'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Coins, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PayProps {
  userId: string;
  userEmail: string;
  onCloseDialog: () => void;
}

const Pay = ({ userId, userEmail, onCloseDialog }: PayProps) => {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const packages = [
    { amount: 5, coins: '500', label: 'Starter' },
    { amount: 10, coins: '1,000', label: 'Popular' },
    { amount: 100, coins: '12,000', label: 'Whale' },
  ];

  const handlePaystackCheckout = async () => {
    if (!selectedPackage) return;
    
    setIsProcessing(true);
    console.log("Initializing payment for:", selectedPackage);

    try {
      // Calling your existing backend server
      const response = await fetch("http://localhost:5000/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          amount: selectedPackage, // USD amount
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      if (data.status === true && data.data.authorization_url) {
        // Redirecting to Paystack's hosted page
        window.location.href = data.data.authorization_url;
      } else {
        toast.error(data.message || "Initialization failed");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Connection Error:", err);
      toast.error("Cannot connect to server at localhost:5000. Is it running?");
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {packages.map((pkg) => (
          <div
            key={pkg.amount}
            onClick={() => setSelectedPackage(pkg.amount)}
            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedPackage === pkg.amount ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Coins className={`h-5 w-5 ${selectedPackage === pkg.amount ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="font-bold text-gray-900">{pkg.coins} Coins</span>
            </div>
            <span className="font-black text-gray-900">${pkg.amount}</span>
          </div>
        ))}
      </div>

      <div className="mt-2 pt-4 border-t border-gray-100">
        <Button
          onClick={handlePaystackCheckout}
          disabled={!selectedPackage || isProcessing}
          className="w-full h-14 rounded-xl bg-blue-600 text-white font-bold text-lg"
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            `Pay $${selectedPackage || '0'} Now`
          )}
        </Button>
        <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-gray-400 font-bold uppercase">
          <ShieldCheck className="h-3 w-3" />
          Secured by your backend
        </div>
      </div>
    </div>
  );
};

export default Pay;