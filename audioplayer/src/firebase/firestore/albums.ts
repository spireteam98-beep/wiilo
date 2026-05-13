'use client';

import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';

interface AlbumData {
  title: string;
  artistId: string;
  artworkUrl: string;
  releaseDate: string;
}

// Function to add a new album to the 'albums' collection
export const addAlbum = async (
  firestore: Firestore,
  albumData: AlbumData
) => {
  const albumsCollection = collection(firestore, 'albums');
  return await addDoc(albumsCollection, albumData);
};

// Function to delete an album by ID
export const deleteAlbum = async (firestore: Firestore, albumId: string) => {
  const albumDoc = doc(firestore, 'albums', albumId);
  return await deleteDoc(albumDoc);
};
