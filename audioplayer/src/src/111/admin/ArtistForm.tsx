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
import { useFirestore } from '@/firebase';
import { addArtist } from '@/firebase/firestore/admin';
import { toast } from 'react-hot-toast';

const artistFormSchema = z.object({
  name: z.string().min(1, 'Artist name is required'),
  imageUrl: z.string().url('Please enter a valid image URL'),
});

type ArtistFormValues = z.infer<typeof artistFormSchema>;

export const ArtistForm = () => {
  const firestore = useFirestore();
  const form = useForm<ArtistFormValues>({
    resolver: zodResolver(artistFormSchema),
    defaultValues: {
      name: '',
      imageUrl: '',
    },
  });

  const onSubmit = async (values: ArtistFormValues) => {
    if (!firestore) {
        toast.error('Firestore not available');
        return;
    }
    try {
      await addArtist(firestore, values);
      toast.success('Artist added successfully!');
      form.reset();
    } catch (error) {
      console.error('Error adding artist: ', error);
      toast.error('Failed to add artist.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Artist Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Daft Punk" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/artist.jpg"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding...' : 'Add Artist'}
        </Button>
      </form>
    </Form>
  );
};
