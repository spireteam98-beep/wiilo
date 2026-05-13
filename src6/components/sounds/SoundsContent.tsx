'use client';

import type { FC } from 'react';
import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, MoreVertical, Loader2 } from 'lucide-react'; 
import { Button } from '@/components/ui/button';

// Default track data
const initialTrack = {
  id: '0',
  title: 'Now Playing',
  artist: 'Select a track',
  network: 'DHUUX SOUNDS',
  artwork: 'https://source.boomplaymusic.com/group10/M00/10/23/22cf0dbed024461dbb02591b8c4a46b9_320_320.jpg',
  audioSrc: '',
};

function SoundsContentInternal() {
  const searchParams = useSearchParams();
  
  // --- PLAYER STATES ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(initialTrack);

  const audioRef = useRef<HTMLAudioElement>(null);

  // --- LOGIC ---
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleItemClick = (e: React.MouseEvent, track: any) => {
    e.preventDefault(); 
    setCurrentTrack({
      id: track.id,
      title: track.name,
      artist: track.artist,
      network: 'RADIO 1',
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
        html, body { max-width: 100vw; overflow-x: hidden; background-color: #0d0d0d; margin: 0; padding: 0; }
        
        /* SIDEBAR REMOVAL & MAIN CONTENT FULL WIDTH */
        .sidebar { display: none !important; }
        .main { margin-left: 0 !important; width: 100% !important; left: 0 !important; }
        .header { left: 0 !important; width: 100% !important; }

        .column_content ul { 
            display: flex !important; 
            flex-direction: row !important; 
            overflow-x: auto !important; 
            white-space: nowrap !important;
            padding: 0 15px !important; 
            gap: 12px; 
            list-style: none;
        }
        .column_content li { display: inline-block !important; min-width: 150px !important; flex: 0 0 auto; }
        
        /* BBC PLAYER SVG STYLES */
        #surroundingCircle { fill: none; stroke: rgba(255,255,255,0.2); stroke-width: 1.5; }
        #progressCircle { 
           fill: none; stroke: #ff4400; stroke-width: 2.5; 
           stroke-dasharray: 204.2; 
           stroke-dashoffset: ${204.2 - (progressPercent / 100) * 204.2};
           transition: stroke-dashoffset 0.3s linear;
        }
        #highlightCircle { fill: white; }
        #playIcon, #pauseIcon { fill: black !important; }
        .p_audioui_iconNumber { color: white; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -42%); font-size: 11px; font-weight: bold; pointer-events: none; }
      `}</style>

      {/* HEADER */}
      <header className="header noneEvent">
        <div className="logo canEvent">
          <a className="log_clickEvent_subscribe" href="#">Dhuux Sounds</a>
        </div>
        <div className="line" />
      </header>

      {/* MAIN BROWSING UI (Full Width) */}
      <main className="main scrollView">
        <div className="scrollView_content pageContent" id="home">
          <div className="topPadding" style={{ paddingTop: 20 }} />
          
          <article className="column column_slide">
            <h2><a href="#" className="log_clickEvent">Hot on TV</a></h2>
            <div className="column_content">
              <ul>
                <li>
                  <div className="cursor-pointer" onClick={(e) => handleItemClick(e, {
                      id: "1", name: "The Harder They Fall", artist: "Koffee", 
                      image: "https://source.boomplaymusic.com/group10/M00/10/29/b276435f636a4a09b10c6c26222fa408_320_320.jpg",
                      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                  })}>
                    <div className="default default_playlist">
                      <div className="img hasToPlay_icon" style={{ backgroundImage: "url('https://source.boomplaymusic.com/group10/M00/10/29/b276435f636a4a09b10c6c26222fa408_320_320.jpg')" }}>
                        <span className="gradualBg"></span>
                        <span className="listen">1,767</span>
                        <span className="toPlay_icon"></span>
                      </div>
                    </div>
                    <strong className="text-white mt-2 block truncate">The Harder They Fall</strong>
                  </div>
                </li>
              </ul>
              <button className="column_left"><span className="bg"></span></button>
              <div className="column_right current"><span className="bg"></span></div>
            </div>
          </article>
        </div>
      </main>

      {/* --- BBC PLAYER OVERLAY --- */}
      {isPlayerOpen && (
        <div className="fixed inset-0 bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900 text-white flex flex-col z-[100] overflow-hidden animate-in slide-in-from-bottom duration-300">
          <div className="flex-grow flex flex-col p-4 pt-8 md:p-6 md:pt-10 overflow-y-auto overflow-x-hidden">
            
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

            {/* Herospace Artwork */}
            <section className="sc-c-herospace flex flex-col items-center text-center">
              <div className="w-64 h-64 md:w-80 md:h-80 relative shadow-2xl rounded-lg overflow-hidden mb-8 border border-white/10">
                <img src={currentTrack.artwork} alt="" className="w-full h-full object-cover" />
              </div>

              <div className="max-w-xl px-4">
                <span className="text-xs font-black tracking-widest uppercase text-white/60 mb-2 block">{currentTrack.network}</span>
                <hr className="w-12 border-t-2 border-white/20 mx-auto mb-4" />
                <h2 className="text-2xl md:text-3xl font-bold mb-1">{currentTrack.title}</h2>
                <p className="text-lg md:text-xl text-white/70">{currentTrack.artist}</p>
              </div>
            </section>

            {/* Media Controls */}
            <div className="mt-auto pb-10">
              <div className="relative h-12 flex items-center px-4 mb-4">
                <span className="absolute left-4 -bottom-1 text-[10px] text-white/50">-{formatTime(remainingTime)}</span>
                <div className="w-full h-1 bg-white/10 relative rounded-full">
                  <div className="absolute h-full bg-[#ff4400] rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="absolute right-4 -bottom-1 text-[10px] text-white/50">{formatTime(duration)}</span>
              </div>

              <div className="flex justify-center items-center gap-10">
                 {/* Previous */}
                 <button className="opacity-30"><svg width="32" height="32" viewBox="0 0 48 48"><path fill="white" d="M16.99,32 L16.99,16 L18.49,16 L18.49,32 L16.99,32 Z M18.49,24 L30.99,16 L30.99,32 L18.49,24 Z" /></svg></button>

                 {/* Back 10 */}
                 <button className="relative active:scale-90 transition-transform" onClick={() => handleSkip(-10)}>
                    <svg width="52" height="52" viewBox="0 0 48 48"><path fill="white" d="M23.97,8.59 C23.92,8.59 23.82,8.59 23.82,8.59 L22.38,8.59 L25.69,5.28 L23.92,3.52 L17.3,10.13 L23.92,16.74 L25.69,14.98 L22.41,11.7 L23.82,11.7 C31.91,11.7 38.34,18.12 38.34,26.04 C38.34,33.96 31.91,40.38 23.97,40.38 C16.04,40.38 9.61,33.96 9.61,26.04 L6.49,25.99 C6.48,35.68 14.31,43.49 23.97,43.49 C33.63,43.49 41.46,35.68 41.46,26.04 C41.46,16.4 33.63,8.59 23.97,8.59" /></svg>
                    <div className="p_audioui_iconNumber">10</div>
                 </button>

                 {/* THE BBC PLAY/PAUSE SVG BUTTON */}
                 <button onClick={handlePlayPause} className="relative active:scale-95 transition-transform">
                    <svg width="95" height="95" viewBox="0 0 68 68">
                       <circle id="surroundingCircle" cx="34" cy="34" r="32.5" />
                       <circle id="progressCircle" cx="34" cy="34" r="32.5" transform="rotate(-90 34 34)" />
                       <circle id="highlightCircle" cx="34" cy="34" r="34" />
                       <g id="centralIcons">
                         {!isPlaying ? (
                           <polygon id="playIcon" points="27 46 46 34 27 22" />
                         ) : (
                           <g id="pauseIcon">
                             <rect x="26" y="24" width="6" height="20" />
                             <rect x="36" y="24" width="6" height="20" />
                           </g>
                         )}
                       </g>
                    </svg>
                 </button>

                 {/* Forward 10 */}
                 <button className="relative active:scale-90 transition-transform" onClick={() => handleSkip(10)}>
                    <svg width="52" height="52" viewBox="0 0 48 48"><path fill="white" d="M23.99,8.58 C24.04,8.58 24.14,8.58 24.14,8.58 L25.58,8.58 L22.27,5.28 L24.03,3.52 L30.65,10.12 L24.03,16.71 L22.27,14.95 L25.55,11.69 L24.14,11.69 C16.07,11.69 9.65,18.09 9.65,25.99 C9.65,33.89 16.07,40.3 23.99,40.3 C31.9,40.3 38.32,33.89 38.32,25.99 L41.43,25.94 C41.44,35.61 33.62,43.41 23.99,43.41 C14.35,43.41 6.54,35.61 6.54,25.99 C6.54,16.37 14.35,8.58 23.99,8.58" /></svg>
                    <div className="p_audioui_iconNumber">10</div>
                 </button>

                 {/* Next */}
                 <button className="opacity-30"><svg width="32" height="32" viewBox="0 0 48 48"><path fill="white" d="M29.5,32 L29.5,16 L31,16 L31,32 L29.5,32 Z M17,20 L17,16 L29.5,24 L17,32 L17,28 L23.6,24 L17,20 Z" /></svg></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN AUDIO ELEMENT */}
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
    <Suspense fallback={<div className="flex justify-center py-20 bg-black h-screen"><Loader2 className="animate-spin text-[#ff4400]" /></div>}>
      <SoundsContentInternal />
    </Suspense>
  );
}