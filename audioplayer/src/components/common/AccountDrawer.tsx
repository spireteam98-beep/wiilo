"use client";

import { Button } from '@/components/ui/button';
import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { createBusiness, isBusinessActive, listBusinesses } from '@/lib/business';
import { getUserProfile, setUserProfile } from '@/lib/user';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function AccountDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { user, signOutUser, refreshUserProfile } = useFirebaseAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Business creation states
  const [creatingBusiness, setCreatingBusiness] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessInfo, setBusinessInfo] = useState<any | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      setLoading(true);
      try {
      const doc = await getUserProfile(user.uid);
        setProfile(doc);
        setFirstName(doc?.firstName ?? (user.displayName?.split(' ')[0] ?? ''));
        setLastName(doc?.lastName ?? (user.displayName?.split(' ').slice(1).join(' ') ?? ''));
        setCountry(doc?.country ?? '');
        setWhatsapp(doc?.whatsapp ?? '');
        // Fetch any businesses owned by the user and set businessInfo (for approval status)
        try {
          const businesses = await listBusinesses(user);
          const b = businesses.find((bb) => bb.id === doc?.businessId) || null;
          setBusinessInfo(b);
        } catch (err) {
          // silently ignore business fetch errors
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, user]);

  // Helper to refresh business info on demand
  const refreshBusinessInfo = async () => {
    if (!user) return;
    try {
      const businesses = await listBusinesses(user);
      const b = businesses.find((bb) => bb.id === profile?.businessId) || null;
      setBusinessInfo(b);
    } catch (err) {
      console.error('Failed to refresh business info', err);
    }
  };

  // Poll while business is pending or rejected to get status updates.
  useEffect(() => {
    if (!user || !profile?.businessId) return;
    if (businessInfo && isBusinessActive(businessInfo)) return; // already active
    let iv: NodeJS.Timeout | null = null;
    try {
      iv = setInterval(async () => {
        await refreshBusinessInfo();
      }, 10_000);
    } catch (err) {
      console.error('Failed to start polling for business status', err);
    }
    return () => { if (iv) clearInterval(iv); };
  }, [user, profile?.businessId, businessInfo]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setUserProfile(user.uid, {
        firstName,
        lastName,
        country,
        whatsapp,
        displayName: `${firstName} ${lastName}`.trim(),
        email: user.email,
        photoURL: user.photoURL,
      });
      const p = await getUserProfile(user.uid);
      setProfile(p);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      onClose();
      router.push('/login');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4 md:mx-0 bg-[#0B0B0D] border border-white/5 rounded-3xl p-4 md:p-8 text-white shadow-xl mt-16 md:mt-0 max-h-[86vh] md:max-h-[80vh] overflow-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex shrink-0 overflow-hidden h-12 w-12 rounded-lg bg-purple-600/20">
              <img className="aspect-square h-full w-full p-1 rounded-lg" src={user?.photoURL ?? profile?.photoURL ?? ''} alt={user?.displayName ?? ''} />
            </div>
            <div>
              <div className="text-lg font-semibold">{profile?.displayName ?? user?.displayName ?? 'User'}</div>
              <div className="text-sm text-white/60">{profile?.email ?? user?.email}</div>
            </div>
          </div>
          <div>
            <button onClick={onClose} className="text-white/60 text-sm px-3 py-1.5 rounded-md hover:bg-white/5">Close</button>
          </div>
        </div>

        <div className="mt-6">
          {!profile && !editing && (
            <div className="rounded-lg p-4 bg-white/5 border border-white/5">
              <p className="text-sm text-white/70">You haven't finished your profile yet.</p>
              <div className="mt-3 flex gap-3">
                <Button onClick={() => setEditing(true)} className="bg-[#F97316]">Complete your profile</Button>
                <Button onClick={onClose} variant="ghost">Later</Button>
              </div>
            </div>
          )}

          {(profile && !editing) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="p-3 border border-white/5 rounded-lg">
                <div className="text-xs text-white/60">First name</div>
                <div className="mt-1 text-white">{profile.firstName ?? '-'}</div>
              </div>
              <div className="p-3 border border-white/5 rounded-lg">
                <div className="text-xs text-white/60">Last name</div>
                <div className="mt-1 text-white">{profile.lastName ?? '-'}</div>
              </div>
              <div className="p-3 border border-white/5 rounded-lg">
                <div className="text-xs text-white/60">Country</div>
                <div className="mt-1 text-white">{profile.country ?? '-'}</div>
              </div>
              <div className="p-3 border border-white/5 rounded-lg">
                <div className="text-xs text-white/60">WhatsApp</div>
                <div className="mt-1 text-white">{profile.whatsapp ?? '-'}</div>
              </div>
            </div>
          )}

          {editing && (
            <form className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSave(); }}>
              <input className="px-3 py-2 rounded-lg bg-[#0F0F10] text-white" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              <input className="px-3 py-2 rounded-lg bg-[#0F0F10] text-white" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              <input className="px-3 py-2 rounded-lg bg-[#0F0F10] text-white" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
              <input className="px-3 py-2 rounded-lg bg-[#0F0F10] text-white" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp number" />
              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#F97316]" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex flex-col gap-3">
              {profile?.businessId ? (
                <div className="flex gap-2">
                  {isBusinessActive(businessInfo) ? (
                    <Button onClick={() => router.push(`/businesses/${profile.businessId}`)} className="flex-1">Manage Business</Button>
                  ) : (
                    <div className="flex gap-2 flex-1">
                      <Button className="flex-1" disabled>Pending approval</Button>
                      <Button variant="ghost" onClick={() => refreshBusinessInfo()}>Refresh</Button>
                    </div>
                  )}
                  <Button onClick={() => router.push(`/businesses/${profile.businessId}/analytics`)} variant="ghost">Analytics</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={() => setCreatingBusiness(true)} className="flex-1">Create Business</Button>
                  <Button onClick={onClose} variant="ghost">Later</Button>
                </div>
              )}

              {creatingBusiness && (
                <form className="mt-3 grid grid-cols-1 gap-2" onSubmit={async (e: React.FormEvent) => {
                  e.preventDefault();
                  if (!user) return;
                  setLoading(true);
                  try {
                    await createBusiness(user, { name: businessName, description: businessDescription, type: businessType });
                    await refreshUserProfile();
                    const p = await getUserProfile(user.uid);
                    setProfile(p);
                    // Refresh business info after create
                    try {
                      const businesses = await listBusinesses(user);
                      const b = businesses.find((bb) => bb.id === p?.businessId) || null;
                      setBusinessInfo(b);
                    } catch (err) {
                      // ignore
                    }
                    setCreatingBusiness(false);
                    setBusinessName('');
                    setBusinessType('');
                    setBusinessDescription('');
                  } catch (err: any) {
                    console.error('Failed to create business', err);
                    alert(err.message || 'Error creating business');
                  } finally {
                    setLoading(false);
                  }
                }}>
                  <input className="px-3 py-2 rounded-lg bg-[#0F0F10] text-white" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Business name" required />
                  <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} required className="px-3 py-2 rounded-lg bg-[#0F0F10] text-white mt-2">
                    <option value="">Select business type</option>
                    <option value="restaurant">Restaurant Management System</option>
                    <option value="hotel">Hotel Management System</option>
                    <option value="airline">Airline Management System</option>
                  </select>
                  <textarea className="px-3 py-2 rounded-lg bg-[#0F0F10] text-white mt-2" value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} placeholder="Short description (optional)" />
                  <div className="flex gap-2 justify-end mt-2">
                    <Button variant="ghost" onClick={() => setCreatingBusiness(false)}>Cancel</Button>
                    <Button type="submit" className="bg-[#F97316]" disabled={loading || !businessType || !businessName}>{loading ? 'Creating...' : 'Create'}</Button>
                  </div>
                </form>
              )}

              <div className="mt-3">
                <Button onClick={handleSignOut} variant="ghost" className="w-full text-red-500 hover:bg-red-500/10">Sign Out</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
