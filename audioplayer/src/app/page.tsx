
"use client";

import BottomNav from '@/components/common/bottom-nav';
import Header from '@/components/common/header';
import MyAssets from '@/components/dashboard/my-assets';
import RecommendedAssets from '@/components/dashboard/recommended-assets';
import WalletBalance from '@/components/dashboard/wallet-balance';
import { ProtectedRoute } from '@/components/protected-route';

function HomePageContent() {
  return (
    <div className="flex min-h-screen w-full flex-col">
        <main className="flex-1 bg-background pb-28">
            <div className="container mx-auto max-w-md space-y-6 px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center justify-start">
                <img 
                    src="/assets/logo.png" 
                    alt="RoyalPay11 Logo" 
                    className="h-12 w-auto" // Adjust height as needed
                />
            </div>
                  <Header />
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

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  );
}
