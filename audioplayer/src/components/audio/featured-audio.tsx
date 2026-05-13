'use client'
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { featuredAudio } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Play, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function FeaturedAudio() {
    const router = useRouter();
    const image = PlaceHolderImages.find(p => p.id === featuredAudio.imageId);

    return (
        <div className="relative h-[50vh] w-full overflow-hidden rounded-lg">
            {image && (
                <Image
                    src={image.imageUrl}
                    alt={featuredAudio.title}
                    fill
                    priority
                    className="object-cover"
                    data-ai-hint={image.imageHint}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 md:p-12">
                <h1 className="text-4xl md:text-6xl font-bold font-headline drop-shadow-lg">{featuredAudio.title}</h1>
                <p className="mt-2 text-lg text-muted-foreground drop-shadow-md">{featuredAudio.artist}</p>
                <div className="mt-6 flex gap-4">
                    <Button size="lg" onClick={() => router.push('/playlist?autoplay=true')}>
                        <Play className="mr-2 h-5 w-5 fill-current" />
                        Play
                    </Button>
                    <Button size="lg" variant="secondary">
                        <Info className="mr-2 h-5 w-5" />
                        More Info
                    </Button>
                </div>
            </div>
        </div>
    );
}
