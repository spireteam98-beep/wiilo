'use client';
import { useEffect, useState } from 'react';
import { getPersonalizedRecommendations } from '@/ai/flows/personalized-recommendations';
import { allAudios, listeningHistory, allCategoriesForAI, type Audio } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { AudioCard } from './audio-card';

export function Recommendations() {
  const [recommendations, setRecommendations] = useState<Audio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const result = await getPersonalizedRecommendations({
          listeningHistory,
          categories: allCategoriesForAI,
        });

        const recommendedTitles = result.recommendations.toLowerCase().split(',').map(t => t.trim());
        let recommendedAudios = allAudios.filter(audio => recommendedTitles.includes(audio.title.toLowerCase())).slice(0, 6);
        
        if (recommendedAudios.length < 3) {
            const currentRecIds = new Set(recommendedAudios.map(a => a.id));
            const filler = allAudios.filter(a => !currentRecIds.has(a.id)).slice(0, 6 - recommendedAudios.length);
            recommendedAudios = [...recommendedAudios, ...filler];
        }

        setRecommendations(recommendedAudios);

      } catch (error) {
        console.error("Failed to get recommendations:", error);
        setRecommendations(allAudios.sort(() => 0.5 - Math.random()).slice(0, 6));
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
        <section className="space-y-4">
            <h2 className="text-2xl font-bold font-headline">For You</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                ))}
            </div>
        </section>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold font-headline">For You</h2>
      <Carousel
        opts={{
          align: 'start',
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {recommendations.map((audio, index) => (
            <CarouselItem key={index} className="basis-1/2 pl-4 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6">
              <AudioCard audio={audio} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 disabled:hidden" />
        <CarouselNext className="right-2 disabled:hidden"/>
      </Carousel>
    </section>
  );
}
