
// src/components/library/PlayerBar.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { Play, Pause, Heart, Bookmark, LaptopMinimal } from 'lucide-react'; // Added Bookmark, kept LaptopMinimal for now, can be removed if not used
import { usePlayer } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { toggleLikeContent, toggleSaveContent } from '@/lib/userInteractions';

const PlayerBar: FC = () => {
  const { currentTrack, isPlaying, togglePlayPause, setIsPlayerOpen } = usePlayer();
  const { user, userProfile, refreshUserProfile, loading: authLoading, isUserProfileLoading } = useAuth();
  const { toast } = useToast();

  if (!currentTrack) {
    return null;
  }

  const handlePlayerBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setIsPlayerOpen(true);
  };

  const isLiked = userProfile?.likedContentIds?.includes(currentTrack.id) ?? false;
  const isSaved = userProfile?.savedContentIds?.includes(currentTrack.id) ?? false;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !userProfile || !currentTrack) {
      toast({ title: "Authentication Required", description: "Please sign in to like content.", variant: "destructive" });
      return;
    }
    try {
      await toggleLikeContent(user.uid, currentTrack.id);
      if (refreshUserProfile) await refreshUserProfile();
      toast({ title: "Success", description: isLiked ? "Removed from Liked Songs" : "Added to Liked Songs" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update like status.", variant: "destructive" });
    }
  };

  const handleSaveToLibrary = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !userProfile || !currentTrack) {
      toast({ title: "Authentication Required", description: "Please sign in to save content.", variant: "destructive" });
      return;
    }
    try {
      await toggleSaveContent(user.uid, currentTrack.id);
      if (refreshUserProfile) await refreshUserProfile();
      toast({ title: "Success", description: isSaved ? "Removed from My Library" : "Added to My Library" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update save status.", variant: "destructive" });
    }
  };

  const isInteractionDisabled = authLoading || isUserProfileLoading;

  return (
    <div 
      className="fixed bottom-[60px] md:bottom-0 left-0 right-0 bg-[#B92929] text-white p-3 flex items-center justify-between shadow-lg md:mr-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)] group-data-[collapsible=icon]:md:mr-0 cursor-pointer"
      onClick={handlePlayerBarClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handlePlayerBarClick(e)}
      aria-label="Open audio player"
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="relative w-10 h-10 rounded-sm overflow-hidden flex-shrink-0">
          <Image
            src={currentTrack.imageUrl || `https://placehold.co/100x100.png`}
            alt={`${currentTrack.title} album art`}
            layout="fill"
            objectFit="cover"
            data-ai-hint={currentTrack.dataAiHint || "album art"}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{currentTrack.title}</p>
          {currentTrack.artist && <p className="text-xs text-neutral-300 truncate">{currentTrack.artist}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3 ml-2">
        <button 
          className={`p-1 text-white hover:text-neutral-300 transition-colors ${isLiked ? 'text-primary' : ''}`} 
          aria-label={isLiked ? "Unlike song" : "Like song"} 
          onClick={handleLike}
          disabled={isInteractionDisabled}
        >
           <Heart className={`w-5 h-5 ${isLiked ? 'fill-primary text-primary' : ''}`} />
        </button>
        <button 
          className={`p-1 text-white hover:text-neutral-300 transition-colors ${isSaved ? 'text-primary' : ''}`} 
          aria-label={isSaved ? "Remove from Library" : "Save to Library"} 
          onClick={handleSaveToLibrary}
          disabled={isInteractionDisabled}
        >
           <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-primary text-primary' : ''}`} />
        </button>
        {/* Example: Keeping a devices button, can be removed if not needed */}
        {/* <button className="p-1 text-white hover:text-neutral-300 transition-colors hidden md:block" aria-label="Devices available" onClick={(e) => e.stopPropagation()}>
          <LaptopMinimal className="w-5 h-5" />
        </button> */}
        <button 
          className="p-1 text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors" 
          aria-label={isPlaying ? "Pause song" : "Play song"}
          onClick={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
        </button>
      </div>
    </div>
  );
};

export default PlayerBar;
