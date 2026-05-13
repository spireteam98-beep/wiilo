
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, X, Delete, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Custom PIN Slot component
const PinSlot = ({ filled }: { filled: boolean }) => (
  <div className={`h-20 w-20 rounded-2xl flex items-center justify-center text-3xl font-bold ${
    filled ? 'bg-[#2A2A2A]' : 'bg-[#1E1E1E]'
  }`}>
    {filled && <div className="w-3 h-3 rounded-full bg-white" />}
  </div>
);

// Keypad Button with underline
const KeypadButton = ({ value, onClick }: { value: string, onClick: (val: string) => void }) => (
  <button
    onClick={() => onClick(value)}
    className="flex flex-col items-center justify-center py-4"
  >
    <span className="text-3xl font-light text-white mb-3">{value}</span>
    <div className="w-16 h-[1px] bg-[#333333]" />
  </button>
);

// Success Screen Component
const SuccessScreen = ({ onDone }: { onDone: () => void }) => (
  <div className="min-h-screen bg-black flex justify-center">
    <div className="w-full max-w-md relative bg-[#0A0A0A] min-h-screen flex flex-col">
      {/* Header (dimmed) */}
      <header className="flex items-center justify-between px-4 py-4 opacity-40">
        <div className="p-2">
          <ChevronLeft className="w-6 h-6 text-white/60" />
        </div>
        <span className="text-white/60 text-sm">2 of 2</span>
        <span className="text-[#F97316] text-sm font-medium">Cancel</span>
      </header>

      {/* Title (dimmed) */}
      <div className="px-6 mb-4 opacity-40">
        <h1 className="text-2xl font-bold text-white/60">Swap Crypto</h1>
      </div>

      {/* Amount Card (dimmed) */}
      <div className="px-4 mb-6 opacity-40">
        <div className="bg-[#1A1A1A] rounded-2xl p-6 text-center">
          <p className="text-white/60 text-sm mb-2">You will receive</p>
          <p className="text-white text-2xl font-bold">0.000034 BTC</p>
        </div>
      </div>

      {/* Success Card */}
      <div className="flex-1 bg-[#121212] rounded-t-[32px] px-6 pt-12 pb-8 flex flex-col items-center justify-center">
        {/* Success Icon */}
        <div className="w-32 h-32 rounded-full bg-[#F97316] flex items-center justify-center mb-8">
          <Check className="w-16 h-16 text-white" strokeWidth={3} />
        </div>

        {/* Success Text */}
        <h2 className="text-3xl font-semibold text-white mb-4">Successful</h2>
        <p className="text-[#808080] text-center mb-12">
          Your transaction was completed successfully.
        </p>

        {/* Done Button */}
        <button 
          onClick={onDone}
          className="w-full max-w-sm bg-[#F97316] hover:bg-[#EA580C] h-14 text-base font-bold text-white rounded-full"
        >
          Done
        </button>
      </div>
    </div>
  </div>
);

export default function ConfirmTransferPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleKeypadClick = (value: string) => {
    if (pin.length < 4) {
      const newPin = pin + value;
      setPin(newPin);
      
      // Auto-submit when 4 digits entered
      if (newPin.length === 4) {
        setTimeout(() => {
          setShowSuccess(true);
        }, 300);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClose = () => {
    router.back();
  };

  const handleDone = () => {
    router.push('/');
  };

  const handleConfirm = () => {
    if (pin.length < 4) {
      toast({
        variant: 'destructive',
        title: 'Incomplete PIN',
        description: 'Please enter all 4 digits.',
      });
      return;
    }
    setShowSuccess(true);
  };

  // Show success screen
  if (showSuccess) {
    return <SuccessScreen onDone={handleDone} />;
  }

  // Keypad layout matching reference: 4 columns
  const keypadRows = [
    ['4', '2', '3', '8'],
    ['7', '5', '0', '9'],
    ['6', '1', 'backspace'],
  ];

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md relative bg-[#0A0A0A] min-h-screen flex flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4">
          <button onClick={() => router.back()} className="p-2">
            <ChevronLeft className="w-6 h-6 text-white/60" />
          </button>
          <span className="text-white/60 text-sm">2 of 2</span>
          <button onClick={handleClose} className="text-[#F97316] text-sm font-medium">
            Cancel
          </button>
        </header>

        {/* Title */}
        <div className="px-6 mb-4">
          <h1 className="text-2xl font-bold text-white/60">Confirm Order</h1>
        </div>

        {/* PIN Card */}
        <div className="flex-1 bg-[#121212] rounded-t-[32px] px-6 pt-8 pb-6 flex flex-col">
          
          {/* Card Header */}
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Enter Transaction PIN</h2>
            <button onClick={handleClose} className="p-1">
              <X className="w-6 h-6 text-white/60" />
            </button>
          </div>

          {/* Subtitle */}
          <p className="text-[#808080] text-sm mb-6">
            Enter your 4 Digit Transaction PIN to confirm Transaction
          </p>

          {/* Label */}
          <p className="text-[#606060] text-sm mb-4">Transaction PIN</p>

          {/* PIN Display */}
          <div className="flex justify-between gap-3 mb-8">
            {[0, 1, 2, 3].map((index) => (
              <PinSlot key={index} filled={pin.length > index} />
            ))}
          </div>

          {/* Keypad - 4 columns */}
          <div className="flex-1">
            {keypadRows.map((row, rowIndex) => (
              <div 
                key={rowIndex} 
                className={`grid gap-2 mb-2 ${
                  rowIndex === 2 ? 'grid-cols-3 max-w-[75%] mx-auto' : 'grid-cols-4'
                }`}
              >
                {row.map((key, keyIndex) => (
                  key === 'backspace' ? (
                    <button
                      key={keyIndex}
                      onClick={handleBackspace}
                      className="flex flex-col items-center justify-center py-4"
                    >
                      <Delete className="w-6 h-6 text-white/60 mb-3" />
                      <div className="w-16 h-[1px] bg-[#333333]" />
                    </button>
                  ) : (
                    <KeypadButton 
                      key={keyIndex} 
                      value={key} 
                      onClick={handleKeypadClick} 
                    />
                  )
                ))}
              </div>
            ))}
          </div>

          {/* Confirm Button */}
          <button 
            onClick={handleConfirm}
            className="w-full max-w-sm mx-auto bg-[#F97316] hover:bg-[#EA580C] h-14 text-base font-bold text-white rounded-full mt-auto"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
