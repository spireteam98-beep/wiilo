// src/components/library/LibraryContent.tsx
'use client';

import type { FC } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import LibraryCard from './LibraryCard';
import TopListItemCard from './TopListItemCard';

// Placeholder audio source. Replace with actual audio URLs.
const SAMPLE_AUDIO_SRC_1 = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
const SAMPLE_AUDIO_SRC_2 = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
const SAMPLE_AUDIO_SRC_3 = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3";


interface CardItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  audioSrc: string;
  dataAiHint: string;
}

interface TopListItemData {
  id: string;
  title: string;
  artist?: string;
  imageUrl: string;
  audioSrc: string;
  dataAiHint: string;
  hasMoreOptions?: boolean;
}

interface SectionProps {
  title: string;
  items: CardItem[];
  itemType: 'default'; 
}

const LibrarySection: FC<SectionProps> = ({ title, items }) => {
  return (
    <section className="py-4">
      <h2 className="text-2xl font-bold text-foreground mb-3 px-4 md:px-0">{title}</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 pb-4 px-4 md:px-0">
          {items.map((item) => (
            <LibraryCard key={item.id} {...item} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};


const LibraryContent: FC = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Music', 'Podcasts'];

  const topListItems: TopListItemData[] = [
    { id: 'top1', title: 'POWER Tv Series', artist: 'Soundtrack', imageUrl: 'https://picsum.photos/seed/power/100/100', audioSrc: SAMPLE_AUDIO_SRC_1, dataAiHint: 'drama series', hasMoreOptions: true },
    { id: 'top2', title: 'Blinding Lights', artist: 'The Weeknd', imageUrl: 'https://picsum.photos/seed/theweeknd/100/100', audioSrc: SAMPLE_AUDIO_SRC_2, dataAiHint: 'pop artist' },
    { id: 'top3', title: 'On The Low', artist: 'Burna Boy', imageUrl: 'https://picsum.photos/seed/burnaboy/100/100', audioSrc: SAMPLE_AUDIO_SRC_3, dataAiHint: 'afrobeats mix' },
    { id: 'top4', title: 'Ocean Drive', artist: 'Duke Dumont', imageUrl: 'https://picsum.photos/seed/bridgetblue/100/100', audioSrc: SAMPLE_AUDIO_SRC_1, dataAiHint: 'electronic music' },
    { id: 'top5', title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', imageUrl: 'https://picsum.photos/seed/starboyalbum/100/100', audioSrc: SAMPLE_AUDIO_SRC_2, dataAiHint: 'rnb album' },
    { id: 'top6', title: 'Daily Mix 1', artist: 'Various Artists', imageUrl: 'https://picsum.photos/seed/dailymix1/100/100', audioSrc: SAMPLE_AUDIO_SRC_3, dataAiHint: 'playlist mix' },
  ];

  const artistsYouLike: CardItem[] = [
    { id: 'artist1', title: 'Number One', subtitle: 'Diamond Platnumz', imageUrl: 'https://picsum.photos/seed/diamondplatnumz/300/300', audioSrc: SAMPLE_AUDIO_SRC_1, dataAiHint: 'african artist' },
    { id: 'artist2', title: 'Shake It Off', subtitle: 'Taylor Swift', imageUrl: 'https://picsum.photos/seed/taylorswift/300/300', audioSrc: SAMPLE_AUDIO_SRC_2, dataAiHint: 'pop singer' },
    { id: 'artist3', title: 'Hotline Bling', subtitle: 'Drake', imageUrl: 'https://picsum.photos/seed/drakeradio/300/300', audioSrc: SAMPLE_AUDIO_SRC_3, dataAiHint: 'rap hiphop' },
    { id: 'artist4', title: 'Sura Yako', subtitle: 'Sauti Sol', imageUrl: 'https://picsum.photos/seed/sautisol/300/300', audioSrc: SAMPLE_AUDIO_SRC_1, dataAiHint: 'kenyan music' },
  ];

  const madeForYou: CardItem[] = [
    { id: 'made1', title: 'Discover Weekly', subtitle: 'Your weekly mixtape.', imageUrl: 'https://picsum.photos/seed/discoverweekly/300/300', audioSrc: SAMPLE_AUDIO_SRC_2, dataAiHint: 'playlist discover' },
    { id: 'made2', title: 'Release Radar', subtitle: 'New music from artists you follow.', imageUrl: 'https://picsum.photos/seed/releaseradar/300/300', audioSrc: SAMPLE_AUDIO_SRC_3, dataAiHint: 'new releases' },
    { id: 'made3', title: 'Chill Vibes', subtitle: 'Relax and unwind.', imageUrl: 'https://picsum.photos/seed/chillvibes/300/300', audioSrc: SAMPLE_AUDIO_SRC_1, dataAiHint: 'lofi chill' },
    { id: 'made4', title: 'Workout Beats', subtitle: 'Energy for your workout.', imageUrl: 'https://picsum.photos/seed/workoutbeats/300/300', audioSrc: SAMPLE_AUDIO_SRC_2, dataAiHint: 'gym fitness' },
  ];
  
  let displayedTopList = topListItems;
  let displayedArtists = artistsYouLike;
  let displayedMadeForYou = madeForYou;

  // Basic filtering example (can be expanded)
  if (activeFilter === 'Music') {
    // Assume all current items are music for now
  } else if (activeFilter === 'Podcasts') {
    // Placeholder: clear music items if "Podcasts" selected, replace with actual podcast data if available
    displayedArtists = []; 
    displayedMadeForYou = madeForYou.filter(item => item.dataAiHint.includes("podcast")); // Example
    displayedTopList = topListItems.filter(item => item.dataAiHint.includes("podcast")); // Example
     if (displayedTopList.length === 0 && displayedMadeForYou.length === 0 && displayedArtists.length === 0) {
        // If no podcast content, show a message or default content
     }
  }


  return (
    <div className="text-foreground pb-12">
      <div className="sticky top-0 bg-background z-10 py-3">
        <ScrollArea className="w-full whitespace-nowrap px-4 md:px-0">
          <div className="flex space-x-2.5">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-1.5 font-semibold transition-colors duration-300 h-auto
                  ${activeFilter === filter
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-neutral-700 text-white hover:bg-neutral-600'
                  }`}
              >
                {filter}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      
      {(activeFilter === 'All' || activeFilter === 'Music' || (activeFilter === 'Podcasts' && displayedTopList.length > 0)) && (
        <section className="pt-4 px-4 md:px-0">
          <h2 className="text-xl font-bold text-foreground mb-3">Good afternoon</h2>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {displayedTopList.map((item) => (
              <TopListItemCard key={item.id} {...item} />
            ))}
          </div>
        </section>
      )}

      {(activeFilter === 'All' || activeFilter === 'Music' || (activeFilter === 'Podcasts' && displayedArtists.length > 0)) && (
        <LibrarySection title="Artists you like" items={displayedArtists} itemType="default" />
      )}
      {(activeFilter === 'All' || activeFilter === 'Music' || (activeFilter === 'Podcasts' && displayedMadeForYou.length > 0)) && (
        <LibrarySection title="Made For You" items={displayedMadeForYou} itemType="default" />
      )}

       {activeFilter === 'Podcasts' && displayedTopList.length === 0 && displayedArtists.length === 0 && displayedMadeForYou.length === 0 && (
        <div className="text-center py-10 px-4">
          <p className="text-muted-foreground text-lg">No podcasts to show for now.</p>
          <p className="text-muted-foreground">Check back later or explore other categories!</p>
        </div>
      )}
    </div>
  );
};

export default LibraryContent;
