import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { Category } from '@/lib/data';
import { AudioCard } from './audio-card';

interface AudioCarouselProps {
  category: Category;
}

export function AudioCarousel({ category }: AudioCarouselProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold font-headline">{category.name}</h2>
      <Carousel
        opts={{
          align: 'start',
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {category.audios.map((audio, index) => (
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
