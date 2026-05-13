'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export default function SignupProfilePage() {
  const { user, userProfile, refreshUserProfile, loading } = useFirebaseAuth();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    countryCode: 'KE',
    whatsapp: '',
    pin: ''
  });

  useEffect(() => {
    if (!loading && userProfile?.royalPayId) {
      router.push('/wallet');
    } else if (userProfile) {
      setFormData(prev => ({
        ...prev,
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        countryCode: userProfile.countryCode || 'KE',
        whatsapp: userProfile.whatsapp || '',
      }));
    }
  }, [userProfile, loading, router]);

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.firstName || !formData.lastName || !formData.whatsapp || formData.pin.length !== 4) {
      toast.error("Please complete all fields to generate your ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/user/setup-profile', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, finalize: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to finalize ID");

      await refreshUserProfile();
      toast.success("Identity Created Successfully!");
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F10] via-[#0F0F10]/90 to-[#0F0F10]/70 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-[#F97316] border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F10] via-[#0F0F10]/80 to-[#0F0F10]/60 flex items-center justify-center p-6 font-sans relative">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-[url('/your-brand-pattern.svg')] bg-cover bg-center opacity-10" />

      <div className="w-full max-w-[420px] space-y-12 relative z-10">
        
        {/* Header */}
        <header className="space-y-1 text-center">
          <h1 className="text-[42px] font-bold text-white leading-tight drop-shadow-md">
            Initialize Your
          </h1>
          <h2 className="text-[42px] font-bold text-[#F97316] leading-tight drop-shadow-md">
            Identity
          </h2>
          <p className="text-white/70 text-lg font-light pt-1">
            Secure your digital identity.
          </p>
        </header>

        <form onSubmit={handleFinalSubmit} className="space-y-10">
          
          {/* First Name */}
          <div className="space-y-3">
            <label className="text-white text-lg font-semibold ml-1">First Name</label>
            <input 
              placeholder="Your First Name" 
              className="w-full h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 text-white placeholder-white/50 text-lg outline-none focus:border-[#F97316]/70 transition-all shadow-lg"
              value={formData.firstName}
              onChange={e => setFormData({...formData, firstName: e.target.value})}
              required
            />
          </div>

          {/* Country & WhatsApp */}
          <div className="space-y-3">
            <label className="text-white text-lg font-semibold ml-1">Country & WhatsApp</label>
            <div className="flex gap-3">
              <select 
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 text-white w-[100px] text-center outline-none shadow-lg"
                value={formData.countryCode}
                onChange={e => setFormData({...formData, countryCode: e.target.value})}
              >
                <option value="KE">KE</option>
                <option value="UK">UK</option>
                <option value="US">US</option>
                <option value="SO">SO</option>
              </select>
              <input 
                placeholder="WhatsApp Number" 
                className="flex-1 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 text-white placeholder-white/50 text-lg outline-none focus:border-[#F97316]/70 transition-all shadow-lg"
                value={formData.whatsapp}
                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Security PIN */}
          <div className="space-y-3">
            <label className="text-white text-lg font-semibold ml-1">Security PIN</label>
            <input 
              type="password"
              maxLength={4}
              placeholder="● ● ● ●"
              className="w-full h-14 bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl px-5 text-white text-2xl text-center tracking-[1em] outline-none focus:border-[#F97316]/80 transition-all shadow-inner"
              onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})}
              required
            />
          </div>

          {/* Orange CTA Button */}
          <div className="pt-2">
            <Button 
              disabled={isSubmitting}
              type="submit"
              className="w-full h-14 bg-[#F97316] hover:bg-[#EA580C] rounded-2xl text-white font-bold text-lg transition-all shadow-xl active:scale-[0.98]"
            >
              {isSubmitting ? "Generating ID..." : "Continue to Contact"}
            </Button>
          </div>

          <p className="text-center text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium">
            Multi-Tenant Protocol Activated
          </p>
        </form>
      </div>
    </div>
  );
}
