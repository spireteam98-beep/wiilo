'use client';

import type { Audio } from '@/lib/data';
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

interface AudioPlayerContextType {
  currentTrack: Audio | null;
  isPlaying: boolean;
  playTrack: (track: Audio) => void;
  togglePlayPause: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  setCurrentTrack: (track: Audio | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Audio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audioRef on the client side only
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio();
    }
  }, []);
  
  const togglePlayPause = useCallback(() => {
    if (audioRef.current && currentTrack) {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }
  }, [isPlaying, currentTrack]);

  const playTrack = useCallback((track: Audio) => {
    if (audioRef.current) {
        if (currentTrack?.id !== track.id) {
            setCurrentTrack(track);
            audioRef.current.src = track.audioUrl;
            audioRef.current.load();
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(e => console.error("Error playing track:", e));
        } else {
            togglePlayPause();
        }
    }
  }, [currentTrack, togglePlayPause]);


  const value = {
    currentTrack,
    isPlaying,
    setIsPlaying,
    playTrack,
    togglePlayPause,
    audioRef: audioRef as React.RefObject<HTMLAudioElement>,
    setCurrentTrack
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
