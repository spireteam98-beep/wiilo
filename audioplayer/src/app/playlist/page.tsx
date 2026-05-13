

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import styles from "./playlist.module.css";
import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { ChevronLeft } from 'lucide-react';

const initialTrack = {
  title: 'Extra Pressure',
  artist: 'Bensoul, Bien',
  album: 'The Lion of Sudah',
  artwork: 'https://i.scdn.co/image/ab67616d0000485101bb72dbd7d1b9f514cd1767',
  audioSrc: '/audio/kugudhimay.mp3',
};

const tracks = [
    {
      index: 1,
      title: "Extra Pressure",
      artists: "Bensoul, Bien",
      duration: "2:50",
      imageUrl: "https://i.scdn.co/image/ab67616d0000485101bb72dbd7d1b9f514cd1767",
      audioSrc: '/audio/kugudhimay.mp3',
    },
    {
      index: 2,
      title: "Kautamu Flani",
      artists: "Bensoul, V-Be",
      duration: "4:18",
      imageUrl: "https://i.scdn.co/image/ab67616d00004851826937a1744538a95aabbe0e",
      audioSrc: '/audio/jubba.wav',
    },
    {
      index: 3,
      title: "Forget You (Mom's Tribute)",
      artists: "Bensoul",
      duration: "5:02",
      imageUrl: "https://i.scdn.co/image/ab67616d0000485101bb72dbd7d1b9f514cd1767",
      audioSrc: '/audio/kugudhimay.mp3',
    },
    {
      index: 4,
      title: "War",
      artists: "Bensoul",
      duration: "2:50",
      imageUrl: "https://i.scdn.co/image/ab67616d0000485186e969e088ca5191510ccf46",
      audioSrc: '/audio/jubba.wav',
    },
    {
      index: 5,
      title: "Chop Chop",
      artists: "Alyn Sano, Bensoul",
      duration: "3:11",
      imageUrl: "https://i.scdn.co/image/ab67616d000048512837e25f2ccb3f79523bf591",
      audioSrc: '/audio/kugudhimay.mp3',
    }
]

function PlaylistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoplay = searchParams.get('autoplay') === 'true';

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);

  const [currentTrack, setCurrentTrack] = useState(initialTrack);
  const [previousTrack, setPreviousTrack] = useState<any>(null);

  const playAudio = useCallback(() => {
    if (audioRef.current && audioRef.current.readyState >= 2) { // Check if audio is ready
      audioRef.current.play().catch((e) => {
        console.error("Playback failed:", e);
        setIsPlaying(false)
      });
      setIsPlaying(true);
    }
  }, []);

  const handlePlayNext = () => {
    const currentIndex = tracks.findIndex(t => t.audioSrc === currentTrack.audioSrc);
    const nextIndex = (currentIndex + 1) % tracks.length;
    const nextTrackData = tracks[nextIndex];
    if (nextTrackData) {
        setPreviousTrack(currentTrack);
        setCurrentTrack({
            title: nextTrackData.title,
            artist: nextTrackData.artists,
            album: 'The Lion of Sudah',
            artwork: nextTrackData.imageUrl,
            audioSrc: nextTrackData.audioSrc,
        });
    }
  };
  
  const handlePlayPrevious = () => {
    if (previousTrack) {
      setCurrentTrack(previousTrack);
      setPreviousTrack(null); 
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      const newSrc = currentTrack.audioSrc;
      if (audioRef.current.src.endsWith(newSrc) === false) {
        audioRef.current.src = newSrc;
        audioRef.current.load();
        if (isPlaying || autoplay) {
            playAudio();
        }
      }
    }
  }, [currentTrack, isPlaying, autoplay, playAudio]);


  useEffect(() => {
    if (autoplay && isMetadataLoaded) {
      playAudio();
    }
  }, [autoplay, isMetadataLoaded, playAudio]);
  

  const handlePlayPause = useCallback(() => {
    if (audioRef.current && isMetadataLoaded) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        playAudio();
      }
    }
  }, [isMetadataLoaded, isPlaying, playAudio]);

  const handleRewind = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  }, []);

  const handleSkip = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.currentTime + 10,
        audioRef.current.duration
      );
    }
  }, []);

  useEffect(() => {
    if (navigator.mediaSession && isMetadataLoaded) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: [
          {
            src: currentTrack.artwork,
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => handlePlayPause());
      navigator.mediaSession.setActionHandler('pause', () => handlePlayPause());
      navigator.mediaSession.setActionHandler('seekbackward', () => handleRewind());
      navigator.mediaSession.setActionHandler('seekforward', () => handleSkip());
      navigator.mediaSession.setActionHandler('previoustrack', handlePlayPrevious);
      navigator.mediaSession.setActionHandler('nexttrack', handlePlayNext);
    }
  }, [isMetadataLoaded, handlePlayPause, handleRewind, handleSkip, currentTrack, handlePlayNext, handlePlayPrevious]);

  useEffect(() => {
    if (navigator.mediaSession) {
        if (isPlaying) {
          navigator.mediaSession.playbackState = 'playing';
        } else {
          navigator.mediaSession.playbackState = 'paused';
        }
    }
  }, [isPlaying]);

  useEffect(() => {
    const setPositionState = () => {
      if (navigator.mediaSession && audioRef.current) {
        const { currentTime, duration } = audioRef.current;
        if (isFinite(duration) && currentTime <= duration) {
            navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: audioRef.current.playbackRate,
            position: currentTime,
            });
        }
      }
    };

    const intervalId = setInterval(setPositionState, 500);

    return () => clearInterval(intervalId);
  }, []);

  const calculateNewTime = (clientX: number) => {
    if (!progressBarRef.current || !duration) return 0;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    return percentage * duration;
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsSeeking(true);
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isSeeking || !audioRef.current) return;
    const newTime = calculateNewTime(e.clientX);
    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };
  
  const handleMouseUp = (e: MouseEvent) => {
    if (!isSeeking) return;
    setIsSeeking(false);
    if (audioRef.current && isPlaying) {
      playAudio();
    }
  };
  
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const onMouseUp = (e: MouseEvent) => handleMouseUp(e);

    if (isSeeking) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isSeeking, isPlaying, playAudio]);

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTrackClick = (track: any) => {
      if (currentTrack.audioSrc !== track.audioSrc) {
        setPreviousTrack(currentTrack);
      }
      setCurrentTrack({
        title: track.title,
        artist: track.artists,
        album: 'The Lion of Sudah',
        artwork: track.imageUrl,
        audioSrc: track.audioSrc,
      });
      setIsPlaying(true);
  };

  return (
    <div className="bg-neutral-900 h-full w-full overflow-hidden overflow-y-auto">
      <div className="gsyf5AkxvVEMilYkkHdr relative" style={{ background: "linear-gradient(rgb(160,56,0) 0%, transparent 100%)", padding: "1.5rem" }}>
        <button onClick={() => router.back()} className="absolute top-4 left-4 z-10 p-2 bg-black/30 rounded-full hover:bg-black/50 transition-colors">
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        <div className="flex flex-col md:flex-row items-center gap-8 text-white pt-12">
            <Image src="https://image-cdn-ak.spotifycdn.com/image/ab67706c0000d72c164b7e75154d5761f53241b4" alt="Playlist" width={200} height={200} className="shadow-lg" />
            <div className="flex flex-col gap-y-2 mt-4 md:mt-0 text-center md:text-left">
                <p className="text-sm font-semibold">Playlist</p>
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold">
                    Written by: Bensoul
                </h1>
                <div className="flex items-center gap-x-2">
                    <Image src="https://i.scdn.co/image/ab6775700000ee85019837579336219f7d4f3de6" alt="Sol Generation" width={24} height={24} className="rounded-full"/>
                    <span>Sol Generation • 101 songs, 245 saves</span>
                </div>
            </div>
        </div>
      </div>
      <div className={styles.playerControlsContainer}>
          <div id="smp-wrapper" className="sc-c-smp">
            <div id="smphtml5iframesmp-wrapperwrp" style={{ position: 'relative', zIndex: 999, height: '100%', width: '100%', paddingBottom: '0px' }}>
              <div className={styles.progressContainer}>
                <div className={styles.playerSeekBarHolder} onMouseDown={handleMouseDown}>
                  <span className={styles.time}>{formatTime(currentTime)}</span>
                  <div className={styles.bar} ref={progressBarRef}>
                    <div className={styles.progressBar} style={{ width: `${isMetadataLoaded && duration > 0 ? (currentTime / duration) * 100 : 0}%` }}>
                      <button className={styles.p_seekThumb} title="Seek bar" aria-label="Seek bar" role="slider" style={{ position: 'absolute', transform: 'translate(-50%, -50%)', top: '50%', right: '-8px' }}>
                        <div className={styles.p_seekThumbLine}></div>
                        <div className={styles.p_seekThumbHalo}></div>
                      </button>
                    </div>
                  </div>
                  <span className={styles.duration}>{formatTime(duration)}</span>
                </div>
                <div className={styles.playerControls}>
                  <div className={styles.controlGroup}>
                    <button className={`${styles.audioButton} ${!previousTrack ? styles.disabled : ''}`} id="p_audioui_previousButton" aria-label="Previous item" disabled={!previousTrack} onClick={handlePlayPrevious}>
                      <div className="p_audioButton_buttonInner">
                        <svg className={styles.skipIcon} viewBox="0 0 32 32" focusable="false">
                          <path d="M4.8 1v30H2V1h2.8zm9.1 13.3L30 31h-6.4L9 16 23.6 1H30L13.9 17.7v-3.4z" focusable="false" fill="white"></path>
                        </svg>
                      </div>
                    </button>
                    <button className={styles.audioButton} id="p_audioui_backInterval" aria-label="Rewind 10 seconds" onClick={handleRewind}>
                      <div className="p_audioButton_buttonInner">
                        <svg width="40" height="40" viewBox="0 0 32 32" focusable="false">
                          <path className={styles.intervalArrow} d="M30.2,17.8C30.2,17.8,30.2,17.8,30.2,17.8C30.2,25.7,23.8,32,16,32S1.8,25.7,1.8,17.8h0c0,0,0,0,0,0h2.3c0,0,0,0,0,0.1 c0,4.1,2,7.6,5.2,9.7c1.9,1.3,4.1,2,6.6,2c6.5,0,11.8-5.3,11.8-11.8c0-3-1.1-5.7-2.9-7.8c0,0,0,0,0,0c-0.1-0.1-0.1-0.2-0.2-0.2 c-0.1-0.1-0.1-0.2-0.2-0.2c0,0,0,0,0,0c-2.1-2.1-5.1-3.4-8.3-3.4c-0.4,0-0.8,0-1.1,0.1l2.6,3.7h-2.6l-3.9-4.9L14.7,0l2.6,0l-2.6,3.7 l0.1,0c0.4,0,0.7,0,1.1,0C23.8,3.6,30.2,9.9,30.2,17.8C30.2,17.8,30.2,17.8,30.2,17.8z" focusable="false"></path>
                          <text className={styles.iconNumber} textAnchor="middle" dominantBaseline="central" x="16" y="18" fontSize="11" focusable="false">10</text>
                        </svg>
                      </div>
                    </button>
                    <button className={`${styles.audioButton} ${isPlaying ? styles.playing : ''}`} id="p_audioui_playpause" aria-label={isPlaying ? "Pause" : "Play"} onClick={handlePlayPause}>
                      <div className={styles.p_audioButton_buttonInner}>
                        <svg width="68" height="68" viewBox="0 0 68 68" focusable="false">
                          <circle id="p_audioui_playpause_circle" cx="34" cy="34" r="32" className={styles.base_circle}></circle>
                          <circle id="p_audioui_playpause_highlightCircle" cx="34" cy="34" r="34" className={styles.highlight_circle}></circle>
                          <polygon id="p_audioui_playpause_playIcon" points="27 46 46 34 27 22" className={styles.play_icon} style={{ opacity: isPlaying ? 0 : 1 }}></polygon>
                          <g id="p_audioui_playpause_pauseIcon" className={styles.pause_icon} style={{ opacity: isPlaying ? 1 : 0 }}>
                            <rect x="26" y="24" width="6" height="20"></rect>
                            <rect x="36" y="24" width="6" height="20"></rect>
                          </g>
                        </svg>
                      </div>
                    </button>
                    <button className={styles.audioButton} id="p_audioui_forwardInterval" aria-label="Skip forward 10 seconds" onClick={handleSkip}>
                      <div className="p_audioButton_buttonInner">
                        <svg width="40" height="40" viewBox="0 0 32 32" focusable="false">
                          <path className={styles.intervalArrow} d="M30.2,17.9C30.1,25.7,23.8,32,16,32C8.2,32,1.8,25.7,1.8,17.9S8.2,3.7,16,3.7h1.2l0,0L14.7,0h2.6l3.9,4.9 l-3.9,5h-2.6l2.6-3.6l0.1-0.2H16c-6.5,0-11.8,5.3-11.8,11.8S9.5,29.6,16,29.6c6.5,0,11.8-5.2,11.8-11.7H30.2z" focusable="false"></path>
                          <text className={styles.iconNumber} textAnchor="middle" dominantBaseline="central" x="16" y="18" fontSize="11" focusable="false">10</text>
                        </svg>
                      </div>
                    </button>
                    <button className={`${styles.audioButton} `} id="p_audioui_nextButton" aria-label="Next item" onClick={handlePlayNext}>
                      <div className="p_audioButton_buttonInner">
                        <svg className={styles.skipIcon} viewBox="0 0 32 32" focusable="false">
                          <path d="M27.2 1v30H30V1h-2.8zm-9.1 13.3L2 31h6.4L23 16 8.4 1H2l16.1 16.7v-3.4z" focusable="false" fill="white"></path>
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              <audio 
                ref={audioRef}
                src={currentTrack.audioSrc} 
                preload="metadata"
                onLoadedMetadata={() => {
                  if (audioRef.current) {
                    setDuration(audioRef.current.duration);
                    setIsMetadataLoaded(true);
                  }
                }}
                onTimeUpdate={() => {
                  if (audioRef.current && !isSeeking) {
                    setCurrentTime(audioRef.current.currentTime);
                  }
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  handlePlayNext();
                }}
                onCanPlay={() => {
                  if (autoplay && !isPlaying) {
                    playAudio();
                  }
                }}
              />
            </div>
          </div>
        </div>

      <div className="flex flex-col gap-y-1 p-4 md:p-6 text-neutral-400">
        <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 items-center px-4 py-2 border-b border-neutral-800">
            <div className="text-neutral-400">#</div>
            <div>Title</div>
            <div><svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"></path><path d="M8 3.25a.75.75 0 0 1 .75.75v3.25h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5V4a.75.75 0 0 1 .75-.75z"></path></svg></div>
        </div>
        
        {tracks.map((track) => (
            <TrackItem key={track.index} track={track} onClick={handleTrackClick} />
        ))}
      </div>
    </div>
  );
};

interface TrackItemProps {
    track: {
        index: number;
        title: string;
        artists: string;
        duration: string;
        imageUrl: string;
        audioSrc: string;
    };
    onClick: (track: any) => void;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, onClick }) => {
    return (
        <div onClick={() => onClick(track)} className="grid grid-cols-[auto,1fr,auto] gap-x-4 items-center px-4 py-2 rounded-md hover:bg-neutral-800/50 cursor-pointer">
            <div className="flex items-center gap-x-4">
                <span className="text-neutral-400">{track.index}</span>
                <Image src={track.imageUrl} alt={track.title} width={40} height={40} className="object-cover"/>
                <div>
                    <p className="text-white truncate">{track.title}</p>
                    <p className="text-sm truncate">{track.artists}</p>
                </div>
            </div>
            <div className="hidden md:block">Album Name</div>
            <div className="text-neutral-400">{track.duration}</div>
        </div>
    )
}

const PlaylistPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PlaylistContent />
        </Suspense>
    )
}


export default PlaylistPage;

    
