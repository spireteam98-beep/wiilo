'use client';

import { useState } from 'react';

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  title?: string;
  description?: string;
}

export default function PinVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Enter Your Wallet PIN',
  description = 'Please enter your 4-digit PIN to confirm this transaction.',
}: PinVerificationModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
    setError(null);

    // Auto-submit when 4 digits are entered
    if (value.length === 4) {
      onSuccess(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('Please enter a valid 4-digit PIN.');
      return;
    }
    onSuccess(pin);
  };

  const handleClose = () => {
    setPin('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm rounded-[28px] bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] border border-white/10 p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-white/60 mb-6">{description}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PIN Input */}
          <div>
            <input
              type="password"
              inputMode="numeric"
              placeholder="••••"
              value={pin}
              onChange={handlePinChange}
              maxLength={4}
              className="w-full px-6 py-4 rounded-[24px] bg-white/5 text-white/70 placeholder-white/40 text-3xl tracking-widest text-center outline-none transition-all duration-200 border border-white/10 hover:border-white/20 focus:border-[#ff9b2a] font-mono"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="rounded-[16px] bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pin.length !== 4}
              className="flex-1 px-4 py-3 rounded-full bg-gradient-to-r from-[#ff9b2a] to-[#ff6816] text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50"
            >
              Verify
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/50 text-center">
            Your PIN is encrypted and stored securely. Never share it with anyone.
          </p>
        </div>
      </div>
    </div>
  );
}
