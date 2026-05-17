import { Bitcoin } from 'lucide-react';
import type { Asset, RecommendedAsset } from '@/lib/types';
import { EthereumIcon } from '@/components/icons/ethereum';
import { SolanaIcon } from '@/components/icons/solana';
import { TetherIcon } from '@/components/icons/tether';
import { CardanoIcon } from '@/components/icons/cardano';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { BnbIcon } from '@/components/icons/bnb';

// ==========================================
// AUDIO DATA (Original)
// ==========================================

export interface Audio {
  id: string;
  title: string;
  artist: string;
  category: string;
  imageId: string;
  audioUrl: string;
}

export interface Category {
  slug: string;
  name: string;
  audios: Audio[];
}

const audios: Audio[] = [
  { id: 'p1', title: 'The Daily Dose', artist: 'NY Times', category: 'podcasts', imageId: 'podcast-1', audioUrl: 'placeholder.mp3' },
  { id: 'p2', title: 'Tech Unfiltered', artist: 'Alex & Ben', category: 'podcasts', imageId: 'podcast-2', audioUrl: 'placeholder.mp3' },
  { id: 'p3', title: 'Creative Minds', artist: 'Jane Doe', category: 'podcasts', imageId: 'podcast-3', audioUrl: 'placeholder.mp3' },
  
  { id: 'm1', title: 'Acoustic Dreams', artist: 'Leo', category: 'music', imageId: 'music-1', audioUrl: 'placeholder.mp3' },
  { id: 'm2', title: 'Midnight Drive', artist: 'DJ Orbit', category: 'music', imageId: 'music-2', audioUrl: 'placeholder.mp3' },
  { id: 'm3', title: 'Chill Vibes', artist: 'Luna', category: 'music', imageId: 'music-3', audioUrl: 'placeholder.mp3' },

  { id: 'ab1', title: 'The Great Gatsby', artist: 'F. Scott Fitzgerald', category: 'audiobooks', imageId: 'audiobook-1', audioUrl: 'placeholder.mp3' },
  { id: 'ab2', title: '1984', artist: 'George Orwell', category: 'audiobooks', imageId: 'audiobook-2', audioUrl: 'placeholder.mp3' },
  { id: 'ab3', title: 'To Kill a Mockingbird', artist: 'Harper Lee', category: 'audiobooks', imageId: 'audiobook-3', audioUrl: 'placeholder.mp3' },
  
  { id: 't1', title: 'Viral Hits', artist: 'Various Artists', category: 'trending', imageId: 'trending-1', audioUrl: 'placeholder.mp3' },
  { id: 't2', title: 'Top of the Charts', artist: 'Chart Toppers', category: 'trending', imageId: 'trending-2', audioUrl: 'placeholder.mp3' },
  { id: 't3', title: 'Global 50', artist: 'World Hits', category: 'trending', imageId: 'trending-3', audioUrl: 'placeholder.mp3' },
];

export const allAudios = audios;

export const featuredAudio: Audio = {
  id: 'f1',
  title: 'Synthwave Odyssey',
  artist: 'Futurewave',
  category: 'Featured',
  imageId: 'featured-1',
  audioUrl: 'placeholder.mp3'
};

export const categories: Category[] = [
  {
    slug: 'trending',
    name: 'Trending Now',
    audios: audios.filter(a => a.category === 'trending')
  },
  {
    slug: 'podcasts',
    name: 'Podcasts',
    audios: audios.filter(a => a.category === 'podcasts')
  },
  {
    slug: 'music',
    name: 'Music',
    audios: audios.filter(a => a.category === 'music')
  },
  {
    slug: 'audiobooks',
    name: 'Audiobooks',
    audios: audios.filter(a => a.category === 'audiobooks')
  }
];

export const listeningHistory = "Listened to 'The Daily Dose', 'Tech Unfiltered', 'Acoustic Dreams', 'Midnight Drive'. Seems to like informational podcasts and electronic/chill music.";

export const allCategoriesForAI = categories.map(c => c.name).join(', ');

// ==========================================
// WALLET DATA (New)
// ==========================================

const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');

export const user = {
  name: 'John Doe',
  avatarUrl: 'https://picsum.photos/seed/u1/100/100',
};

const generateSparklineData = (): { name: string; value: number }[] => {
  return Array.from({ length: 15 }, (_, i) => ({
    name: `Day ${i + 1}`,
    value: Math.floor(Math.random() * 200 + 800 + Math.sin(i/2)*100),
  }));
}

export const myAssets: Asset[] = [
  {
    name: 'Bitcoin',
    code: 'BTC',
    Icon: Bitcoin,
    balance: 0.0000056,
    usdValue: 4500.00,
    trend: 4.5,
    trendDirection: 'down',
    trendValue: 12.5,
    chartData: generateSparklineData(),
  },
  {
    name: 'Tether',
    code: 'USDT',
    Icon: TetherIcon,
    balance: 2200.0,
    usdValue: 2200.0,
    trend: 0.1,
    trendDirection: 'up',
    trendValue: 0.1,
    chartData: generateSparklineData(),
  },
    {
    name: 'Ethereum',
    code: 'ETH',
    Icon: EthereumIcon,
    balance: 1.5,
    usdValue: 3754.88,
    trend: 1.2,
    trendDirection: 'up',
    trendValue: 20.3,
    chartData: generateSparklineData(),
  },
];

export const totalBalance = 8540.00;

export const recommendedAssets: RecommendedAsset[] = [
    { name: 'Binance Coin', code: 'BNB', Icon: BnbIcon }, 
  { name: 'Cardano', code: 'ADL', Icon: CardanoIcon },
];
