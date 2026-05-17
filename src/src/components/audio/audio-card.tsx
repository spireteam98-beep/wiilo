'use client';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { type Audio } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAudioPlayer } from '@/contexts/audio-player-context';
import { Button } from '../ui/button';
import { Download, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioCardProps {
  audio: Audio;
  className?: string;
}

export function AudioCard({ audio, className }: AudioCardProps) {
  const { playTrack } = useAudioPlayer();
  const { toast } = useToast();

  const image = PlaceHolderImages.find(p => p.id === audio.imageId);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click which would play the track
    toast({
      title: "Added to Downloads",
      description: `${audio.title} is now available for offline playback.`,
    });
    if (typeof window !== 'undefined') {
        const downloads = JSON.parse(localStorage.getItem('downloads') || '[]');
        if (!downloads.includes(audio.id)) {
          downloads.push(audio.id);
          localStorage.setItem('downloads', JSON.stringify(downloads));
        }
    }
  };

  return (
    <Card
      className={`group relative w-full cursor-pointer overflow-hidden rounded-lg border-0 bg-card shadow-none transition-all hover:bg-accent/10 ${className}`}
      onClick={() => playTrack(audio)}
    >
      <CardContent className="relative aspect-square p-0">
        {image && (
            <Image
            src={image.imageUrl}
            alt={audio.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={image.imageHint}
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-semibold text-card-foreground truncate">{audio.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{audio.artist}</p>
        </div>
        
        <div className="absolute bottom-4 right-4 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
          <Button size="icon" className="h-12 w-12 bg-primary/80 backdrop-blur-sm hover:bg-primary">
            <Play className="h-6 w-6 fill-primary-foreground" />
          </Button>
        </div>

        <div className="absolute right-4 top-4 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="icon" variant="secondary" onClick={handleDownload} aria-label={`Download ${audio.title}`}>
                <Download className="h-5 w-5" />
            </Button>
        </div>

      </CardContent>
    </Card>
  );
}
