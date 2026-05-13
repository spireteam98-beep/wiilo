// src/app/collection/[id]/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Play, PlusCircle, ArrowDownToLine, MoreVertical, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePlayer } from '@/contexts/PlayerContext';
import type { ContentItem } from '@/services/contentService';
import { getContentItemsByCategory } from '@/services/contentService'; // Assuming this function exists
import { useAuth } from '@/contexts/AuthContext';
import { checkAndGrantContentAccess } from '@/lib/contentAccess';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface CollectionItemRowProps {
  item: ContentItem;
  onPlay: (item: ContentItem) => void;
  isCurrentPlaying: boolean;
  isCurrentPaused: boolean;
}

const CollectionItemRow: React.FC<CollectionItemRowProps> = ({ item, onPlay, isCurrentPlaying, isCurrentPaused }) => {
  return (
    <div
      className="flex items-center space-x-4 p-2 hover:bg-neutral-800/50 rounded-md cursor-pointer"
      onClick={() => onPlay(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPlay(item)}
    >
      <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
        <Image
          src={item.imageUrl || `https://placehold.co/100x100.png`}
          alt={item.title}
          layout="fill"
          objectFit="cover"
          data-ai-hint={item.dataAiHint || "item thumbnail"}
        />
         {isCurrentPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            {isCurrentPaused ? <Play className="h-6 w-6 text-white fill-white" /> : <ListMusic className="h-6 w-6 text-primary" />}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isCurrentPlaying && !isCurrentPaused ? 'text-primary' : 'text-foreground'}`}>
          {item.title}
        </p>
        <p className="text-sm text-muted-foreground truncate">{item.subtitle || 'Unknown Artist'}</p>
      </div>
      {/* Placeholder for explicit tag or downloaded icon */}
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={(e) => e.stopPropagation()}>
        <MoreVertical className="h-5 w-5" />
      </Button>
    </div>
  );
};

interface CollectionHeaderProps {
  title: string;
  description?: string;
  imageUrl?: string;
  creatorImageUrl?: string;
  creatorName?: string;
  itemCount?: number;
  totalDuration?: string;
  onPlayAll: () => void;
}

const CollectionHeader: React.FC<CollectionHeaderProps> = ({
  title,
  description,
  imageUrl,
  creatorImageUrl,
  creatorName,
  itemCount,
  totalDuration,
  onPlayAll,
}) => {
  return (
    <div className="relative h-[300px] md:h-[350px] w-full mb-6 text-white">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0 opacity-30"
          data-ai-hint="collection background"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/70 to-black/90 z-10"></div>
      
      <div className="relative z-20 flex flex-col justify-end h-full p-4 md:p-6 space-y-3">
        <div className="flex items-center space-x-3 mb-auto pt-2"> {/* Back button positioned here */}
          {/* This is a placeholder; actual routing might differ */}
        </div>

        <div className="max-w-md mx-auto text-center">
            {imageUrl && (
                 <Image
                    src={imageUrl}
                    alt={title}
                    width={180}
                    height={180}
                    className="rounded-md shadow-2xl mx-auto mb-4 object-cover aspect-square"
                    data-ai-hint="collection cover"
                />
            )}
            <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
            {description && <p className="text-sm text-neutral-300 mt-1">{description}</p>}
        </div>

        <div className="flex items-center space-x-2 text-xs text-neutral-400 justify-center">
          {creatorImageUrl && (
            <Avatar className="h-5 w-5">
              <AvatarImage src={creatorImageUrl} alt={creatorName || 'Creator'} data-ai-hint="creator avatar" />
              <AvatarFallback>{creatorName ? creatorName.charAt(0) : 'U'}</AvatarFallback>
            </Avatar>
          )}
          {creatorName && <span>{creatorName}</span>}
          {itemCount && <span>&bull; {itemCount} songs</span>}
          {totalDuration && <span>&bull; {totalDuration}</span>}
        </div>

        <div className="flex items-center justify-between pt-3">
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" className="text-neutral-300 hover:text-white"><PlusCircle className="h-6 w-6" /></Button>
            <Button variant="ghost" size="icon" className="text-neutral-300 hover:text-white"><ArrowDownToLine className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" className="text-neutral-300 hover:text-white"><MoreVertical className="h-5 w-5" /></Button>
          </div>
          <Button
            onClick={onPlayAll}
            className="bg-primary text-primary-foreground rounded-full p-0 w-14 h-14 hover:bg-primary/90"
            aria-label={`Play ${title}`}
          >
            <Play className="h-7 w-7 fill-current" />
          </Button>
        </div>
      </div>
    </div>
  );
};


function CollectionPageContent() {
  const params = useParams();
  const router = useRouter();
  const { id: collectionId } = params; // Can be category name, artist ID, series ID

  const { setCurrentTrack, currentTrack, isPlaying } = usePlayer();
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const [collectionDetails, setCollectionDetails] = useState<{
    title: string;
    description?: string;
    imageUrl?: string;
    creatorImageUrl?: string;
    creatorName?: string;
  } | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof collectionId === 'string' && collectionId) {
      const fetchCollectionData = async () => {
        setIsLoading(true);
        try {
          // For now, assume 'id' is a category name.
          // TODO: Later, determine if 'id' is category, artist, or series and fetch accordingly.
          const categoryName = decodeURIComponent(collectionId);
          const fetchedItems = await getContentItemsByCategory(categoryName);
          setItems(fetchedItems);

          // Placeholder collection details based on category
          // In a real app, you might fetch category-specific metadata
          setCollectionDetails({
            title: categoryName,
            description: `A collection of ${categoryName.toLowerCase()} content.`,
            // Use the first item's image as a fallback for collection image
            imageUrl: fetchedItems.length > 0 ? fetchedItems[0].imageUrl : `https://placehold.co/600x400.png`,
            creatorName: "Minti App", // Placeholder
            // creatorImageUrl: "path_to_spotify_like_logo.png"
          });
        } catch (error) {
          console.error("Failed to fetch collection data:", error);
          toast({ title: "Error", description: "Could not load collection.", variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      };
      fetchCollectionData();
    } else {
      // Handle case where collectionId is not a string (e.g. array or undefined)
      setIsLoading(false);
      toast({title: "Error", description: "Invalid collection identifier.", variant: "destructive"});
      // router.push('/'); // Optionally redirect if ID is invalid
    }
  }, [collectionId, toast]);

  const handlePlayItem = async (item: ContentItem) => {
    if (!user || !userProfile) {
      toast({ title: "Login Required", description: "Please sign in to play content.", variant: "destructive" });
      return;
    }
    if (!item.audioSrc) {
      toast({ title: "Audio Unavailable", description: "This item does not have an audio source.", variant: "destructive" });
      return;
    }

    const accessResult = await checkAndGrantContentAccess(item.id, userProfile, user.uid);
    if (accessResult.canAccess) {
      setCurrentTrack({
        id: item.id,
        title: item.title,
        artist: item.subtitle,
        imageUrl: item.imageUrl,
        audioSrc: item.audioSrc,
        dataAiHint: item.dataAiHint,
      });
      if (accessResult.profileWasUpdated && refreshUserProfile) {
        await refreshUserProfile();
      }
    } else {
      toast({ title: "Access Denied", description: accessResult.message || "Cannot play content.", variant: "destructive" });
    }
  };
  
  const handlePlayAll = () => {
    if (items.length > 0) {
      const firstPlayableItem = items.find(item => item.audioSrc);
      if (firstPlayableItem) {
        handlePlayItem(firstPlayableItem);
      } else {
        toast({ title: "No Playable Content", description: "No audio tracks found in this collection.", variant: "destructive" });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <Skeleton className="h-[350px] w-full mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-2">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!collectionDetails) {
    return <div className="min-h-screen bg-black text-white p-4 text-center">Collection not found or failed to load.</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute top-4 left-4 z-30">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/10 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>
      <CollectionHeader
        title={collectionDetails.title}
        description={collectionDetails.description}
        imageUrl={collectionDetails.imageUrl}
        creatorImageUrl={collectionDetails.creatorImageUrl}
        creatorName={collectionDetails.creatorName}
        itemCount={items.length}
        totalDuration={"N/A"} // Placeholder, calculate if needed
        onPlayAll={handlePlayAll}
      />
      <div className="px-4 pb-20"> {/* Padding for player bar */}
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground">No items in this collection.</p>
        ) : (
          items.map((item) => (
            <CollectionItemRow
              key={item.id}
              item={item}
              onPlay={handlePlayItem}
              isCurrentPlaying={currentTrack?.id === item.id}
              isCurrentPaused={currentTrack?.id === item.id && !isPlaying}
            />
          ))
        )}
      </div>
    </div>
  );
}


export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>}>
      <CollectionPageContent />
    </Suspense>
  );
}
