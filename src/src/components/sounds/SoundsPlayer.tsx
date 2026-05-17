// src/components/sounds/SoundsPlayer.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './SoundsPlayer.module.css'; // Assuming the styles module is in the same directory
import {
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
} from '@heroicons/react/24/solid';

interface SoundsPlayerProps {
  audioSrc: string;
}

const SoundsPlayer: React.FC<SoundsPlayerProps> = ({ audioSrc }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);

  // Effect to handle changes in audioSrc
  useEffect(() => {
    if (audioRef.current) {
      // Pause current audio if playing
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      // Reset states
      setCurrentTime(0);
      setDuration(0);
      setIsMetadataLoaded(false);
      // Update audio source
      audioRef.current.src = audioSrc;
      // Load the new audio
      audioRef.current.load();
    }
  }, [audioSrc]); // Dependency array includes audioSrc

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || !isMetadataLoaded)
      return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleRewind = () => {
    if (audioRef.current) {
      const newTime = Math.max(audioRef.current.currentTime - 10, 0);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkip = () => {
    if (audioRef.current) {
      const newTime = Math.min(audioRef.current.currentTime + 10, duration);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Format time to MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.player}>
      <audio
        ref={audioRef}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            const audioDuration = audioRef.current.duration;
            setDuration(audioDuration);
            setIsMetadataLoaded(true);
          }
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            const current = audioRef.current.currentTime;
            setCurrentTime(current);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />
      <div className={styles.controls}>
        <button onClick={handleRewind} aria-label="Rewind 10 seconds">
          <BackwardIcon className="h-6 w-6 text-white" />
        </button>
        <button onClick={handlePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? (
            <PauseIcon className="h-10 w-10 text-white" />
          ) : (
            <PlayIcon className="h-10 w-10 text-white" />
          )}
        </button>
        <button onClick={handleSkip} aria-label="Skip forward 10 seconds">
          <ForwardIcon className="h-6 w-6 text-white" />
        </button>
      </div>
      <div className={styles.progressBarContainer} ref={progressBarRef} onClick={handleSeek}>
        <div
          className={styles.progressBar}
          style={{
            width: `${isMetadataLoaded && duration > 0 ? (currentTime / duration) * 100 : 0}%`,
          }}
        >
          <div className={styles.seekDot} />
        </div>
      </div>
      <div className={styles.timeInfo}>
        <span>{formatTime(currentTime)}</span> /{' '}
        <span>{isMetadataLoaded ? formatTime(duration) : '0:00'}</span>
      </div>
    </div>
  );
};

export default SoundsPlayer;
