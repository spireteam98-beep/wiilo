"use client";

import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { setUserProfile } from '@/lib/user';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Nigeria', 'India', 'Brazil', 'Other'
];

export default function CompleteAccountPage() {
  const router = useRouter();
  const { user } = useFirebaseAuth();

  const [firstName, setFirstName] = useState(user?.displayName?.split(' ')[0] ?? '');
  const [lastName, setLastName] = useState(user?.displayName?.split(' ').slice(1).join(' ') ?? '');
  const [country, setCountry] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div>Please sign in to complete your account.</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName || !lastName || !country || !whatsapp) {
      setError('Please fill out all fields.');
      return;
    }
    setLoading(true);
    try {
      await setUserProfile(user.uid, {
        firstName,
        lastName,
        country,
        whatsapp,
        displayName: user.displayName ?? `${firstName} ${lastName}`,
        email: user.email,
        photoURL: user.photoURL,
      });
      router.push('/');
    } catch (err) {
      console.error('Failed to save profile', err);
      setError('Failed to save profile. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex justify-center items-center p-6">
      <div className="w-full max-w-lg p-8 rounded-3xl bg-gradient-to-tr from-[#0D0D0F] via-[#111113] to-[#0B0B0D] border border-white/5">
        <h1 className="text-2xl font-semibold text-white mb-4">Complete your account</h1>
        <p className="text-sm text-white/60 mb-6">We need a few more details to finish your signup.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="px-4 py-3 rounded-lg bg-[#0F0F10] text-white w-full" />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="px-4 py-3 rounded-lg bg-[#0F0F10] text-white w-full" />
          </div>

          <div>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-[#0F0F10] text-white">
              <option value="">Select your country</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp number (with country code)" className="w-full px-4 py-3 rounded-lg bg-[#0F0F10] text-white" />
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <div className="flex justify-end">
            <button type="submit" className="px-6 py-3 rounded-full bg-[#F97316] text-white font-semibold" disabled={loading}>{loading ? 'Saving...' : 'Complete signup'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
