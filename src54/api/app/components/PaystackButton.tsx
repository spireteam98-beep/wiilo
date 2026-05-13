"use client";

import React, { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { auth } from '../lib/firebase';

type Currency = 'NGN' | 'GHS' | 'USD' | 'KES';

interface CustomField {
  display_name: string;
  variable_name: string;
  value: string;
}

interface PaystackConfig {
  reference: string;
  email: string;
  amount: number;
  publicKey: string;
  currency: Currency;
  metadata: {
    custom_fields: CustomField[];
  };
}

interface PaystackButtonProps {
  amount: number;
  email: string;
  userId: string;
  metadata: {
    coins: number;
    packageName: string;
  };
  onSuccess: (response: any) => Promise<void>;
  onClose?: () => void;
}

const PaystackButton = ({ amount, email, userId, metadata, onSuccess, onClose }: PaystackButtonProps) => {
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;
  
  const config: PaystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: email,
    amount: amount, // Amount already in KES cents
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    currency: 'KES', // Use KES for Paystack
    metadata: {
      custom_fields: [
        {
          display_name: "User ID",
          variable_name: "user_id",
          value: userId
        },
        {
          display_name: "Coins",
          variable_name: "coins",
          value: (amount * 10).toString()
        },
        {
          display_name: "Package",
          variable_name: "package",
          value: metadata.packageName
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(config);

  const handlePayment = () => {
    if (!user?.email) {
      setError('Please ensure your email is verified before making a purchase.');
      return;
    }

    if (!email) {
      setError('Please provide a valid email address.');
      return;
    }
    
    try {
      initializePayment(
        (response?: any) => {
          setError(null);
          onSuccess(response);
        },
        () => {
          onClose?.();
        }
      );
    } catch (err) {
      setError('Failed to initialize payment. Please try again.');
      console.error('Payment initialization error:', err);
    }
  };

  return (
    <div>
      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error}
        </div>
      )}
      <button
        onClick={handlePayment}
        disabled={!user?.email}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {user ? 'Pay Now' : 'Processing...'}
      </button>
    </div>
  );
};

export default PaystackButton;
