'use client';

import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';

interface ArtistData {
  name: string;
  imageUrl: string;
}

// Function to add a new artist to the 'artists' collection
export const addArtist = async (
  firestore: Firestore,
  artistData: ArtistData
) => {
  const artistsCollection = collection(firestore, 'artists');
  return await addDoc(artistsCollection, artistData);
};

// Function to delete an artist by ID
export const deleteArtist = async (firestore: Firestore, artistId: string) => {
  const artistDoc = doc(firestore, 'artists', artistId);
  return await deleteDoc(artistDoc);
};
