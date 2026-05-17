'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { addAlbum } from '@/firebase/firestore/albums';
import { toast } from 'react-hot-toast';

const albumFormSchema = z.object({
  title: z.string().min(1, 'Album title is required'),
  artistId: z.string().min(1, 'Please select an artist'),
  artworkUrl: z.string().url('Please enter a valid image URL'),
  releaseDate: z.string().min(1, 'Release date is required'),
});

type AlbumFormValues = z.infer<typeof albumFormSchema>;

interface Artist {
  name: string;
  imageUrl: string;
}

export const AlbumForm = () => {
  const firestore = useFirestore();
  const form = useForm<AlbumFormValues>({
    resolver: zodResolver(albumFormSchema),
    defaultValues: {
      title: '',
      artistId: '',
      artworkUrl: '',
      releaseDate: '',
    },
  });

  const artistsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'artists') : null),
    [firestore]
  );
  const { data: artists, isLoading: isLoadingArtists } = useCollection<Artist>(artistsQuery);

  const onSubmit = async (values: AlbumFormValues) => {
    if (!firestore) {
      toast.error('Firestore not available');
      return;
    }
    try {
      await addAlbum(firestore, values);
      toast.success('Album added successfully!');
      form.reset();
    } catch (error) {
      console.error('Error adding album: ', error);
      toast.error('Failed to add album.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Album Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Abbey Road" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="artistId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Artist</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingArtists}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an artist" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {artists?.map((artist: WithId<Artist>) => (
                    <SelectItem key={artist.id} value={artist.id}>
                      {artist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="artworkUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Artwork URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/artwork.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="releaseDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Release Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding...' : 'Add Album'}
        </Button>
      </form>
    </Form>
  );
};
