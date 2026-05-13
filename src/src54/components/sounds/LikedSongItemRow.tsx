// src/components/sounds/LikedSongItemRow.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Play, ListMusic } from 'lucide-react'; // ListMusic as playing indicator
import type { ContentItem } from '@/services/contentService';

interface LikedSongItemRowProps {
  track: ContentItem;
  onPlay: () => void;
  isCurrentPlaying: boolean; // Is this track the one currently loaded in the player?
  isPlayerActuallyPlaying: boolean; // Is the player instance actively playing audio?
  itemIndex: number;
}

const LikedSongItemRow: FC<LikedSongItemRowProps> = ({ track, onPlay, isCurrentPlaying, isPlayerActuallyPlaying, itemIndex }) => {
  const isThisTrackActuallyPlaying = isCurrentPlaying && isPlayerActuallyPlaying;

  return (
    <div
      className="flex items-center space-x-4 p-2 hover:bg-neutral-800/60 rounded-md cursor-pointer group"
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPlay()}
      aria-label={`Play ${track.title}`}
    >
      <div className="text-sm text-neutral-400 w-6 text-right group-hover:hidden">
        {isThisTrackActuallyPlaying ? <ListMusic className="h-5 w-5 text-primary" /> : `${itemIndex + 1}`}
      </div>
      <div className="w-6 text-right group-hover:block hidden">
         <Play className="h-5 w-5 text-white" />
      </div>

      <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
        <Image
          src={track.imageUrl || `https://placehold.co/100x100.png`}
          alt={track.title || 'Track artwork'}
          layout="fill"
          objectFit="cover"
          data-ai-hint={track.dataAiHint || "track artwork"}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isThisTrackActuallyPlaying ? 'text-primary' : 'text-foreground'}`}>
          {track.title}
        </p>
        {track.subtitle && (
          <p className="text-sm text-neutral-400 truncate group-hover:text-neutral-200">
            {track.subtitle}
          </p>
        )}
      </div>
      <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => {e.stopPropagation(); console.log("More options for:", track.title);}}>
        <MoreHorizontal className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default LikedSongItemRow;
