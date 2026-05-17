"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './sounds.module.css';
import controls from '../playlist/playlist.module.css';

type TrackInfo = {
  title: string;
  artist: string;
  artwork: string;
  audioSrc: string;
};

const defaultTrack: TrackInfo = {
  title: 'Wiillo Sounds',
  artist: 'Live Stream',
  artwork: 'https://picsum.photos/seed/default-audio/600/600',
  audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
};

function formatTime(time: number) {
  if (!Number.isFinite(time) || time < 0) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function SoundsContent() {
  const searchParams = useSearchParams();
  const autoplay = searchParams.get('autoplay') === 'true';

  const trackInfo = useMemo<TrackInfo>(() => {
    const title = searchParams.get('title') || defaultTrack.title;
    const artist = searchParams.get('artist') || defaultTrack.artist;
    const artwork = searchParams.get('cover') || defaultTrack.artwork;
    const audioSrc = searchParams.get('src') || defaultTrack.audioSrc;
    return { title, artist, artwork, audioSrc };
  }, [searchParams]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playAudio = useCallback(() => {
    if (!audioRef.current || audioRef.current.readyState < 2) return;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsReady(false);
    audio.src = trackInfo.audioSrc;
    audio.load();
  }, [trackInfo]);

  useEffect(() => {
    if (autoplay && isReady) {
      playAudio();
    }
  }, [autoplay, isReady, playAudio]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !isReady) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    playAudio();
  }, [isPlaying, isReady, playAudio]);

  const seekBy = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    const nextTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, audioRef.current.duration || 0));
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, []);

  const calculateNewTime = useCallback((clientX: number) => {
    if (!progressRef.current || !duration) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return ratio * duration;
  }, [duration]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!isSeeking || !audioRef.current) return;
      const time = calculateNewTime(event.clientX);
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    };

    const onMouseUp = () => {
      if (!isSeeking) return;
      setIsSeeking(false);
      if (isPlaying) playAudio();
    };

    if (isSeeking) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [calculateNewTime, isPlaying, isSeeking, playAudio]);

  const progressWidth = duration > 0 ? `${(currentTime / duration) * 100}%` : '0%';

  return (
    <main className={styles.player}>
      <div className={styles.playerContent}>
        <section className={styles.herospace}>
          <div style={{ backgroundImage: `url(${trackInfo.artwork})` }} className={styles.herospaceBackground} />
          <div className={styles.herospaceContainer}>
            <div className={styles.herospaceImagery}>
              <img src={trackInfo.artwork} alt={trackInfo.title} className={styles.herospaceImage} />
            </div>
            <div>
              <div className={styles.metaLabel}>Wiillo Sounds</div>
              <h1 className={styles.trackTitle}>{trackInfo.title}</h1>
              <p className={styles.trackArtist}>{trackInfo.artist}</p>
            </div>
          </div>
        </section>

        <div className={controls.playerControlsContainer}>
          <div className={controls.progressContainer}>
            <div className={controls.playerSeekBarHolder} onMouseDown={() => {
              setIsSeeking(true);
              if (audioRef.current && isPlaying) audioRef.current.pause();
            }}>
              <span className={controls.time}>{formatTime(currentTime)}</span>
              <div className={controls.bar} ref={progressRef}>
                <div className={controls.progressBar} style={{ width: progressWidth }}>
                  <button
                    className={controls.p_seekThumb}
                    title="Seek bar"
                    aria-label="Seek bar"
                    type="button"
                    role="slider"
                    style={{ position: 'absolute', transform: 'translate(-50%, -50%)', top: '46%', right: '-8px' }}
                  >
                    <div className={controls.p_seekThumbLine}></div>
                    <div className={controls.p_seekThumbHalo}></div>
                  </button>
                </div>
              </div>
              <span className={controls.duration}>{formatTime(duration)}</span>
            </div>

            <div className={controls.playerControls}>
              <div className={controls.controlGroup}>
                <button className={controls.audioButton} aria-label="Rewind 10 seconds" onClick={() => seekBy(-10)}>
                  <div className={controls.p_audioButton_buttonInner}>
                    <svg width={40} height={40} viewBox="0 0 32 32" focusable="false">
                      <path
                        className={controls.intervalArrow}
                        d="M30.2,17.8C30.2,17.8,30.2,17.8,30.2,17.8C30.2,25.7,23.8,32,16,32S1.8,25.7,1.8,17.8h0c0,0,0,0,0,0h2.3c0,0,0,0,0,0.1 c0,4.1,2,7.6,5.2,9.7c1.9,1.3,4.1,2,6.6,2c6.5,0,11.8-5.3,11.8-11.8c0-3-1.1-5.7-2.9-7.8c0,0,0,0,0,0c-0.1-0.1-0.1-0.2-0.2-0.2 c-0.1-0.1-0.1-0.2-0.2-0.2c0,0,0,0,0,0c-2.1-2.1-5.1-3.4-8.3-3.4c-0.4,0-0.8,0-1.1,0.1l2.6,3.7h-2.6l-3.9-4.9L14.7,0l2.6,0l-2.6,3.7 l0.1,0c0.4,0,0.7,0,1.1,0C23.8,3.6,30.2,9.9,30.2,17.8C30.2,17.8,30.2,17.8,30.2,17.8z"
                      ></path>
                      <text className={controls.iconNumber} textAnchor="middle" dominantBaseline="central" x="16" y="18" fontSize="11">10</text>
                    </svg>
                  </div>
                </button>
                <button
                  className={`${controls.audioButton} ${isPlaying ? controls.playing : ''}`}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  onClick={togglePlayPause}
                >
                  <div className={controls.p_audioButton_buttonInner}>
                    <svg width="68" height="68" viewBox="0 0 68 68" focusable="false">
                      <circle cx="34" cy="34" r="32" className={controls.base_circle}></circle>
                      <circle cx="34" cy="34" r="34" className={controls.highlight_circle}></circle>
                      <polygon points="27 46 46 34 27 22" className={controls.play_icon} style={{ opacity: isPlaying ? 0 : 1 }}></polygon>
                      <g className={controls.pause_icon} style={{ opacity: isPlaying ? 1 : 0 }}>
                        <rect x="26" y="24" width="6" height="20"></rect>
                        <rect x="36" y="24" width="6" height="20"></rect>
                      </g>
                    </svg>
                  </div>
                </button>
                <button className={controls.audioButton} aria-label="Skip forward 10 seconds" onClick={() => seekBy(10)}>
                  <div className={controls.p_audioButton_buttonInner}>
                    <svg width={40} height={40} viewBox="0 0 32 32" focusable="false">
                      <path
                        className={controls.intervalArrow}
                        d="M30.2,17.9C30.1,25.7,23.8,32,16,32C8.2,32,1.8,25.7,1.8,17.9S8.2,3.7,16,3.7h1.2l0,0L14.7,0h2.6l3.9,4.9 l-3.9,5h-2.6l2.6-3.6l0.1-0.2H16c-6.5,0-11.8,5.3-11.8,11.8S9.5,29.6,16,29.6c6.5,0,11.8-5.2,11.8-11.7H30.2z"
                      ></path>
                      <text className={controls.iconNumber} textAnchor="middle" dominantBaseline="central" x="16" y="18" fontSize="11">10</text>
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={() => {
          if (!audioRef.current) return;
          setDuration(audioRef.current.duration || 0);
          setIsReady(true);
        }}
        onTimeUpdate={() => {
          if (!audioRef.current || isSeeking) return;
          setCurrentTime(audioRef.current.currentTime);
        }}
        onCanPlay={() => {
          if (autoplay && !isPlaying) playAudio();
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />
    </main>
  );
}

export default function SoundsPage() {
  return (
    <Suspense fallback={<div className={styles.player}>Loading player...</div>}>
      <SoundsContent />
    </Suspense>
  );
}
