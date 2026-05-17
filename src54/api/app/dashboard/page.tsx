"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';
import { User, signOut } from 'firebase/auth';
import PaystackButton from '../components/PaystackButton';
import CoinTransfer from '../components/CoinTransfer';

interface CoinPackage {
  id?: string;
  coins: number;
  price_usd: number;
  is_active: boolean;
  description?: string;
}

export default function DashboardPage() {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [updating, setUpdating] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage first
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/sign-in');
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserBalance(currentUser.uid);
        await fetchCoinPackages();
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchCoinPackages = async () => {
    try {
      const packagesRef = collection(db, 'coin_packages');
      const snapshot = await getDocs(packagesRef);
      const packages = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as CoinPackage))
        .filter(pkg => pkg.is_active)
        .sort((a, b) => a.price_usd - b.price_usd);
      setCoinPackages(packages);
    } catch (err) {
      console.error('Error fetching coin packages:', err);
      setError('Failed to load coin packages');
    }
  };

  const fetchUserBalance = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        setCurrentBalance(docSnap.data().coins || 0);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load your balance');
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
    setError('');
  };

  const handlePaystackSuccess = async (response: any) => {
    if (!user || !selectedPackage) return;
    
    setUpdating(true);
    setError('');

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      const paymentData = {
        amount: selectedPackage.price_usd * 100,
        coins: selectedPackage.coins,
        timestamp: new Date(),
        reference: response.reference,
        status: 'success',
        packageName: selectedPackage.description || `${selectedPackage.coins} Coins Package`,
        paymentMethod: 'paystack'
      };

      if (userDoc.exists()) {
        const currentCoins = userDoc.data().coins || 0;
        await updateDoc(userRef, {
          coins: currentCoins + selectedPackage.coins,
          lastPayment: paymentData,
          paymentHistory: arrayUnion(paymentData)
        });
      } else {
        await updateDoc(userRef, {
          email: user.email,
          coins: selectedPackage.coins,
          lastPayment: paymentData,
          paymentHistory: [paymentData]
        });
      }

      // Refresh balance
      await fetchUserBalance(user.uid);
      setSelectedPackage(null);
      alert(`Successfully added ${selectedPackage.coins} coins to your account!`);
    } catch (err) {
      console.error('Error updating coins:', err);
      setError('Payment successful but failed to update coins. Please contact support.');
    } finally {
      setUpdating(false);
    }
  };

  const handleManualPurchase = async () => {
    if (!user || !selectedPackage) return;
    
    setUpdating(true);
    setError('');

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      const paymentData = {
        amount: selectedPackage.price_usd * 100,
        coins: selectedPackage.coins,
        timestamp: new Date(),
        reference: `manual_${Date.now()}`,
        status: 'success',
        packageName: selectedPackage.description || `${selectedPackage.coins} Coins Package`,
        paymentMethod: 'manual'
      };

      if (userDoc.exists()) {
        const currentCoins = userDoc.data().coins || 0;
        await updateDoc(userRef, {
          coins: currentCoins + selectedPackage.coins,
          lastPayment: paymentData,
          paymentHistory: arrayUnion(paymentData)
        });
      } else {
        await updateDoc(userRef, {
          email: user.email,
          coins: selectedPackage.coins,
          lastPayment: paymentData,
          paymentHistory: [paymentData]
        });
      }

      // Refresh balance
      await fetchUserBalance(user.uid);
      setSelectedPackage(null);
      alert(`Successfully added ${selectedPackage.coins} coins to your account!`);
    } catch (err) {
      console.error('Error updating coins:', err);
      setError('Failed to update coins. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('user');
      await signOut(auth);
      router.push('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Digital Wallet</h1>
            <div className="flex items-center space-x-4">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <button onClick={handleSignOut} className="text-red-600 hover:text-red-700">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Card Section */}
        <div className="wallet-card bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 mb-8">
          <div className="balance flex justify-between items-center mb-6">
            <div className="left">
              <span className="text-blue-100 text-lg">Total Balance</span>
              <h1 className="text-5xl font-bold text-white mt-2">
                {currentBalance.toLocaleString()} coins
              </h1>
            </div>
            <div className="right">
              <button 
                onClick={() => setShowDepositModal(true)}
                className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Wallet Footer */}
          <div className="wallet-footer grid grid-cols-4 gap-4">
            <div className="item">
              <button 
                onClick={() => setShowDepositModal(true)}
                className="flex flex-col items-center p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <div className="icon-wrapper bg-danger p-2 rounded-full mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <span className="text-white text-sm font-medium">Withdraw</span>
              </button>
            </div>
            <div className="item">
              <button 
                onClick={() => setShowSendModal(true)}
                className="flex flex-col items-center p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <div className="icon-wrapper bg-primary p-2 rounded-full mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <span className="text-white text-sm font-medium">Send</span>
              </button>
            </div>
            <div className="item">
              <button 
                className="flex flex-col items-center p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <div className="icon-wrapper bg-success p-2 rounded-full mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span className="text-white text-sm font-medium">Cards</span>
              </button>
            </div>
            <div className="item">
              <button 
                onClick={() => setIsTestMode(!isTestMode)}
                className="flex flex-col items-center p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <div className="icon-wrapper bg-warning p-2 rounded-full mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <span className="text-white text-sm font-medium">Exchange</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-gray-500 text-sm mb-2">Total Sent</h3>
            <div className="text-2xl font-bold text-red-600">- {currentBalance} coins</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-gray-500 text-sm mb-2">Total Received</h3>
            <div className="text-2xl font-bold text-green-600">+ {currentBalance} coins</div>
          </div>
        </div>

        {/* Coin Packages Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Buy Coins</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {coinPackages.map((pkg) => (
              <div 
                key={pkg.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {pkg.description || 'Standard Plan'}
                    </h3>
                    <div className="text-2xl font-bold text-blue-600">
                      ${pkg.price_usd}
                    </div>
                  </div>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-extrabold text-gray-900 mb-2">
                      {pkg.coins.toLocaleString()}
                    </div>
                    <div className="text-gray-500">coins</div>
                  </div>
                  <button
                    onClick={() => handlePackageSelect(pkg)}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                      selectedPackage?.id === pkg.id
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {selectedPackage?.id === pkg.id ? '✓ Selected' : 'Buy Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transfer Section */}
        <div className="mb-8">
          <CoinTransfer
            currentUserEmail={user?.email || ''}
            currentUserId={user?.uid || ''}
            currentBalance={currentBalance}
            onTransferComplete={() => fetchUserBalance(user?.uid || '')}
          />
        </div>

        {/* Payment Section */}
        {selectedPackage && user && (
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Plan</span>
                <span className="font-medium text-gray-900">
                  {selectedPackage.description || 'Standard Plan'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Number of Coins</span>
                <span className="font-medium text-gray-900">
                  {selectedPackage.coins.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Price</span>
                <span className="font-medium text-gray-900">
                  ${selectedPackage.price_usd.toLocaleString()} USD
                </span>
              </div>
            </div>
            
            {isTestMode ? (
              <button
                onClick={handleManualPurchase}
                disabled={updating}
                className={`w-full py-4 font-medium rounded-lg transition-colors ${
                  updating 
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
              >
                {updating ? 'Processing...' : 'Test Purchase'}
              </button>
            ) : (
              <div className="w-full">
                <PaystackButton
                  amount={selectedPackage.price_usd * 100}
                  email={user.email || ''}
                  userId={user.uid}
                  metadata={{
                    coins: selectedPackage.coins,
                    packageName: selectedPackage.description || `${selectedPackage.coins} Coins Package`
                  }}
                  onSuccess={handlePaystackSuccess}
                />
              </div>
            )}
            
            <p className="mt-4 text-sm text-gray-500 text-center">
              {isTestMode 
                ? 'Test Mode: No actual payment will be processed'
                : 'By clicking the button above, you agree to our terms of service.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}