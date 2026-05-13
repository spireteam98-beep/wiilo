"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebase';
import { FaHome, FaBookmark, FaSignOutAlt, FaCoins, FaUser, FaChevronDown, FaSearch, FaPlay, FaMusic } from 'react-icons/fa';
import { useBalance } from './BalanceProvider';
import Playerhls from './playerhls';
import AudioPlayer from './AudioPlayer';

interface StreamLayoutProps {
  children: React.ReactNode;
}

const StreamLayout: React.FC<StreamLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { userCoins } = useBalance();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('user');
      router.push('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000]">
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-gradient-to-b from-black/80 via-black/60 to-transparent hover:bg-black/80">
        <div className="max-w-[1800px] mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center">
                <Image
                  src="http://mohamedroyal.com/wp-content/uploads/2024/12/NETBEINS.png"
                  alt="RoyalTV"
                  width={120}
                  height={48}
                  className="object-contain"
                />
              </Link>
              
              {/* Primary Navigation */}
              <nav className="hidden md:flex items-center space-x-4">
                <Link href="/" className="text-sm text-white hover:text-gray-300 transition">
                  Home
                </Link>
                <Link href="/series" className="text-sm text-white hover:text-gray-300 transition">
                  Series
                </Link>
                <Link href="/movies" className="text-sm text-white hover:text-gray-300 transition">
                  Movies
                </Link>
                <Link href="/my-list" className="text-sm text-white hover:text-gray-300 transition">
                  My List
                </Link>
                <Link 
                  href="/player"
                  className="text-sm text-white hover:text-gray-300 transition flex items-center space-x-1"
                >
                  <FaPlay className="w-3 h-3" />
                  <span>Player</span>
                </Link>
                <button 
                  onClick={() => setShowAudioPlayer(!showAudioPlayer)}
                  className="text-sm text-white hover:text-gray-300 transition flex items-center space-x-1"
                >
                  <FaMusic className="w-3 h-3" />
                  <span>Audio Player</span>
                </button>
              </nav>
            </div>

            {/* Right Side Navigation */}
            <div className="flex items-center space-x-6">
              <button className="text-white hover:text-gray-300">
                <FaSearch className="w-5 h-5" />
              </button>
              
              {/* Balance Display */}
              <div className="hidden md:flex items-center space-x-1 text-[#E31E24]">
                <FaCoins className="w-4 h-4" />
                <span className="text-sm font-medium">{userCoins}</span>
              </div>

              {/* Account Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-2 group">
                  <div className="w-8 h-8 rounded bg-[#E31E24] flex items-center justify-center">
                    <FaUser className="text-white" />
                  </div>
                  <FaChevronDown className="w-4 h-4 text-white transition-transform duration-200 group-hover:rotate-180" />
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-[#000000]/95 border border-[#E31E24] rounded-md shadow-xl">
                  <Link 
                    href="/dashboard"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-black transition-colors"
                  >
                    <FaCoins className="text-[#E31E24]" />
                    <span>Balance: {userCoins} coins</span>
                  </Link>
                  
                  <Link 
                    href="/profile"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-black transition-colors"
                  >
                    <FaUser />
                    <span>Profile Settings</span>
                  </Link>
                  
                  <hr className="border-gray-800 my-2" />
                  
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-black transition-colors"
                  >
                    <FaSignOutAlt />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-20">
        {showPlayer ? (
          <Playerhls />
        ) : showAudioPlayer ? (
          <AudioPlayer />
        ) : (
          children
        )}
      </main>
    </div>
  );
};

export default StreamLayout; 