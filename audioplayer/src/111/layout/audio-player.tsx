'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './audio-player.module.css';
import { useAudioPlayer } from '@/contexts/audio-player-context';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { type Audio } from '@/lib/data';

const nextTrackAudio = {
  id: 'm2',
  title: 'Midnight Drive',
  artist: 'DJ Orbit',
  category: 'music',
  imageId: 'music-2',
  audioUrl: '/audio/jubba.wav',
};

function AudioPlayerContent() {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlayPause,
    audioRef 
  } = useAudioPlayer();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);

    // Set initial state in case audio is already loaded
    if (audio.readyState > 0) {
        setAudioData();
    }

    return () => {
        audio.removeEventListener('loadedmetadata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
    };
  }, [audioRef]);


  const handlePlayPause = useCallback(() => {
    togglePlayPause();
  }, [togglePlayPause]);

  const handleRewind = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  }, [audioRef]);

  const handleSkip = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, audioRef.current.duration);
    }
  }, [audioRef]);


  const calculateNewTime = (clientX: number) => {
    if (!progressBarRef.current || !duration) return 0;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    return percentage * duration;
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if(!duration) return;
    setIsSeeking(true);
    if(isPlaying) audioRef.current?.pause();
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isSeeking || !audioRef.current) return;
    const newTime = calculateNewTime(e.clientX);
    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };
  
  const handleMouseUp = (e: MouseEvent) => {
    if (!isSeeking || !audioRef.current) return;
    setIsSeeking(false);
    if(isPlaying) {
      audioRef.current.play().catch(e => console.error("Error playing on seek end:", e));
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
  }, [isSeeking, isPlaying]);

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;
  const image = PlaceHolderImages.find(p => p.id === currentTrack.imageId);

  return (
    <div className={`${styles.player}`}>
      <div className={styles.playerContent}>
        <section className={styles.herospace}>
          <div
            style={{
              backgroundImage: `url(${image?.imageUrl})`,
            }}
            className={styles.herospaceBackground}
          />
           <div className={styles.herospaceContainer}>
            <div className={styles.herospaceImagery}>
              {image && <img
                src={image.imageUrl}
                alt=""
                className={styles.herospaceImage}
              />}
            </div>
            <div className="sc-c-herospace__details gs-u-pl++@xl gel-15/24@xl gs-u-display-inline-block@xl gs-u-align-top">
              <div className="gel-17/24@xl sc-c-herospace__details-titles gs-u-pt+ gs-u-mh++">
                <div>
                  <a id="sc-id-benji-b" className="gel-pica-bold gs-u-display-inline-block gs-u-mb">{currentTrack.artist}</a>
                  <div className="sc-c-marquee--non-touch sc-c-marquee sc-c-herospace__details-titles-secondary">
                    <div className="sc-c-marquee__title gel-great-primer gs-u-pb- b-font-weight-500" tabIndex={0}>
                      <span className="sc-c-marquee__title-1">{currentTrack.title}</span>
                      <span className="sc-c-marquee__title-2" aria-hidden="true">{currentTrack.title}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.playerControlsContainer}>
          <div
            id="smp-wrapper"
            className="sc-c-smp"
          >
            <div
              style={{
                position: 'relative',
                zIndex: 999,
                height: '100%',
                width: '100%',
                paddingBottom: 0,
              }}
              id="smphtml5iframesmp-wrapperwrp"
            >
              <div className={styles.progressContainer}>
                <div
                  className={`${styles.playerSeekBarHolder}`}
                  onMouseDown={handleMouseDown}
                >
                  <span className={styles.time}>{formatTime(currentTime)}</span>
                  <div className={styles.bar} ref={progressBarRef}>
                    <div
                      className={styles.progressBar}
                      style={{
                        width: `${
                          duration > 0
                            ? (currentTime / duration) * 100
                            : 0
                        }%`,
                      }}
                    >
                      <button className={styles.p_seekThumb} title="Seek bar" aria-label="Seek bar" style={{ position: 'absolute', transform: 'translate(-50%, -50%)', top: '50%', right: '-8px' }} role="slider">
                        <div className={styles.p_seekThumbLine}></div>
                        <div className={styles.p_seekThumbHalo}></div>
                      </button>
                    </div>
                  </div>
                  <span className={styles.duration}>{formatTime(duration)}</span>
                </div>
                  <div className={styles.playerControls}>
                <div className={styles.controlGroup}>
                <button
                    className={`${styles.audioButton}`}
                    id="p_audioui_previousButton"
                    aria-label="Previous item"
                    // onClick={handlePlayPrevious}
                    // disabled={!previousTrack}
                >
                    <div className="p_audioButton_buttonInner">
                        <svg className={styles.skipIcon} viewBox="0 0 32 32" focusable="false"><path d="M4.8 1v30H2V1h2.8zm9.1 13.3L30 31h-6.4L9 16 23.6 1H30L13.9 17.7v-3.4z" focusable="false" fill="currentColor"></path></svg>
                    </div>
                </button>
                  <button
                    className={`${styles.audioButton}`}
                    id="p_audioui_backInterval"
                    aria-label="Rewind 10 seconds"
                    onClick={handleRewind}
                  >
                    <div className="p_audioButton_buttonInner">
                       <svg width={40} height={40} viewBox="0 0 32 32" focusable="false"><path className={styles.intervalArrow} d="M30.2,17.8C30.2,17.8,30.2,17.8,30.2,17.8C30.2,25.7,23.8,32,16,32S1.8,25.7,1.8,17.8h0c0,0,0,0,0,0h2.3c0,0,0,0,0,0.1 c0,4.1,2,7.6,5.2,9.7c1.9,1.3,4.1,2,6.6,2c6.5,0,11.8-5.3,11.8-11.8c0-3-1.1-5.7-2.9-7.8c0,0,0,0,0,0c-0.1-0.1-0.1-0.2-0.2-0.2 c-0.1-0.1-0.1-0.2-0.2-0.2c0,0,0,0,0,0c-2.1-2.1-5.1-3.4-8.3-3.4c-0.4,0-0.8,0-1.1,0.1l2.6,3.7h-2.6l-3.9-4.9L14.7,0l2.6,0l-2.6,3.7 l0.1,0c0.4,0,0.7,0,1.1,0C23.8,3.6,30.2,9.9,30.2,17.8C30.2,17.8,30.2,17.8,30.2,17.8z" focusable="false"></path><text className={styles.iconNumber} textAnchor="middle" dominantBaseline="central" x="16" y="18" fontSize="11" focusable="false">10</text></svg>
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
                  <button
                    className={`${styles.audioButton}`}
                    id="p_audioui_forwardInterval"
                    aria-label="Skip forward 10 seconds"
                    onClick={handleSkip}
                  >
                    <div className="p_audioButton_buttonInner">
                       <svg width={40} height={40} viewBox="0 0 32 32" focusable="false"><path className={styles.intervalArrow} d="M30.2,17.9C30.1,25.7,23.8,32,16,32C8.2,32,1.8,25.7,1.8,17.9S8.2,3.7,16,3.7h1.2l0,0L14.7,0h2.6l3.9,4.9 l-3.9,5h-2.6l2.6-3.6l0.1-0.2H16c-6.5,0-11.8,5.3-11.8,11.8S9.5,29.6,16,29.6c6.5,0,11.8-5.2,11.8-11.7H30.2z" focusable="false"></path><text className={styles.iconNumber} textAnchor="middle" dominantBaseline="central" x="16" y="18" fontSize="11" focusable="false">10</text></svg>
                    </div>
                  </button>
                  <button
                    className={`${styles.audioButton}`}
                    id="p_audioui_nextButton"
                    aria-label="Next item"
                    // onClick={handlePlayNext}
                    // disabled={!nextTrackAudio}
                  >
                    <div className="p_audioButton_buttonInner">
                      <svg className={styles.skipIcon} viewBox="0 0 32 32" focusable="false"><path d="M27.2 1v30H30V1h-2.8zm-9.1 13.3L2 31h6.4L23 16 8.4 1H2l16.1 16.7v-3.4z" focusable="false" fill="currentColor"></path></svg>
                    </div>
                  </button>
                </div>
              </div>
              </div>
              
            
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function AudioPlayer() {
  return (
    <Suspense fallback={null}>
      <AudioPlayerContent />
    </Suspense>
  );
}
