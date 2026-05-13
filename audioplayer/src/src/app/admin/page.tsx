'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArtistForm } from '@/components/admin/ArtistForm';
import { ArtistList } from '@/components/admin/ArtistList';
import { AlbumForm } from '@/components/admin/AlbumForm';
import { AlbumList } from '@/components/admin/AlbumList';

const AdminPage = () => {
  return (
    <div className="p-4 md:p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      <Tabs defaultValue="artists" className="w-full">
        <TabsList>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="albums">Albums</TabsTrigger>
          <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
        </TabsList>
        <TabsContent value="artists">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Add New Artist</h2>
              <ArtistForm />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-4">Existing Artists</h2>
              <ArtistList />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="albums">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Add New Album</h2>
                    <AlbumForm />
                </div>
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Existing Albums</h2>
                    <AlbumList />
                </div>
            </div>
        </TabsContent>
        <TabsContent value="podcasts">
          <p className="mt-6 text-neutral-400">Podcast management will be added here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
