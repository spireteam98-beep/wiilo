"use client";
import { Bell, Camera } from "lucide-react";
import { useEffect, useState } from 'react';
import { getUserProfile } from '@/lib/user';
import AccountDrawer from './AccountDrawer';
import { Button } from "@/components/ui/button";
import { user as placeholderUser } from "@/lib/data";
import { useFirebaseAuth } from '@/contexts/firebase-auth';

export default function Header() {
  const { user } = useFirebaseAuth();
  const userInitial = (user?.displayName ?? placeholderUser.name).charAt(0).toUpperCase();
  const [open, setOpen] = useState(false);
  const [profileMissing, setProfileMissing] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfileMissing(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const doc = await getUserProfile(user.uid);
        if (!mounted) return;
        setProfileMissing(!doc);
      } catch (err) {
        console.error('profile check failed', err);
      }
    })();

    return () => { mounted = false; };
  }, [user]);

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* If signed-in and profile incomplete, show quick CTA */}
        {user && profileMissing && (
          <button onClick={() => setOpen(true)} className="text-sm px-3 py-1 rounded-full bg-[#F97316] text-black font-semibold mr-2">Complete profile</button>
        )}
        <button onClick={() => setOpen(true)} aria-label="Open account" className="relative flex shrink-0 overflow-hidden h-10 w-10 rounded-lg bg-purple-600/20">
          <img className="aspect-square h-full w-full p-1 rounded-lg" alt={user?.displayName ?? placeholderUser.name} src={user?.photoURL ?? placeholderUser.avatarUrl} />
        </button>
        <AccountDrawer open={open} onClose={() => setOpen(false)} />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Camera className="h-6 w-6" />
          <span className="sr-only">Camera</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-6 w-6" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  );
  useEffect(() => {
    if (!user) {
      setProfileMissing(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const doc = await getUserProfile(user.uid);
        if (!mounted) return;
        setProfileMissing(!doc);
      } catch (err) {
        console.error('profile check failed', err);
      }
    })();

    return () => { mounted = false; };
  }, [user]);
}
