'use client';

import type { FC } from 'react';
import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, MoreVertical, Loader2 } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { PlayableItem } from './PlayableItem';
import styles from './sounds.module.css';

const initialTrack = {
  id: '0',
  title: 'FKA Twigs enters Album Mode',
  artist: 'Benji B',
  network: 'RADIO 1',
  artwork: 'https://ichef.bbci.co.uk/images/ic/320x320/p0jw5wbt.jpg',
  audioSrc: '/audio/kugudhimay.mp3',
};

function SoundsContentInternal() {
  const searchParams = useSearchParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(initialTrack);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleItemClick = (track: any) => {
    setCurrentTrack({
      id: track.id,
      title: track.name,
      artist: track.artist,
      network: 'DHUUX SOUNDS',
      artwork: track.image,
      audioSrc: track.url,
    });
    setIsPlayerOpen(true);
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.load();
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const progressPercent = (currentTime / duration) * 100 || 0;
  const remainingTime = duration - currentTime;

  return (
    <div className="bg-[#0d0d0d] min-h-screen">
      <link rel="stylesheet" href="https://www.boomplay.com/dist/pc/css/base-257EUIYF.min.css" />
      
      <style jsx global>{`
        /* 1. APPLY YOUR CUSTOM BUTTON CSS */
        .p_audioui_playpause_btn {
          -webkit-tap-highlight-color: transparent;
          background-color: transparent;
          border: 0;
          cursor: pointer;
          display: block;
          font-family: inherit;
          margin: 0;
          opacity: 1;
          outline: 0;
          padding: 0;
          transition: opacity 1s linear;
          user-select: none;
          width: 80px;
          height: 80px;
        }

        .base_circle { fill: white; transition: fill 0.3s ease; }
        .play_icon, .pause_icon { fill: black !important; }
        
        /* Layout fixes */
        .column_content ul { display: flex !important; flex-direction: row !important; overflow-x: auto !important; padding: 0 15px !important; gap: 16px; list-style: none; }
        .column_content li { min-width: 180px !important; flex: 0 0 auto; }
        @media (max-width: 1024px) { .sidebar { display: none !important; } .main { margin-left: 0 !important; width: 100% !important; } }
      `}</style>

      {/* HEADER */}
      <header className="header">
        <div className="logo"><a href="#">Dhuux Sounds</a></div>
      </header>

      {/* GRID */}
      <main className="main scrollView">
        <div className="scrollView_content pageContent pt-4">
          <article className="column column_slide">
            <h2 className="px-4 text-xl font-bold mb-4 text-white">Trending Now</h2>
            <div className="column_content">
              <ul>
                <li>
                  <PlayableItem 
                    name="The Harder They Fall" 
                    artist="Koffee" 
                    image="https://source.boomplaymusic.com/group10/M00/10/29/b276435f636a4a09b10c6c26222fa408_320_320.jpg"
                    onClick={() => handleItemClick({
                      id: "1",
                      name: "The Harder They Fall",
                      artist: "Koffee",
                      image: "https://source.boomplaymusic.com/group10/M00/10/29/b276435f636a4a09b10c6c26222fa408_320_320.jpg",
                      url: "/audio/kugudhimay.mp3"
                    })}
                  />
                </li>
              </ul>
            </div>
          </article>
        </div>
      </main>

      {/* OVERLAY PLAYER */}
      {isPlayerOpen && (
        <div className="fixed inset-0 bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900 text-white flex flex-col z-[100] overflow-hidden">
          <div className="flex-grow flex flex-col p-4 pt-8 md:p-6 md:pt-10 overflow-y-auto">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0 px-2">
              <Button variant="ghost" size="icon" onClick={() => setIsPlayerOpen(false)} className="text-white">
                <ChevronDown size={28} />
              </Button>
              <span className="text-sm font-semibold uppercase tracking-widest">{currentTrack.artist}</span>
              <Button variant="ghost" size="icon" className="text-white"><MoreVertical size={24} /></Button>
            </div>

            {/* Herospace Section */}
            <section className="flex flex-col items-center text-center">
              <div className="w-64 h-64 md:w-80 md:h-80 relative shadow-2xl rounded-lg overflow-hidden mb-8">
                <img src={currentTrack.artwork} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="max-w-xl px-4">
                <span className="text-xs font-black tracking-widest uppercase text-white/60 mb-2 block">{currentTrack.network}</span>
                <h2 className="text-2xl md:text-3xl font-bold mb-1">{currentTrack.title}</h2>
                <p className="text-lg md:text-xl text-white/70">{currentTrack.artist}</p>
              </div>
            </section>

            {/* Media Controls Container */}
            <div className="mt-auto pb-12">
              {/* Progress Bar */}
              <div className="relative h-12 flex items-center px-4 mb-4">
                <span className="absolute left-4 -bottom-1 text-[10px] text-white/50">-{formatTime(remainingTime)}</span>
                <div className="w-full h-1 bg-white/10 relative rounded-full">
                  <div className="absolute h-full bg-[#ff4400] rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="absolute right-4 -bottom-1 text-[10px] text-white/50">{formatTime(duration)}</span>
              </div>

              {/* Main Controls */}
              <div className="flex justify-center items-center gap-12">
                {/* PREVIOUS MOCK BUTTON */}
                <button className="opacity-50"><SkipBack size={32} fill="white" /></button>

                {/* PLAY/PAUSE BUTTON WITH YOUR CSS */}
                <button 
                  onClick={handlePlayPause}
                  className="p_audioui_playpause_btn"
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="80" height="80" viewBox="0 0 68 68" focusable="false">
                      <circle cx="34" cy="34" r="32" className="base_circle"></circle>
                      {isPlaying ? (
                        <g className="pause_icon">
                          <rect x="26" y="24" width="6" height="20" />
                          <rect x="36" y="24" width="6" height="20" />
                        </g>
                      ) : (
                        <polygon points="27 46 46 34 27 22" className="play_icon" />
                      )}
                    </svg>
                  </div>
                </button>

                {/* NEXT MOCK BUTTON */}
                <button className="opacity-50"><SkipForward size={32} fill="white" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}

export default function Sounds() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20 bg-black h-screen"><Loader2 className="animate-spin text-primary" /></div>}>
      <SoundsContentInternal />
    </Suspense>
  );
}