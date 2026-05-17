'use client';

import React, { useEffect, useState } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { collection, doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Button } from '../ui/button';
import { deleteAlbum } from '@/firebase/firestore/albums';
import { toast } from 'react-hot-toast';

interface Album {
  title: string;
  artistId: string;
  artworkUrl: string;
  releaseDate: string;
}

interface Artist {
    name: string;
}

const AlbumItem = ({ album }: { album: WithId<Album> }) => {
    const firestore = useFirestore();
    const [artistName, setArtistName] = useState('Loading...');

    useEffect(() => {
        if (firestore && album.artistId) {
            const getArtistName = async () => {
                const artistRef = doc(firestore, 'artists', album.artistId);
                const artistSnap = await getDoc(artistRef);
                if (artistSnap.exists()) {
                    setArtistName((artistSnap.data() as Artist).name);
                } else {
                    setArtistName('Unknown Artist');
                }
            };
            getArtistName();
        }
    }, [firestore, album.artistId]);

    const handleDelete = async () => {
        if (!firestore) return;
        if (confirm('Are you sure you want to delete this album?')) {
            try {
                await deleteAlbum(firestore, album.id);
                toast.success('Album deleted');
            } catch (e) {
                toast.error('Failed to delete album');
                console.error(e);
            }
        }
    };

    return (
        <div className="flex items-center justify-between bg-neutral-800 p-3 rounded-md">
            <div className="flex items-center gap-4">
                <Image
                    src={album.artworkUrl}
                    alt={album.title}
                    width={50}
                    height={50}
                    className="rounded-md object-cover"
                />
                <div>
                    <p className="font-medium text-white">{album.title}</p>
                    <p className="text-sm text-neutral-400">{artistName}</p>
                </div>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
            </Button>
        </div>
    );
};

export const AlbumList = () => {
  const firestore = useFirestore();

  const albumsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'albums') : null),
    [firestore]
  );

  const { data: albums, isLoading, error } = useCollection<Album>(albumsQuery);

  if (isLoading) {
    return <div>Loading albums...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {albums && albums.length > 0 ? (
        albums.map((album: WithId<Album>) => (
            <AlbumItem key={album.id} album={album} />
        ))
      ) : (
        <p className="text-neutral-400">No albums found.</p>
      )}
    </div>
  );
};
