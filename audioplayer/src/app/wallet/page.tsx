
"use client";

import WalletBalance from '@/components/dashboard/wallet-balance';
import RecommendedAssets from '@/components/dashboard/recommended-assets';
import MyAssets from '@/components/dashboard/my-assets';
import BottomNav from '@/components/common/bottom-nav';

export default function WalletDashboardPage() {
  return (
<div className="flex min-h-screen w-full flex-col">
    <main className="flex-1 bg-background pb-28">
        <div className="container mx-auto max-w-md space-y-6 px-4 py-6">
            
            {/* Replace the h1 with your logo */}
            <div className="flex items-center justify-start">
                <img 
                    src="/assets/logo.png" 
                    alt="RoyalPay11 Logo" 
                    className="h-12 w-auto" // Adjust height as needed
                />
            </div>
            
            <WalletBalance />
            <RecommendedAssets />
            <MyAssets />
        </div>
    </main>
    <BottomNav />
</div>
  );
}
