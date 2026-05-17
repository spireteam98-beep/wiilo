
// src/components/player/FullScreenPlayer.tsx
'use client';

import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  ChevronDown,
  MoreVertical,
  Heart,
  PlusCircle,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  LaptopMinimal,
  Share2,
  ListMusic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/contexts/PlayerContext';
import styles from './FullScreenPlayer.module.css'; 

const FullScreenPlayer: FC = () => {
  const { currentTrack, isPlaying, togglePlayPause, setIsPlayerOpen, audioElementRef } = usePlayer();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isShuffleActive, setIsShuffleActive] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off'); 
  
  const progressBarContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const audio = audioElementRef.current;
    if (audio) {
      const updateTimes = () => {
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration || 0);
      };
      const handleLoadedMetadata = () => {
        setDuration(audio.duration || 0);
        setCurrentTime(audio.currentTime || 0);
      };

      audio.addEventListener('timeupdate', updateTimes);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      if (audio.readyState >= audio.HAVE_METADATA) {
        handleLoadedMetadata();
      }
      if (audio.readyState >= audio.HAVE_CURRENT_DATA) {
        updateTimes();
      }

      return () => {
        audio.removeEventListener('timeupdate', updateTimes);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [audioElementRef, currentTrack]);


  if (!currentTrack) {
    return null;
  }

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds === Infinity || timeInSeconds < 0) {
      return '0:00';
    }
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleProgressChange = (event: React.MouseEvent<HTMLDivElement>) => {
    if (audioElementRef.current && progressBarContainerRef.current && duration > 0) {
      const progressBar = progressBarContainerRef.current;
      const clickPositionInPixels = event.clientX - progressBar.getBoundingClientRect().left;
      const clickPositionInPercentage = clickPositionInPixels / progressBar.offsetWidth;
      const newTime = duration * clickPositionInPercentage;
      audioElementRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const handleLike = () => setIsLiked(!isLiked);
  const handleShuffle = () => setIsShuffleActive(!isShuffleActive);
  const handleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
     if (audioElementRef.current) {
      if (repeatMode === 'one') audioElementRef.current.loop = true; // for 'one'
      else audioElementRef.current.loop = false; // for 'off' and 'all' (handled by 'ended' event for 'all')
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900 text-white flex flex-col z-[100] overflow-hidden">
      <div className="flex-grow flex flex-col p-4 pt-8 md:p-6 md:pt-10 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0 px-2">
          <Button variant="ghost" size="icon" onClick={() => setIsPlayerOpen(false)} className="text-white hover:bg-white/10">
            <ChevronDown className="w-7 h-7" />
          </Button>
          <div className="text-center">
            <p className="text-xs uppercase text-neutral-400">Playing from Playlist</p>
            <p className="text-sm font-semibold">{currentTrack.artist || 'Library'}</p>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <MoreVertical className="w-6 h-6" />
          </Button>
        </div>

        {/* Album Art */}
        <div className="flex-shrink-0 w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square mx-auto my-4 shadow-2xl rounded-lg overflow-hidden">
          <Image
            src={currentTrack.imageUrl}
            alt={`${currentTrack.title} album art`}
            width={500}
            height={500}
            className="object-cover w-full h-full"
            data-ai-hint={currentTrack.dataAiHint || "album art"}
            priority
          />
        </div>

        {/* Song Info & Like/Add */}
        <div className="my-4 px-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold truncate">{currentTrack.title}</h2>
              <p className="text-neutral-300 truncate">{currentTrack.artist || 'Unknown Artist'}</p>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4 ml-2">
              <Button variant="ghost" size="icon" onClick={handleLike} className={`text-white hover:bg-white/10 p-1 ${isLiked ? 'text-primary' : ''}`}>
                <Heart className={`w-6 h-6 sm:w-7 sm:h-7 ${isLiked ? 'fill-current text-primary' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 p-1">
                <PlusCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className={`${styles.audioPlayerContainer} my-4 flex-shrink-0 -mx-4 md:-mx-0`}>
          <div className={styles.progressSection}>
            <span className={styles.timeStamp}>{formatTime(currentTime)}</span>
            <div 
              className={styles.progressBarContainer}
              ref={progressBarContainerRef}
              onClick={handleProgressChange}
              role="slider"
              aria-valuenow={currentTime}
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-label="Seek"
              tabIndex={0}
              onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft' && audioElementRef.current) {
                      audioElementRef.current.currentTime = Math.max(0, audioElementRef.current.currentTime - 5);
                  } else if (e.key === 'ArrowRight' && audioElementRef.current) {
                      audioElementRef.current.currentTime = Math.min(duration, audioElementRef.current.currentTime + 5);
                  }
              }}
            >
              <div className={styles.progressBar} style={{ width: `${progressPercentage}%` }}>
                <div className={styles.progressBarThumb} style={{ left: `${progressPercentage}%` }} />
              </div>
            </div>
            <span className={styles.timeStamp}>{formatTime(duration)}</span>
          </div>

          <div className={styles.controlsSection}>
            <button 
              className={`${styles.controlButton} ${isShuffleActive ? styles.controlButtonActive : ''}`} 
              aria-label="Shuffle"
              onClick={handleShuffle}
            >
              <Shuffle size={20}/>
            </button>
            <button 
              className={`${styles.controlButton} ${styles.controlButtonSkipStyled}`}
              aria-label="Previous"
              onClick={() => audioElementRef.current && (audioElementRef.current.currentTime = Math.max(0, audioElementRef.current.currentTime - 10))}
            >
              <SkipBack size={22} />
            </button>
            <button 
              className={`${styles.controlButton} ${styles.controlButtonPlayPause}`} 
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button 
              className={`${styles.controlButton} ${styles.controlButtonSkipStyled}`}
              aria-label="Next"
              onClick={() => audioElementRef.current && (audioElementRef.current.currentTime = Math.min(duration, audioElementRef.current.currentTime + 10))}
            >
              <SkipForward size={22}/>
            </button>
            <button 
              className={`${styles.controlButton} ${repeatMode !== 'off' ? styles.controlButtonRepeatActive : ''}`} 
              aria-label="Repeat"
              onClick={handleRepeat}
            >
              <Repeat size={20}/>
              {repeatMode !== 'off' && <span className={styles.repeatDot} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-neutral-300 px-4 mt-auto mb-2 flex-shrink-0">
          <Button variant="ghost" size="icon" className="hover:text-white">
            <LaptopMinimal className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
          <div className="flex items-center space-x-6">
            <Button variant="ghost" size="icon" className="hover:text-white">
              <Share2 className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:text-white">
              <ListMusic className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </div>
        </div>
        
        {currentTrack.artist && (
          <div className="px-2 text-center flex-shrink-0 mb-2">
            <Button
              variant="outline"
              className="rounded-full border-neutral-500 text-white hover:border-white hover:bg-white/5 px-5 py-2 text-sm font-semibold"
            >
              Explore {currentTrack.artist}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullScreenPlayer;
