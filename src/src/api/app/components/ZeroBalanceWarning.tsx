"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { FaCoins } from 'react-icons/fa';

interface ZeroBalanceWarningProps {
  onClose: () => void;
}

const ZeroBalanceWarning: React.FC<ZeroBalanceWarningProps> = ({ onClose }) => {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] rounded-xl max-w-md w-full p-6 border border-red-500/20">
        <div className="bg-red-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <FaCoins className="text-3xl text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-4">
          Insufficient Balance
        </h2>
        
        <div className="bg-black/30 rounded-lg p-4 mb-6">
          <p className="text-gray-400 text-center">
            Current balance:
            <span className="block text-2xl font-bold text-red-500">
              0 coins
            </span>
          </p>
        </div>

        <p className="text-gray-400 text-center mb-6">
          You need 10 coins to unlock this content.
          <span className="block mt-2 text-sm">
            Already purchased content remains accessible in your library.
          </span>
        </p>

        <div className="flex flex-col space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg transition-colors"
          >
            Purchase Coins
          </button>
          
          <button
            onClick={() => router.push('/library')}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-lg transition-colors"
          >
            Go to My Library
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-transparent hover:bg-gray-900 text-gray-400 py-3 px-6 rounded-lg transition-colors border border-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZeroBalanceWarning; 