"use client";

import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";
import { HiHome } from "react-icons/hi";
import { BiSearch } from "react-icons/bi";
import { FaUserAlt } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { IoWalletOutline } from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/firebase";
// IMPORTANT: Make sure this is the correct path to your context
import { useFirebaseAuth } from '@/contexts/firebase-auth'; 
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

interface HeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ children, className }) => {
  const router = useRouter();
  const auth = useAuth();
  
  // 1. Get user and userProfile from your custom context
  const { user, userProfile, isUserProfileLoading } = useFirebaseAuth();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast.success("Logged out!");
      router.push("/");
    } catch (error) {
      toast.error("Failed to log out.");
    }
  };

  return (
    <div className={twMerge(`h-fit bg-gradient-to-b from-orange-900/50 p-6`, className)}>
      <div className="w-full mb-4 flex items-center justify-between">
        
        {/* Navigation Arrows */}
        <div className="hidden md:flex gap-x-2 items-center">
          <button onClick={() => router.back()} className="rounded-full bg-black flex items-center justify-center hover:opacity-75 transition">
            <RxCaretLeft size={35} className="text-white" />
          </button>
          <button onClick={() => router.forward()} className="rounded-full bg-black flex items-center justify-center hover:opacity-75 transition">
            <RxCaretRight size={35} className="text-white" />
          </button>
        </div>

        {/* Mobile Icons */}
        <div className="flex md:hidden gap-x-2 items-center">
          <button onClick={() => router.push('/')} className="rounded-full p-2 bg-white flex items-center justify-center hover:opacity-75 transition">
            <HiHome size={20} className="text-black" />
          </button>
          <button onClick={() => router.push('/search')} className="rounded-full p-2 bg-white flex items-center justify-center hover:opacity-75 transition">
            <BiSearch size={20} className="text-black" />
          </button>
        </div>

        {/* Auth & Wallet ID Section */}
        <div className="flex items-center gap-x-4">
          {user ? (
            <div className="flex gap-x-2 sm:gap-x-4 items-center">
              
              {/* WALLET ID DISPLAY - Removed hidden class */}
              {userProfile?.royalPayId ? (
                <div className="flex items-center gap-x-2 bg-black/40 border border-[#F97316]/30 px-3 py-1.5 rounded-full">
                  <IoWalletOutline className="text-[#F97316]" size={16} />
                  <span className="text-[9px] sm:text-[10px] font-mono text-white tracking-tighter">
                    {userProfile.royalPayId}
                  </span>
                </div>
              ) : isUserProfileLoading ? (
                <div className="text-[10px] text-white/40 animate-pulse">Syncing ID...</div>
              ) : null}

              <Button onClick={handleLogout} className="bg-white px-4 sm:px-6 py-2 text-black text-xs sm:text-sm font-bold">
                Logout
              </Button>
              
              <Button onClick={() => router.push("/account")} className="bg-white p-2 rounded-full">
                <FaUserAlt className="text-black" size={14} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-x-4">
              <Button onClick={() => router.push('/signup')} className="bg-transparent text-neutral-300 font-medium hover:text-white transition">
                Sign up
              </Button>
              <Button onClick={() => router.push('/login')} className="bg-white px-6 py-2 text-black font-bold">
                Log in
              </Button>
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};