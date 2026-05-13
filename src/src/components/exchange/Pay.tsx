"use client";

import React, { useState } from 'react';
import PaystackButton from './PaystackButton';
import WaafiButton from './WaafiButton'; 
import StripeButton from './StripeButton'; 
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; 
import { useToast } from '@/hooks/use-toast';

interface CoinPackage {
  id: string;
  amount: number; // KES amount
  coins: number;
  description: string;
  bonusText?: string;
}

const COIN_PACKAGES: CoinPackage[] = [
  { id: 'pack1', amount: 1, coins: 100, description: "Basic Pack (KES 1)" },
  { id: 'pack2', amount: 2, coins: 220, description: "Popular Pack (KES 2)", bonusText: "Includes 10% bonus coins" },
  { id: 'pack3', amount: 50, coins: 600, description: "Premium Pack (KES 50)", bonusText: "Includes 20% bonus coins" },
];

interface PayProps {
  userId: string;
  userEmail: string | null;
  onCloseDialog: () => void;
}

type PaymentMethod = "paystack" | "waafi" | "stripe";

export default function Pay({ userId, userEmail, onCloseDialog }: PayProps) {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");
  const [waafiPhoneNumber, setWaafiPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const handlePackageSelect = (pkgId: string) => {
    setError('');
    const foundPackage = COIN_PACKAGES.find(p => p.id === pkgId);
    setSelectedPackage(foundPackage || null);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Error Feedback */}
      {error && (
        <div className="bg-destructive/20 border-l-4 border-destructive text-destructive p-3 rounded-md text-sm">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {!userEmail && (
        <div className="bg-destructive/20 border-l-4 border-destructive text-destructive p-3 rounded-md">
          <p className="font-semibold text-sm">Email Required</p>
          <p className="text-xs">A valid email is required to process payments.</p>
        </div>
      )}

      {/* --- 1. Payment Method Selection --- */}
      <section>
        <Label className="text-sm font-medium text-white/70 block mb-2">1. Choose Payment Method</Label>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
          className="grid grid-cols-1 gap-2"
        >
          {["paystack", "stripe", "waafi"].map((method) => (
            <Label
              key={method}
              htmlFor={method}
              className={`flex items-center p-3 border rounded-xl transition-all cursor-pointer
                ${paymentMethod === method ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-white/10 bg-white/5 hover:bg-white/10'} glass-input-like`}
            >
              <RadioGroupItem value={method} id={method} className="mr-3 border-white/50 text-primary" />
              <span className="text-sm text-white font-medium capitalize">
                {method === 'stripe' ? 'International Card (Stripe)' : method}
              </span>
            </Label>
          ))}
        </RadioGroup>
      </section>

      {/* --- 2. Package Selection --- */}
      <section>
        <Label className="text-sm font-medium text-white/70 block mb-2">2. Select Coin Package</Label>
        <RadioGroup
          value={selectedPackage?.id}
          onValueChange={handlePackageSelect}
          className="space-y-2"
          disabled={!userEmail}
        >
          {COIN_PACKAGES.map((pkg) => (
            <Label
              key={pkg.id}
              htmlFor={pkg.id}
              className={`flex items-center justify-between p-3 border rounded-xl transition-all
                ${selectedPackage?.id === pkg.id ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-lg' : 'border-white/10 bg-white/5 hover:bg-white/10'}
                ${!userEmail ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} glass-input-like`}
            >
              <div className="flex items-center">
                <RadioGroupItem value={pkg.id} id={pkg.id} className="mr-3 border-white/50 text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-white">{pkg.coins.toLocaleString()} Coins</h3>
                  {pkg.bonusText && <p className="text-[10px] text-green-400 font-bold uppercase">{pkg.bonusText}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-white">KES {pkg.amount.toLocaleString()}</p>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </section>

      {/* --- 3. Checkout Area --- */}
      {selectedPackage && userEmail && (
        <div className="mt-6 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Order Summary Box */}
          <div className="bg-black/40 p-4 rounded-2xl mb-6 border border-white/10 glass-input-like shadow-xl">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Order Summary</h3>
            <div className="flex justify-between text-sm mb-1.5 text-white/60">
              <span>Selected Pack:</span>
              <span className="text-white font-semibold">{selectedPackage.description}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-2">
              <span className="text-sm text-white/60 font-medium">Total Price:</span>
              <span className="text-2xl font-black text-white">
                KES {selectedPackage.amount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Dynamic Payment Form Container */}
          <div className="space-y-4">
            
            {/* Stripe Inline Checkout (Card Form + Pay Button) */}
            {paymentMethod === 'stripe' && (
              <div className="p-1 animate-in zoom-in-95 duration-300">
                <StripeButton
                  amount={selectedPackage.amount}
                  userId={userId}
                  userEmail={userEmail}
                  metadata={{
                    coins: selectedPackage.coins,
                    packageName: selectedPackage.description
                  }}
                />
                <p className="mt-4 text-[10px] text-center text-white/30 uppercase tracking-widest">
                  🔒 Payments Secured by Stripe
                </p>
              </div>
            )}

            {/* Paystack Payment Button */}
            {paymentMethod === 'paystack' && (
              <PaystackButton
                amount={selectedPackage.amount}
                email={userEmail}
                userId={userId}
                metadata={{ coins: selectedPackage.coins, packageName: selectedPackage.description }}
              />
            )}

            {/* Waafi Mobile Money Form */}
            {paymentMethod === 'waafi' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="space-y-1.5">
                  <Label htmlFor="waafiPhone" className="text-xs text-white/60 ml-1">Waafi Phone Number</Label>
                  <Input
                    id="waafiPhone"
                    type="tel"
                    value={waafiPhoneNumber}
                    onChange={(e) => setWaafiPhoneNumber(e.target.value)}
                    placeholder="e.g. 2526XXXXXXX"
                    className="glass-input h-12 border-white/10"
                  />
                </div>
                <WaafiButton
                  amount={selectedPackage.amount}
                  currency="USD"
                  phoneNumber={waafiPhoneNumber}
                  userId={userId}
                  metadata={{ coins: selectedPackage.coins, packageName: selectedPackage.description }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}