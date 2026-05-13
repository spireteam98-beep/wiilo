'use client';

import React from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { WithId } from '@/firebase/firestore/use-collection';
import Image from 'next/image';
import { Button } from '../ui/button';
import { deleteArtist } from '@/firebase/firestore/admin';
import { toast } from 'react-hot-toast';

interface Artist {
  name: string;
  imageUrl: string;
}

export const ArtistList = () => {
  const firestore = useFirestore();

  // IMPORTANT: The query MUST be memoized to prevent infinite re-renders.
  const artistsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'artists');
  }, [firestore]);

  const { data: artists, isLoading, error } = useCollection<Artist>(artistsQuery);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to delete this artist?')) {
        try {
            await deleteArtist(firestore, id);
            toast.success('Artist deleted');
        } catch (e) {
            toast.error('Failed to delete artist');
            console.error(e);
        }
    }
  };

  if (isLoading) {
    return <div>Loading artists...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {artists && artists.length > 0 ? (
        artists.map((artist: WithId<Artist>) => (
          <div
            key={artist.id}
            className="flex items-center justify-between bg-neutral-800 p-3 rounded-md"
          >
            <div className="flex items-center gap-4">
              <Image
                src={artist.imageUrl}
                alt={artist.name}
                width={50}
                height={50}
                className="rounded-full object-cover"
              />
              <span className="font-medium">{artist.name}</span>
            </div>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(artist.id)}>
              Delete
            </Button>
          </div>
        ))
      ) : (
        <p className="text-neutral-400">No artists found.</p>
      )}
    </div>
  );
};
