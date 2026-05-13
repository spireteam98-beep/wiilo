"use client";

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Music, 
  User, 
  ShoppingBag,
  MoreVertical,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ShowreelVideo {
  id: string;
  url: string;
  title: string;
  description: string;
  merchant: string;
  likes: string;
  comments: string;
  audio: string;
  product?: {
    name: string;
    price: string;
  };
}

const MOCK_VIDEOS: ShowreelVideo[] = [
  {
    id: '1',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-1282-large.mp4',
    title: 'New Season Arrival!',
    description: 'Check out our latest premium collection. Limited stock available.',
    merchant: 'Luxe Fashion',
    likes: '12.4K',
    comments: '432',
    audio: 'Original Sound - Luxe Trends',
    product: { name: 'Neon Silk Jacket', price: '$129.00' }
  },
  {
    id: '2',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-leaves-low-angle-shot-1579-large.mp4',
    title: 'Nature Essentials',
    description: 'Organic skincare for your daily routine. 100% natural ingredients.',
    merchant: 'Green Life',
    likes: '8.1K',
    comments: '128',
    audio: 'Lo-fi Beats for Study',
    product: { name: 'Organic Facial Oil', price: '$45.00' }
  },
  {
    id: '3',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-in-a-nightclub-with-neon-lights-40030-large.mp4',
    title: 'Weekend Vibes',
    description: 'The best night out starts with the right gear. Browse our shop.',
    merchant: 'Nightly Club',
    likes: '25.9K',
    comments: '1.2K',
    audio: 'Midnight Dance - Electro Mix'
  }
];

export default function ShowreelPage() {
  const [muted, setMuted] = useState(true);
  
  return (
    <div className="h-[calc(100vh-8rem)] w-full max-w-md mx-auto relative bg-black rounded-[40px] shadow-2xl overflow-hidden border-8 border-white/5">
      {/* Scroll Container */}
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
        {MOCK_VIDEOS.map((video) => (
          <VideoItem 
            key={video.id} 
            video={video} 
            isMuted={muted} 
            onToggleMute={() => setMuted(!muted)} 
          />
        ))}
      </div>

      {/* Global Mute Toggle */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-6 right-6 z-50 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40"
        onClick={() => setMuted(!muted)}
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </Button>
    </div>
  );
}

function VideoItem({ video, isMuted, onToggleMute }: { 
  video: ShowreelVideo; 
  isMuted: boolean; 
  onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.8
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(e => console.log("Autoplay blocked"));
          setIsPlaying(true);
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      });
    }, options);

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="h-full w-full snap-start relative group">
      {/* Video Content */}
      <video
        ref={videoRef}
        src={video.url}
        loop
        muted={isMuted}
        playsInline
        className="h-full w-full object-cover cursor-pointer"
        onClick={togglePlay}
      />

      {/* Overlay - Bottom Info */}
      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col gap-4 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Avatar className="h-10 w-10 border-2 border-white/50">
            <AvatarImage src={`https://picsum.photos/seed/${video.merchant}/40/40`} />
            <AvatarFallback>{video.merchant.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold text-white text-sm flex items-center gap-1">
              {video.merchant} 
              <Badge variant="secondary" className="bg-primary/20 text-primary border-none text-[10px] h-4">VERIFIED</Badge>
            </span>
            <span className="text-[10px] text-white/60">Professional Seller</span>
          </div>
          <Button variant="secondary" size="sm" className="ml-auto rounded-full h-8 text-[11px] font-black bg-white text-black hover:bg-white/90">
            FOLLOW
          </Button>
        </div>

        <div className="space-y-1">
          <h4 className="font-bold text-white text-base">{video.title}</h4>
          <p className="text-sm text-white/80 line-clamp-2 leading-relaxed">{video.description}</p>
        </div>

        <div className="flex items-center gap-2 text-white/70 text-xs">
          <Music className="h-3 w-3 animate-spin-slow" />
          <span className="truncate max-w-[200px]">{video.audio}</span>
        </div>

        {video.product && (
          <div className="pointer-events-auto mt-2">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-3 rounded-2xl flex items-center justify-between hover:bg-white/20 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] text-white/60 font-black uppercase tracking-widest">Featured Product</div>
                  <div className="text-white font-bold text-xs">{video.product.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-primary font-black text-xs">{video.product.price}</div>
                <div className="text-[10px] text-white/40">Buy Now</div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Overlay - Right Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-10">
        <div className="flex flex-col items-center gap-1 group/action cursor-pointer" onClick={() => setLiked(!liked)}>
          <div className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center transition-all",
            liked ? "bg-accent text-white" : "bg-black/20 backdrop-blur-md text-white hover:bg-black/40"
          )}>
            <Heart className={cn("h-6 w-6", liked && "fill-current")} />
          </div>
          <span className="text-[10px] font-bold text-white shadow-sm">{video.likes}</span>
        </div>

        <div className="flex flex-col items-center gap-1 cursor-pointer">
          <div className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/40 transition-all">
            <MessageCircle className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-bold text-white shadow-sm">{video.comments}</span>
        </div>

        <div className="flex flex-col items-center gap-1 cursor-pointer">
          <div className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/40 transition-all">
            <Share2 className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-bold text-white shadow-sm">Share</span>
        </div>

        <div className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/40 transition-all cursor-pointer">
          <MoreVertical className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
