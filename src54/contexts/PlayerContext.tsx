// src/contexts/PlayerContext.tsx
'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext'; 
import { checkAndGrantContentAccess, LOW_BALANCE_THRESHOLD } from '@/lib/contentAccess'; 
import { useToast } from '@/hooks/use-toast';
import type { ContentAccessResult } from '@/lib/contentAccess';

export interface Track {
  id: string;
  title: string;
  artist?: string;
  imageUrl: string; 
  audioSrc: string; 
  dataAiHint: string;
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  setCurrentTrack: (track: Track) => void;
  togglePlayPause: () => void;
  isPlayerOpen: boolean;
  setIsPlayerOpen: (isOpen: boolean) => void;
  audioElementRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrackState] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { user, userProfile, refreshUserProfile } = useAuth(); 
  const { toast } = useToast();

  const audioLoadedDataHandler = useCallback(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    if (isPlaying && audioElement.src && audioElement.src !== window.location.href && !audioElement.src.startsWith('blob:')) {
      audioElement.play().catch(playError => {
        console.error("[PlayerContext] Error attempting to play audio on loadeddata:", playError);
        if (playError.name === 'NotAllowedError' || playError.name === 'NotSupportedError') {
          setIsPlaying(false);
        }
      });
    }
  }, [isPlaying]);

  const audioCanPlayHandler = useCallback(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    if (isPlaying && audioElement.paused && audioElement.src && audioElement.src !== window.location.href && !audioElement.src.startsWith('blob:')) {
         audioElement.play().catch(playError => {
            console.error("[PlayerContext] Error attempting to play audio on canplay:", playError);
            if (playError.name === 'NotAllowedError' || playError.name === 'NotSupportedError') {
                setIsPlaying(false);
            }
        });
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audioElement = audioRef.current;

    const handleTrackEnd = () => {
      setIsPlaying(false);
    };
    
    const handleError = (e: Event) => {
      if (audioElement && audioElement.error) {
        console.error('[PlayerContext] Audio Player Error Code:', audioElement.error.code, 'for src:', audioElement.currentSrc);
        console.error('[PlayerContext] Audio Player Error Message:', audioElement.error.message || "No specific message.");
      } else {
        console.error('[PlayerContext] Audio Player Error (unknown details or error object missing):', e, 'for src:', audioElement?.currentSrc);
      }
      setIsPlaying(false);
    };

    audioElement.addEventListener('ended', handleTrackEnd);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('loadeddata', audioLoadedDataHandler);
    audioElement.addEventListener('canplay', audioCanPlayHandler);

    return () => {
      audioElement.removeEventListener('ended', handleTrackEnd);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('loadeddata', audioLoadedDataHandler);
      audioElement.removeEventListener('canplay', audioCanPlayHandler);
    };
  }, [audioLoadedDataHandler, audioCanPlayHandler]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) { 
        if (isPlaying) setIsPlaying(false);
        return;
    }

    if (!currentTrack || !currentTrack.audioSrc) {
        audioElement.pause();
        if (audioElement.src && audioElement.src !== "") { 
            audioElement.src = ""; 
        }
        if (isPlaying) setIsPlaying(false);
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = "none";
        }
        return;
    }

    if (audioElement.src !== currentTrack.audioSrc) {
        audioElement.src = currentTrack.audioSrc;
        audioElement.load();
    }

    if (isPlaying) {
      if (audioElement.src && audioElement.src !== window.location.href && !audioElement.src.startsWith('blob:')) {
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("[PlayerContext] Error attempting to play audio in isPlaying/currentTrack effect:", error);
            if (audioElement.error) { 
                console.error(`[PlayerContext] Audio Element Error details: code ${audioElement.error.code}, message: ${audioElement.error.message || "No specific message."}`);
            }
            setIsPlaying(false);
          });
        }
      } else if (isPlaying) { 
        console.warn("[PlayerContext] Attempted to play with invalid or unready src. Stopping playback.");
        setIsPlaying(false);
      }
    } else {
      audioElement.pause();
    }

    if ('mediaSession' in navigator) {
      if (currentTrack) {
        console.log('[PlayerContext] Updating MediaSession. Current Track:', currentTrack.title, 'Artist:', currentTrack.artist, 'Image:', currentTrack.imageUrl);
        
        const artworkArray = [];
        if (currentTrack.imageUrl && typeof currentTrack.imageUrl === 'string' && (currentTrack.imageUrl.startsWith('http://') || currentTrack.imageUrl.startsWith('https://'))) {
          artworkArray.push({ 
            src: currentTrack.imageUrl, 
            sizes: '96x96 128x128 192x192 256x256 384x384 512x512', 
            type: 'image/png' // Assuming PNG, adjust if other types are common
          });
        } else {
          console.warn(`[PlayerContext] MediaSession: Invalid or non-absolute imageUrl for track '${currentTrack.title}':`, currentTrack.imageUrl, ". Lock screen artwork may not display.");
        }

        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist || 'Unknown Artist',
          album: 'Minti App', // Or a more specific album if available
          artwork: artworkArray,
        });
        navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      } else {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = "none";
      }
    }
  }, [isPlaying, currentTrack]);

  const togglePlayPauseCb = useCallback(() => {
    if (currentTrack) { 
      setIsPlaying((prevIsPlaying) => !prevIsPlaying);
    } else {
      setIsPlaying(false); 
    }
  }, [currentTrack]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const audio = audioRef.current;
    if (!audio) return;

    const actions: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => { if (currentTrack) togglePlayPauseCb(); }],
      ['pause', () => { if (currentTrack) togglePlayPauseCb(); }],
      ['seekbackward', (details) => { audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10)); }],
      ['seekforward', (details) => { audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + (details.seekOffset || 10)); }],
      // Add 'previoustrack' and 'nexttrack' if you have playlist logic
    ];

    for (const [action, handler] of actions) {
      try { navigator.mediaSession.setActionHandler(action, handler); } 
      catch (error) { console.warn(`[PlayerContext] Media session action "${action}" not supported.`); }
    }
    return () => {
      for (const [action] of actions) {
        try { navigator.mediaSession.setActionHandler(action, null); } catch (error) {}
      }
    };
  }, [currentTrack, togglePlayPauseCb]); // Ensure togglePlayPauseCb is stable

  const setCurrentTrackCb = useCallback(async (track: Track) => {
    console.log("[PlayerContext] setCurrentTrackCb called for track:", track.id, track.title);
    if (!user || !userProfile) {
      toast({ title: "Authentication Required", description: "Please sign in to play content.", variant: "destructive" });
      setIsPlaying(false);
      setCurrentTrackState(null);
      return;
    }
    if (!track.audioSrc) {
        toast({ title: "Audio Unavailable", description: "This item does not have an audio source.", variant: "destructive" });
        setIsPlaying(false);
        setCurrentTrackState(null);
        return;
    }

    // Consumption is now immediate on first access attempt
    const accessResult: ContentAccessResult = await checkAndGrantContentAccess(track.id, userProfile, user.uid);

    if (accessResult.canAccess) {
      console.log("[PlayerContext] Access granted for track:", track.id, "Result:", accessResult);
      setCurrentTrackState(track);
      setIsPlaying(true); // Start playing immediately
      if (accessResult.profileWasUpdated && refreshUserProfile) { 
         console.log("[PlayerContext] User profile was updated by content access, refreshing profile.");
         await refreshUserProfile(); 
      }
      if (accessResult.showLowBalanceWarning) {
        toast({
          title: "Low Balance Warning",
          description: `Your coin balance is now ${accessResult.newBalance}. Please top up soon!`,
          variant: "default",
          duration: 7000,
        });
      }
    } else {
      console.log("[PlayerContext] Access denied for track:", track.id, "Message:", accessResult.message);
      toast({ title: "Access Denied", description: accessResult.message || "You do not have access to this content.", variant: "destructive" });
      setIsPlaying(false); 
      setCurrentTrackState(null); 
    }
  }, [user, userProfile, toast, refreshUserProfile]);

  return (
    <PlayerContext.Provider 
        value={{ 
            currentTrack, 
            isPlaying, 
            setCurrentTrack: setCurrentTrackCb, 
            togglePlayPause: togglePlayPauseCb,
            isPlayerOpen, 
            setIsPlayerOpen,
            audioElementRef: audioRef 
        }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
