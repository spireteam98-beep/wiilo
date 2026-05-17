'use client';

import dynamicImport from 'next/dynamic';
import { categories } from '@/lib/data';

// Force dynamic rendering - disable static prerendering
export const dynamic = 'force-dynamic';

// Dynamically import components that use useAudioPlayer with SSR disabled
const FeaturedAudio = dynamicImport(
  () => import('@/components/audio/featured-audio').then(mod => ({ default: mod.FeaturedAudio })),
  { ssr: false }
);

const AudioCarousel = dynamicImport(
  () => import('@/components/audio/audio-carousel').then(mod => ({ default: mod.AudioCarousel })),
  { ssr: false }
);

const Recommendations = dynamicImport(
  () => import('@/components/audio/recommendations').then(mod => ({ default: mod.Recommendations })),
  { ssr: false }
);

export default function DashboardPage() {
  return (
    <div className="space-y-12">
      <FeaturedAudio />
      <div className="space-y-8">
        <Recommendations />
        {categories.map((category) => (
          <AudioCarousel key={category.slug} category={category} />
        ))}
      </div>
    </div>
  );
}
