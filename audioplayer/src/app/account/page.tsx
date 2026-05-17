"use client";

import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { UserProfile, setUserProfile } from '@/lib/user';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function AccountPage() {
  const { user, userProfile, refreshUserProfile, loading: authLoading } = useFirebaseAuth();
  
  // Local state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    country: '',
    whatsapp: ''
  });

  // Sync local form with userProfile when it loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        country: userProfile.country || '',
        whatsapp: userProfile.whatsapp || ''
      });
      // If profile is incomplete, force edit mode
      if (!userProfile.royalPayId) {
        setIsEditing(true);
      }
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const idToken = await user.getIdToken();
      
      // 1. Call your new API to save names AND generate the RoyalPay ID
      const res = await fetch('/api/user/setup-profile', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      // 2. Refresh the context to get the new RoyalPay ID
      await refreshUserProfile();
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="mb-4">Please sign in to view your account.</p>
          <Link href="/login" className="text-orange-400 underline font-bold">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-10">
      <div className="max-w-3xl mx-auto bg-[#0B0B0C] border border-white/5 rounded-[2.5rem] p-6 md:p-12 text-white shadow-2xl">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-center gap-6 mb-10 pb-10 border-b border-white/5">
          <div className="relative shrink-0 h-24 w-24 rounded-2xl bg-[#F97316]/10 border border-[#F97316]/20 p-1">
            <img 
              className="aspect-square h-full w-full rounded-xl object-cover" 
              src={user.photoURL ?? '/avatar-placeholder.png'} 
              alt="Avatar" 
            />
          </div>
          <div className="text-center md:text-left flex-grow">
            <h1 className="text-2xl font-bold">{userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : user.displayName ?? 'User'}</h1>
            <p className="text-white/40 text-sm mb-4">{user.email}</p>
            
            {/* RoyalPay Wallet ID Badge */}
            {userProfile?.royalPayId ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F97316]/10 border border-[#F97316]/20 rounded-full">
                <span className="text-[10px] uppercase tracking-widest text-[#F97316] font-black">Wallet ID:</span>
                <span className="text-sm font-mono font-bold text-white">{userProfile.royalPayId}</span>
              </div>
            ) : (
              <div className="text-xs text-orange-400 animate-pulse font-bold uppercase tracking-tighter">
                ⚠️ ID Generation Required
              </div>
            )}
          </div>
          
          {!isEditing && userProfile?.royalPayId && (
            <Button 
              onClick={() => setIsEditing(true)}
              variant="outline" 
              className="rounded-full border-white/10 hover:bg-white/5"
            >
              Edit Profile
            </Button>
          )}
        </header>

        {/* Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase text-white/40 font-bold tracking-widest ml-1">First Name</label>
            {isEditing ? (
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#F97316] transition-all"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
            ) : (
              <div className="px-4 py-3 bg-white/[0.02] border border-transparent rounded-xl text-white/90">{userProfile?.firstName ?? '-'}</div>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase text-white/40 font-bold tracking-widest ml-1">Last Name</label>
            {isEditing ? (
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#F97316] transition-all"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            ) : (
              <div className="px-4 py-3 bg-white/[0.02] border border-transparent rounded-xl text-white/90">{userProfile?.lastName ?? '-'}</div>
            )}
          </div>

          {/* Country */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase text-white/40 font-bold tracking-widest ml-1">Country</label>
            {isEditing ? (
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#F97316] transition-all"
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
              />
            ) : (
              <div className="px-4 py-3 bg-white/[0.02] border border-transparent rounded-xl text-white/90">{userProfile?.country ?? '-'}</div>
            )}
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase text-white/40 font-bold tracking-widest ml-1">WhatsApp Number</label>
            {isEditing ? (
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#F97316] transition-all"
                placeholder="+252..."
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              />
            ) : (
              <div className="px-4 py-3 bg-white/[0.02] border border-transparent rounded-xl text-white/90">{userProfile?.whatsapp ?? '-'}</div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        {isEditing && (
          <div className="mt-12 flex flex-col md:flex-row gap-4">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="flex-grow bg-[#F97316] hover:bg-orange-600 text-white font-bold h-14 rounded-2xl shadow-lg shadow-orange-900/20"
            >
              {saving ? "Generating ID & Saving..." : (userProfile?.royalPayId ? "Save Changes" : "Complete Setup & Generate ID")}
            </Button>
            {userProfile?.royalPayId && (
              <Button 
                variant="ghost" 
                onClick={() => setIsEditing(false)}
                className="h-14 rounded-2xl text-white/40 hover:text-white"
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}