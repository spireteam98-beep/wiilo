// src/components/library/LibraryCard.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/contexts/PlayerContext'; // Track type might be imported from here or contentService
import type { ContentItem } from '@/services/contentService'; // Assuming this is the primary source of truth for item structure

interface LibraryCardProps {
  // Props derived from ContentItem that are relevant for display and playback
  id: string;
  title: string;
  subtitle?: string; // e.g., artist or podcast name
  imageUrl: string;
  audioSrc?: string; // Optional: card might represent non-playable content in some contexts
  dataAiHint: string;
  // Omitting any props related to like/save status or handlers
}

const LibraryCard: FC<LibraryCardProps> = ({
  id,
  title,
  subtitle,
  imageUrl,
  audioSrc,
  dataAiHint,
}) => {
  const { setCurrentTrack } = usePlayer();

  const handlePlay = () => {
    if (audioSrc) {
      setCurrentTrack({
        id,
        title,
        artist: subtitle, // Map subtitle to artist for player context
        imageUrl,
        audioSrc,
        dataAiHint,
      });
    } else {
      // Handle cases where there's no audioSrc, e.g., navigate to a detail page or do nothing
      console.log(`LibraryCard: No audioSrc for ${title}, cannot play.`);
    }
  };

  return (
    <div
      className="min-w-[160px] md:min-w-[180px] w-[160px] md:w-[180px] flex-shrink-0 snap-start group cursor-pointer"
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePlay()}
      aria-label={`Play ${title}`}
    >
      <div className="relative w-full aspect-square bg-neutral-800 overflow-hidden rounded-md shadow-md hover:shadow-lg transition-shadow">
        <Image
          src={imageUrl || `https://placehold.co/300x300.png`}
          alt={title || 'Library item cover'}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={dataAiHint || "item cover"}
        />
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground truncate">
          {subtitle}
        </p>
      )}
      {/* No Like or Save buttons here */}
    </div>
  );
};

export default LibraryCard;
