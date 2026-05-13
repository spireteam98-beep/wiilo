'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import PlayerBar from '@/components/library/PlayerBar';
import FullScreenPlayer from '@/components/player/FullScreenPlayer';
import { useAuth } from '@/contexts/AuthContext'; // THIS WAS MISSING
import { usePlayer } from '@/contexts/PlayerContext';
import { useSearchParams, useRouter as useNextRouter } from 'next/navigation';
import { Loader2, User, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import '@/components/ui/articles.css'; 

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Dynamic Imports
const MarketSection = dynamic(() => import('@/components/exchange/MarketSection'), { 
  loading: () => <div className="h-64 mx-4 mt-4 bg-white/5 animate-pulse rounded-xl" /> 
});
const UserActions = dynamic(() => import('@/components/exchange/UserActions'), { ssr: false });
const CardBalance = dynamic(() => import('@/components/exchange/CardBalance'), { ssr: false });
const SoundsContent = dynamic(() => import('@/components/sounds/SoundsContent'), { ssr: false });
const ArticleContent = dynamic(() => import('@/components/articles/ArticleContent'), { 
  loading: () => <div className="p-4 space-y-4">
    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 animate-pulse rounded-xl" />)}
  </div> 
});

function AccountSkeleton() {
  return (
    <div className="p-6 flex flex-col items-center pt-10 animate-pulse">
      <div className="h-28 w-28 bg-white/10 rounded-full mb-6" />
      <div className="h-6 w-40 bg-white/10 rounded mb-2" />
      <div className="h-4 w-32 bg-white/10 rounded mb-10" />
      <div className="w-full h-24 bg-white/10 rounded-2xl mb-4" />
    </div>
  );
}

export default function ClientPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { currentTrack, isPlayerOpen } = usePlayer();
  const nextRouter = useNextRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [coinBalance, setCoinBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('Home'); 
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  
  const paymentBackendUrl = process.env.NEXT_PUBLIC_PAYMENT_BACKEND_URL || 'http://localhost:5000';

  // FIX: Ensure tab switches to Home if an articleId is in the URL
  useEffect(() => {
    const articleId = searchParams.get('articleId');
    if (articleId && activeTab !== 'Home') {
      setActiveTab('Home');
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    if (!authLoading && user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setCoinBalance(docSnap.data().coins || 0);
        }
      });
      return () => unsubscribe();
    }
  }, [user, authLoading]);

  const handleVerifyPayment = useCallback(async (paymentReference: string) => {
    if (!user || isVerifyingPayment) return;
    setIsVerifyingPayment(true);
    try {
      const response = await fetch(`${paymentBackendUrl}/paystack/verify/${paymentReference}`);
      if (response.ok) toast({ title: 'Payment Successful!' });
    } catch (error) {
      console.error(error);
    } finally {
      setIsVerifyingPayment(false);
      nextRouter.replace(window.location.pathname, { scroll: false });
    }
  }, [user, isVerifyingPayment, paymentBackendUrl, toast, nextRouter]);

  useEffect(() => {
    const ref = searchParams.get('trxref') || searchParams.get('reference');
    if (ref && user && !authLoading) handleVerifyPayment(ref);
  }, [searchParams, user, authLoading, handleVerifyPayment]);

  const renderContent = () => {
    if (isPlayerOpen) return null;

    if (activeTab === 'Account') {
      if (authLoading) return <AccountSkeleton />;
      return (
        <div className="p-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 pt-10 font-sans">
          <div className="relative mb-6">
            <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-2xl">
              <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold uppercase">
                {user?.displayName?.charAt(0) || <User />}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-white">{user?.displayName || 'Guest User'}</h2>
            <p className="text-sm text-white/40 tracking-wide">{user?.email || 'Sign in to sync'}</p>
          </div>
          <div className="w-full space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Available Coins</p>
                  <p className="text-2xl font-black text-primary">{coinBalance.toLocaleString()}</p>
                </div>
                <Wallet className="text-primary/40 h-8 w-8" />
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'Home': return <ArticleContent />;
      case 'Trade': return (
        <div className="animate-in fade-in duration-300 pt-4 px-4 font-sans">
          <CardBalance />
          <UserActions setCoinBalance={setCoinBalance} />
          <MarketSection /> 
        </div>
      );
      case 'Sounds': return <SoundsContent />;
      case 'Markets': return <div className="pt-4 font-sans"><MarketSection /></div>;
      default: return <ArticleContent />;
    }
  };
  
  const mainPadding = (currentTrack && !isPlayerOpen) ? 'pb-28' : (isPlayerOpen ? 'pb-0' : 'pb-16');

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <main className={`flex-grow overflow-y-auto ${mainPadding}`}>
        {renderContent()}
      </main>
      {currentTrack && !isPlayerOpen && <PlayerBar />}
      {isPlayerOpen && <FullScreenPlayer />}
    </div>
  );
}