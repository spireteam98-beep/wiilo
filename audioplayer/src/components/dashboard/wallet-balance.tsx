'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirebaseAuth } from '@/contexts/firebase-auth'; // Targeted context
import { RoyalPayLogo } from '../icons/royalpay-logo';

export default function WalletBalance() {
  const router = useRouter();
  const { toast } = useToast();

  // 1. Pull dynamic data from the profile context
  const { userProfile, isUserProfileLoading } = useFirebaseAuth();

  // 2. Format the REAL balance from Firestore (Defaults to 0 if loading/not found)
  const totalBalance = userProfile?.walletBalance ?? 0;

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalBalance);

  return (
    <Card className="w-full bg-primary text-primary-foreground border-none relative overflow-hidden rounded-3xl">
      <div className="absolute -bottom-1/2 -left-1/4 w-3/4 h-3/4 bg-white/10 rounded-full blur-3xl" />
      <CardHeader className="flex flex-row items-start justify-between p-6 pb-2 relative z-10">
        <CardTitle className="flex items-center gap-2 text-base font-medium text-white/90">
          <RoyalPayLogo className="h-6 w-6" />
          {/* 3. Display REAL RoyalPay ID here */}
          {isUserProfileLoading ? (
            "Loading ID..."
          ) : (
            `RoyalPay:${userProfile?.royalPayId ?? "No ID"}`
          )}
        </CardTitle>
        <Button variant="secondary" size="sm" className="bg-white/20 text-white hover:bg-white/30 rounded-full h-8 px-4 text-sm">
            USD <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col items-start justify-center gap-6 p-6 pt-2 relative z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-5xl font-bold tracking-tight text-white">
            {isUserProfileLoading ? "$0.00" : formattedBalance}
          </h2>
        </div>
        <div className="relative z-10 flex w-full gap-3">
          {/* Transfer - Arrow going out */}
          <Button 
            onClick={() => router.push('/transfer')}
            className="flex-1 bg-black/40 text-white hover:bg-black/50 rounded-full h-11 text-sm font-medium"
          >
            <svg className="mr-2 w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7"/>
              <path d="M7 7h10v10"/>
            </svg>
            Transfer
          </Button>
          
          {/* Deposit - Arrow coming in/down */}
          <Button 
            onClick={() => router.push('/deposit')}
            className="flex-1 bg-white/25 text-white hover:bg-white/35 rounded-full h-11 text-sm font-medium"
          >
            <svg className="mr-2 w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 7L7 17"/>
              <path d="M17 17H7V7"/>
            </svg>
            Deposit
          </Button>
          
          {/* Swap - Two arrows exchange */}
          <Button 
            onClick={() => router.push('/swap')}
            className="flex-1 bg-white/25 text-white hover:bg-white/35 rounded-full h-11 text-sm font-medium"
          >
            <svg className="mr-2 w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3l4 4-4 4"/>
              <path d="M20 7H4"/>
              <path d="M8 21l-4-4 4-4"/>
              <path d="M4 17h16"/>
            </svg>
            Swap
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}