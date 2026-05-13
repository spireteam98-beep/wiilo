// src/components/sounds/LikedSongsHeader.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Play, PlusCircle, ArrowDownToLine, MoreHorizontal } from 'lucide-react';
import type { ContentItem } from '@/services/contentService';
import { useAuth } from '@/contexts/AuthContext';

interface LikedSongsHeaderProps {
  likedItems: ContentItem[];
  onPlayAll: () => void; // Plays the first track or shuffles
}

const LikedSongsHeader: FC<LikedSongsHeaderProps> = ({ likedItems, onPlayAll }) => {
  const { userProfile } = useAuth();
  const itemCount = likedItems.length;
  const firstItemImageUrl = itemCount > 0 && likedItems[0].imageUrl ? likedItems[0].imageUrl : "https://placehold.co/300x300.png";
  const dataAiHintForImage = itemCount > 0 && likedItems[0].dataAiHint ? likedItems[0].dataAiHint : "music playlist";

  let subtitle = `${itemCount} song${itemCount !== 1 ? 's' : ''}`;
  if (itemCount > 0) {
    const uniqueArtists = Array.from(new Set(likedItems.slice(0, 5).map(item => item.subtitle).filter(Boolean)));
    if (uniqueArtists.length > 0) {
      subtitle += ` by ${uniqueArtists.slice(0, 3).join(', ')}${uniqueArtists.length > 3 ? ' and more' : ''}`;
    }
  }

  return (
    <div className="relative w-full pt-8 pb-6 text-white bg-gradient-to-b from-neutral-800 via-neutral-900 to-black">
      {/* Removed container mx-auto, kept padding px-4 md:px-6 */}
      <div className="px-4 md:px-6 flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
        <div className="relative w-48 h-48 md:w-56 md:h-56 flex-shrink-0 shadow-2xl rounded-md overflow-hidden">
          <Image
            src={firstItemImageUrl}
            alt="Liked Songs Artwork"
            layout="fill"
            objectFit="cover"
            data-ai-hint={dataAiHintForImage}
            priority
          />
        </div>
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <p className="text-xs uppercase font-semibold tracking-wider">Playlist</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold my-2 leading-tight">Liked Songs</h1>
          <p className="text-sm text-neutral-300 mb-2">{userProfile?.name || 'Your favorite tracks'}</p>
          <p className="text-xs text-neutral-400">{subtitle}</p>
        </div>
      </div>
      {/* Removed container mx-auto, kept padding px-4 md:px-6 */}
      <div className="px-4 md:px-6 mt-6 flex items-center space-x-4">
        <Button
          onClick={onPlayAll}
          className="bg-primary text-primary-foreground rounded-full p-0 w-14 h-14 hover:bg-primary/90 shadow-lg"
          aria-label="Play Liked Songs"
        >
          <Play className="h-7 w-7 fill-current" />
        </Button>
        <Button variant="ghost" size="icon" className="text-neutral-300 hover:text-white" aria-label="Add to playlist (placeholder)">
          <PlusCircle className="h-7 w-7" />
        </Button>
        <Button variant="ghost" size="icon" className="text-neutral-300 hover:text-white" aria-label="Download (placeholder)">
          <ArrowDownToLine className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-neutral-300 hover:text-white" aria-label="More options (placeholder)">
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default LikedSongsHeader;
