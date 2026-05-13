'use client';

import type { FC } from 'react';
import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, MoreVertical, Loader2 } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { PlayableItem } from './PlayableItem';
import styles from './sounds.module.css';

// Initial dummy track matching your structure
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
  const autoplay = searchParams.get('autoplay') === 'true';

  // --- PLAYER STATES ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(initialTrack);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // --- LOGIC ---
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

  const handleSkip = (seconds: number) => {
    if (audioRef.current) audioRef.current.currentTime += seconds;
  };

  const progressPercent = (currentTime / duration) * 100 || 0;
  const remainingTime = duration - currentTime;

  return (
    <div className="bg-[#0d0d0d] min-h-screen">
      <link rel="stylesheet" href="https://www.boomplay.com/dist/pc/css/base-257EUIYF.min.css" />
      
      <style jsx global>{`
        .column_content ul { display: flex !important; flex-direction: row !important; overflow-x: auto !important; padding: 0 15px !important; gap: 16px; list-style: none; }
        .column_content li { min-width: 180px !important; flex: 0 0 auto; }
        .p_audioui_intervalArrow { fill: white; }
        .p_audioui_playlistChevron { fill: white; }
        .p_audioui_iconNumber { color: white; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 10px; font-weight: bold; }
        @media (max-width: 1024px) { .sidebar { display: none !important; } .main { margin-left: 0 !important; width: 100% !important; } }
      `}</style>

      {/* BOOMPLAY HEADER */}
      <header className="header">
        <div className="logo"><a href="#">Dhuux Sounds</a></div>
      </header>

      {/* BOOMPLAY CONTENT GRID */}
      <main className="main scrollView">
        <div className="scrollView_content pageContent pt-4">
          <article className="column column_slide">
            <h2 className="px-4 text-xl font-bold mb-4">Trending Now</h2>
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
                      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                    })}
                  />
                </li>
              </ul>
            </div>
          </article>
        </div>
      </main>

      {/* --- BBC SOUNDS STRUCTURE PLAYER --- */}
      {isPlayerOpen && (
        <div className="fixed inset-0 bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900 text-white flex flex-col z-[100] overflow-hidden">
          <div className="flex-grow flex flex-col p-4 pt-8 md:p-6 md:pt-10 overflow-y-auto">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0 px-2">
              <Button variant="ghost" size="icon" onClick={() => setIsPlayerOpen(false)} className="text-white hover:bg-white/10">
                <ChevronDown size={28} />
              </Button>
              <span className="text-sm font-semibold uppercase tracking-widest">{currentTrack.artist}</span>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <MoreVertical size={24} />
              </Button>
            </div>

            {/* Herospace Section */}
            <section className="sc-c-herospace flex flex-col items-center text-center">
              <div className="w-64 h-64 md:w-80 md:h-80 relative shadow-2xl rounded-lg overflow-hidden mb-8">
                <picture>
                  <img src={currentTrack.artwork} alt="" className="w-full h-full object-cover" />
                </picture>
                <img src="https://sounds.files.bbci.co.uk/3.7.0/networks/bbc_radio_one/colour_default.svg" alt="Logo" className="absolute bottom-2 right-2 w-12 h-12" />
              </div>

              <div className="max-w-xl">
                <span className="text-xs font-black tracking-widest uppercase text-white/60 mb-2 block">{currentTrack.network}</span>
                <hr className="w-12 border-t-2 border-white/20 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-1">{currentTrack.title}</h2>
                <p className="text-xl text-white/70">{currentTrack.artist}</p>
              </div>
            </section>

            {/* Media Controls Container */}
            <div className="mt-auto pb-10">
              {/* Progress Bar Area */}
              <div className="p_playerSeekBarHolder relative h-12 flex items-center px-2" ref={progressBarRef}>
                <span className="absolute left-0 -bottom-2 text-[10px] text-white/50">-{formatTime(remainingTime)}</span>
                <div className="w-full h-1 bg-white/20 relative">
                  <div className="absolute h-full bg-[#ff4400]" style={{ width: `${progressPercent}%` }} />
                  <div 
                    className="absolute w-3 h-3 bg-[#ff4400] rounded-full top-1/2 -translate-y-1/2 shadow-lg" 
                    style={{ left: `${progressPercent}%`, marginLeft: '-6px' }} 
                  />
                </div>
                <span className="absolute right-0 -bottom-2 text-[10px] text-white/50">{formatTime(duration)}</span>
              </div>

              {/* Media Buttons */}
              <div className="flex justify-center items-center gap-6 mt-8">
                <button className="audioButton opacity-40 cursor-not-allowed">
                   <svg width="48" height="48" viewBox="0 0 48 48"><path fill="white" d="M16.995,31.996 L16.995,16 L18.495,16 L18.495,31.996 L16.995,31.996 Z M18.495,23.998 L30.992,16 L30.992,20.079 L24.358,23.998 L30.992,27.918 L30.992,31.996 L18.495,23.998 Z" /></svg>
                </button>

                <button className="relative" onClick={() => handleSkip(-10)}>
                   <svg width="48" height="48" viewBox="0 0 48 48"><path className="p_audioui_intervalArrow" d="M23.978,8.593 C23.926,8.593 23.822,8.593 23.822,8.593 L22.384,8.592 L25.696,5.286 L23.929,3.523 L17.303,10.134 L23.929,16.745 L25.696,14.983 L22.415,11.708 L23.822,11.711 C23.822,11.711 23.926,11.71 23.978,11.71 C31.912,11.71 38.344,18.128 38.344,26.046 C38.344,33.963 31.912,40.382 23.978,40.382 C16.043,40.382 9.612,33.963 9.612,26.046 L6.491,25.998 C6.491,26.014 6.489,26.029 6.489,26.046 C6.489,35.685 14.319,43.499 23.978,43.499 C33.637,43.499 41.467,35.685 41.467,26.046 C41.467,16.407 33.637,8.593 23.978,8.593" /></svg>
                   <div className="p_audioui_iconNumber">10</div>
                </button>

                <button onClick={handlePlayPause}>
                  <svg width="80" height="80" viewBox="0 0 68 68">
                    <circle cx="34" cy="34" r="32" fill="none" stroke="white" strokeWidth="2" opacity="0.2" />
                    {isPlaying ? (
                      <g fill="white"><rect x="26" y="24" width="6" height="20" /><rect x="36" y="24" width="6" height="20" /></g>
                    ) : (
                      <polygon fill="white" points="27 46 46 34 27 22" />
                    )}
                  </svg>
                </button>
				

                <button className="relative" onClick={() => handleSkip(10)}>
                   <svg width="48" height="48" viewBox="0 0 48 48"><path className="p_audioui_intervalArrow" d="M23.991,8.582 C24.043,8.582 24.147,8.582 24.147,8.582 L25.581,8.58 L22.277,5.282 L24.039,3.523 L30.651,10.12 L28.887,11.88 L24.039,16.717 L22.277,14.957 L25.55,11.691 L24.147,11.693 C24.147,11.693 24.043,11.691 23.991,11.691 C16.075,11.691 9.656,18.096 9.656,25.996 C9.656,33.896 16.073,40.3005 23.991,40.3005 C31.907,40.3005 38.325,33.896 38.325,25.996 L41.439,25.948 C41.439,25.965 41.441,25.98 41.441,25.996 C41.441,35.613 33.628,43.41 23.991,43.41 C14.353,43.41 6.54,35.613 6.54,25.996 C6.54,16.378 14.353,8.582 23.991,8.582" /></svg>
                   <div className="p_audioui_iconNumber">10</div>
                </button>

                <button className="audioButton opacity-40 cursor-not-allowed">
                   <svg width="48" height="48" viewBox="0 0 48 48"><path fill="white" d="M29.503,32 L29.503,16 L31.003,16 L31.003,32 L29.503,32 Z M17.003,20.08 L17.003,16 L29.503,23.999 L17.003,31.999 L17.003,27.92 L23.639,23.999 L17.003,20.08 Z" /></svg>
                </button>
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