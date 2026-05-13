"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { FaCoins } from 'react-icons/fa';

interface LowBalanceWarningProps {
  currentBalance: number;
  requiredBalance: number;
  onClose: () => void;
}

const LowBalanceWarning: React.FC<LowBalanceWarningProps> = ({
  currentBalance,
  requiredBalance,
  onClose
}) => {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] rounded-xl max-w-md w-full p-6 border border-orange-500/20">
        <div className="bg-orange-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <FaCoins className="text-3xl text-orange-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-4">
          Low Balance Notice
        </h2>
        
        <div className="space-y-4 mb-6">
          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-gray-400 text-center">
              Your current balance:
              <span className="block text-2xl font-bold text-white">
                {currentBalance} coins
              </span>
            </p>
          </div>
          
          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-gray-400 text-center">
              Recommended minimum:
              <span className="block text-2xl font-bold text-orange-500">
                100 coins
              </span>
            </p>
          </div>
        </div>

        <p className="text-gray-400 text-center mb-6">
          Your balance is getting low. Each new article or video costs 10 coins.
          <span className="block mt-2 text-sm">
            We recommend maintaining at least 100 coins for uninterrupted access to content.
          </span>
        </p>

        <div className="flex flex-col space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg transition-colors"
          >
            Add More Coins
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-lg transition-colors"
          >
            Continue Watching
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          You can continue accessing content until your balance reaches zero.
        </p>
      </div>
    </div>
  );
};

export default LowBalanceWarning; 