"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PaystackButton from './PaystackButton';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, setDoc, enableIndexedDbPersistence } from 'firebase/firestore';

// Enable offline persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });
} catch (error) {
  console.warn('Error enabling persistence:', error);
}

const COIN_PACKAGES = [
  { amount: 1000, coins: 100, description: "Basic Pack" },  // KSh 1,000 = 100 coins
  { amount: 2000, coins: 220, description: "Popular Pack" }, // KSh 2,000 = 220 coins (10% bonus)
  { amount: 5000, coins: 600, description: "Premium Pack" }, // KSh 5,000 = 600 coins (20% bonus)
];

export default function Pay({ userId, userEmail }) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Force clean any errors
  const cleanErrors = () => {
    setError('');
    setLoading(false);
  };

  // Fetch user balance with forced error handling
  const fetchUserBalance = async () => {
    try {
      cleanErrors();
      setLoading(true);
      
      if (!userId) throw new Error('No user ID provided');
      
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        setCurrentBalance(0);
      } else {
        setCurrentBalance(docSnap.data().coins || 0);
      }
    } catch (err) {
      setError('Failed to load your balance. Click here to try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBalance();
  }, [userId]);

  // Handle package selection with forced cleaning
  const handlePackageSelect = (pkg) => {
    cleanErrors();
    setSelectedPackage(pkg);
  };

  // Handle payment success with forced error handling
  const handlePaymentSuccess = async (response) => {
    try {
      cleanErrors();
      setLoading(true);

      if (!selectedPackage || !userId) {
        throw new Error('Invalid payment data');
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      const paymentData = {
        amount: selectedPackage.amount,
        coins: selectedPackage.coins,
        timestamp: new Date(),
        reference: response.reference,
        status: 'success'
      };

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: userEmail,
          coins: selectedPackage.coins,
          lastPayment: paymentData,
          paymentHistory: [paymentData]
        });
      } else {
        const currentCoins = userDoc.data().coins || 0;
        await updateDoc(userRef, {
          coins: currentCoins + selectedPackage.coins,
          lastPayment: paymentData,
          paymentHistory: [...(userDoc.data().paymentHistory || []), paymentData]
        });
      }

      // Verify the update
      const verifyDoc = await getDoc(userRef);
      if (!verifyDoc.exists()) {
        throw new Error('Failed to verify payment update');
      }

      setCurrentBalance(verifyDoc.data().coins || 0);
      router.push('/dashboard');
      
    } catch (err) {
      setError(
        `Payment recorded but database update failed. ` +
        `Save this reference number and contact support: ${response.reference}`
      );
    } finally {
      setLoading(false);
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {error && (
        <div 
          onClick={fetchUserBalance}
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 cursor-pointer hover:bg-yellow-50 transition-colors"
          role="alert"
        >
          <p className="font-bold">Database Error</p>
          <p>{error}</p>
          <p className="text-sm mt-2">Click this message to retry</p>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">Buy Coins</h2>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        {loading ? (
          <div className="animate-pulse h-6 bg-gray-200 rounded w-1/3"></div>
        ) : (
          <p className="text-lg">Current Balance: <span className="font-bold">{currentBalance} coins</span></p>
        )}
      </div>

      {/* Coin Packages */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {COIN_PACKAGES.map((pkg) => (
          <div 
            key={pkg.amount}
            className={`border rounded-lg p-6 cursor-pointer transition-all ${
              selectedPackage?.amount === pkg.amount 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-green-300'
            }`}
            onClick={() => handlePackageSelect(pkg)}
          >
            <h3 className="text-xl font-bold mb-2">{pkg.description}</h3>
            <p className="text-3xl font-bold mb-2">{pkg.coins} coins</p>
            <p className="text-gray-600 mb-4">KSh {pkg.amount.toLocaleString()}</p>
            {pkg.amount > 1000 && (
              <p className="text-green-600 text-sm">
                {pkg.amount === 2000 ? 'Includes 10% bonus coins' : 'Includes 20% bonus coins'}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Payment Button */}
      {selectedPackage && (
        <div className="text-center">
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-2">Order Summary</h3>
            <p>Package: {selectedPackage.description}</p>
            <p>Amount: KSh {selectedPackage.amount.toLocaleString()}</p>
            <p>Coins to receive: {selectedPackage.coins}</p>
          </div>
          
          <PaystackButton
            amount={selectedPackage.amount}
            email={userEmail}
            userId={userId}
            onSuccess={handlePaymentSuccess}
            metadata={{
              coins: selectedPackage.coins,
              packageName: selectedPackage.description
            }}
          />
          
          <p className="mt-4 text-sm text-gray-600">
            By clicking the button above, you agree to our terms of service.
          </p>
        </div>
      )}
    </div>
  );
} 