// src/components/sounds/FeaturedAudioCard.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/contexts/PlayerContext';
import type { ContentItem } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon, Heart, Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toggleLikeContent, toggleSaveContent } from '@/lib/userInteractions';
import { useToast } from '@/hooks/use-toast';
// checkAndGrantContentAccess is now handled by PlayerContext

interface FeaturedAudioCardProps {
  audioItem: ContentItem;
}

const FeaturedAudioCard: FC<FeaturedAudioCardProps> = ({ audioItem }) => {
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

  const isLiked = userProfile?.likedContentIds?.includes(audioItem.id) ?? false;
  const isSaved = userProfile?.savedContentIds?.includes(audioItem.id) ?? false;

  return (
    <div
      className="bg-neutral-800/70 hover:bg-neutral-700/90 transition-colors rounded-md flex items-center space-x-3 cursor-pointer shadow-sm group"
      onClick={handlePlayPause}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePlayPause()}
      aria-label={`Play ${audioItem.title}`}
    >
      <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-l-md overflow-hidden">
        <Image
          src={audioItem.imageUrl || `https://placehold.co/100x100.png`}
          alt={audioItem.title || 'Featured audio cover'}
          layout="fill"
          objectFit="cover"
          data-ai-hint={audioItem.dataAiHint || "featured audio"}
        />
      </div>
      <div className="flex-grow py-2 pr-2 min-w-0 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {audioItem.title}
          </p>
          {audioItem.subtitle && (
            <p className="text-xs text-muted-foreground truncate">{audioItem.subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
           <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={handleLike}
            aria-label={isLiked ? "Unlike" : "Like"}
            disabled={authLoading || isUserProfileLoading}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary text-primary' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={handleSave}
            aria-label={isSaved ? "Unsave" : "Save to Library"}
            disabled={authLoading || isUserProfileLoading}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white bg-primary/80 hover:bg-primary rounded-full ml-2"
            aria-label={isThisTrackPlaying ? "Pause" : "Play"}
          >
            {isThisTrackPlaying ? (
              <PauseIcon className="h-5 w-5 text-black fill-black" />
            ) : (
              <PlayIcon className="h-5 w-5 text-black fill-black" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedAudioCard;
