// src/components/sounds/AudioCard.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/contexts/PlayerContext';
import type { ContentItem } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { Heart, Bookmark, PlayIcon, PauseIcon } from 'lucide-react'; // Removed ListMusic
import { useAuth } from '@/contexts/AuthContext';
import { toggleLikeContent, toggleSaveContent } from '@/lib/userInteractions';
import { useToast } from '@/hooks/use-toast';
// checkAndGrantContentAccess is handled by PlayerContext now

interface AudioCardProps {
  audioItem: ContentItem;
}

const AudioCard: FC<AudioCardProps> = ({ audioItem }) => {
  const { user, userProfile, refreshUserProfile, loading: authLoading, isUserProfileLoading } = useAuth();
  const { setCurrentTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const { toast } = useToast();

  const isCurrentTrack = currentTrack?.id === audioItem.id;
  const isThisTrackPlaying = isCurrentTrack && isPlaying;

  const handlePlayPause = async () => {
    // Access check is now handled by PlayerContext when setCurrentTrack is called
    if (isCurrentTrack) {
      togglePlayPause();
    } else {
      if (!audioItem.audioSrc) {
        toast({ title: "Audio Unavailable", description: "This item does not have an audio source.", variant: "destructive" });
        return;
      }
      setCurrentTrack({ // This will trigger access check in PlayerContext
        id: audioItem.id,
        title: audioItem.title,
        artist: audioItem.subtitle,
        imageUrl: audioItem.imageUrl,
        audioSrc: audioItem.audioSrc,
        dataAiHint: audioItem.dataAiHint,
      });
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!user || !userProfile) {
      toast({ title: "Login Required", description: "Please login to like content.", variant: "destructive" });
      return;
    }
    try {
      const wasLiked = userProfile.likedContentIds?.includes(audioItem.id);
      await toggleLikeContent(user.uid, audioItem.id);
      if (refreshUserProfile) await refreshUserProfile();
      toast({ title: "Success", description: wasLiked ? "Removed from Liked Songs." : "Added to Liked Songs." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update like status.", variant: "destructive" });
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!user || !userProfile) {
      toast({ title: "Login Required", description: "Please login to save content.", variant: "destructive" });
      return;
    }
    try {
      const wasSaved = userProfile.savedContentIds?.includes(audioItem.id);
      await toggleSaveContent(user.uid, audioItem.id);
      if (refreshUserProfile) await refreshUserProfile();
      toast({ title: "Success", description: wasSaved ? "Removed from My Library." : "Added to My Library." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update save status.", variant: "destructive" });
    }
  };

  // Determine liked and saved status, handling potential undefined userProfile or arrays
  const isLiked = userProfile?.likedContentIds?.includes(audioItem.id) ?? false;
  const isSaved = userProfile?.savedContentIds?.includes(audioItem.id) ?? false;

  return (
    <div
      className="min-w-[160px] md:min-w-[180px] w-[160px] md:w-[180px] flex-shrink-0 snap-start group cursor-pointer bg-card p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow"
      onClick={handlePlayPause}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePlayPause()}
      aria-label={`Play ${audioItem.title}`}
    >
      <div className="relative w-full aspect-square bg-neutral-800 overflow-hidden rounded-md mb-2">
        <Image
          src={audioItem.imageUrl || `https://placehold.co/300x300.png`}
          alt={audioItem.title || 'Audio item cover'}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={audioItem.dataAiHint || "audio cover"}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          {isThisTrackPlaying ? (
            <PauseIcon className="h-10 w-10 text-white" />
          ) : (
            <PlayIcon className="h-10 w-10 text-white" />
          )}
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
        {audioItem.title}
      </p>
      {audioItem.subtitle && (
        <p className="text-xs text-muted-foreground truncate">
          {audioItem.subtitle}
        </p>
      )}
      <div className="mt-2 flex justify-end space-x-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary"
          onClick={handleLike}
          aria-label={isLiked ? "Unlike" : "Like"}
          disabled={authLoading || isUserProfileLoading} // Disable while profile loads
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary text-primary' : ''}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary"
          onClick={handleSave}
          aria-label={isSaved ? "Unsave" : "Save to Library"}
          disabled={authLoading || isUserProfileLoading} // Disable while profile loads
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default AudioCard;
