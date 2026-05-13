// src/components/library/TopListItemCard.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { MoreHorizontal } from 'lucide-react'; // Keep for potential future "more options"
import { usePlayer } from '@/contexts/PlayerContext';
import type { ContentItem } from '@/services/contentService';

interface TopListItemCardProps {
  // Props derived from ContentItem relevant for this card
  id: string;
  title: string;
  subtitle?: string; // Typically artist for this card
  imageUrl: string;
  audioSrc?: string;
  dataAiHint: string;
  hasMoreOptions?: boolean; // Example: if you want a '...' button
}

const TopListItemCard: FC<TopListItemCardProps> = ({
  id,
  title,
  subtitle,
  imageUrl,
  audioSrc,
  dataAiHint,
  hasMoreOptions,
}) => {
  const { setCurrentTrack } = usePlayer();

  const handlePlay = () => {
    if (audioSrc) {
      setCurrentTrack({
        id,
        title,
        artist: subtitle,
        imageUrl,
        audioSrc,
        dataAiHint,
      });
    } else {
      console.log(`TopListItemCard: No audioSrc for ${title}, cannot play.`);
    }
  };

  return (
    <div
      className="bg-neutral-800 hover:bg-neutral-700/80 transition-colors rounded-md flex items-center space-x-3 cursor-pointer shadow-sm group"
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePlay()}
      aria-label={`Play ${title}`}
    >
      <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-l-md overflow-hidden">
        <Image
          src={imageUrl || `https://placehold.co/100x100.png`}
          alt={title || 'Top list item cover'}
          layout="fill"
          objectFit="cover"
          data-ai-hint={dataAiHint || "item thumbnail"}
        />
      </div>
      <div className="flex-grow py-2 pr-2 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {hasMoreOptions && ( // Optional: "More" button, not like/save
        <button
          className="p-2 text-muted-foreground hover:text-primary mr-1"
          onClick={(e) => {
            e.stopPropagation(); // Prevent playing when clicking more options
            console.log('More options clicked for:', title);
            // Implement dropdown or other action here if needed
          }}
          aria-label="More options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      )}
      {/* No Like or Save buttons here */}
    </div>
  );
};

export default TopListItemCard;
