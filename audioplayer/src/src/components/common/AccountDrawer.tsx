"use client";

import React, { useEffect, useState } from 'react';
import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { getUserProfile, setUserProfile } from '@/lib/user';
import { Button } from '@/components/ui/button';

export default function AccountDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useFirebaseAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
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
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    })();
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setUserProfile(user.uid, { firstName, lastName, country, whatsapp, displayName: `${firstName} ${lastName}`.trim(), email: user.email, photoURL: user.photoURL });
      const p = await getUserProfile(user.uid);
      setProfile(p);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4 md:mx-0 bg-[#0B0B0D] border border-white/5 rounded-3xl p-6 md:p-8 text-white shadow-xl">
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
            <form className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
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
        </div>
      </div>
    </div>
  );
}
