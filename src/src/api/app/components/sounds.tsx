"use client";

import React, { useEffect, useState, useRef } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { BiSkipPrevious, BiSkipNext } from 'react-icons/bi';
import styles from './sounds.module.css';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export default function Sounds() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const lastSaveTimeRef = useRef(0);
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);

  // Load saved state when component mounts and audio is loaded
  useEffect(() => {
    const loadSavedPosition = () => {
      const savedTime = localStorage.getItem('audioCurrentTime');
      const savedDuration = localStorage.getItem('audioDuration');
      
      if (savedTime && savedDuration && audioRef.current) {
        const time = parseFloat(savedTime);
        const dur = parseFloat(savedDuration);
        
        if (!isNaN(time) && !isNaN(dur)) {
          setDuration(dur);
          setIsMetadataLoaded(true);
          audioRef.current.currentTime = time;
          setCurrentTime(time);
          console.log('Restored position:', time, 'duration:', dur);
        }
      }
    };

    loadSavedPosition();
  }, []);

  // Save position periodically while playing
  useEffect(() => {
    if (!isPlaying) return;

    const saveInterval = setInterval(() => {
      if (audioRef.current && Math.abs(currentTime - lastSaveTimeRef.current) >= 1) {
        localStorage.setItem('audioCurrentTime', currentTime.toString());
        localStorage.setItem('audioDuration', duration.toString());
        lastSaveTimeRef.current = currentTime;
        console.log('Saved position:', currentTime, 'duration:', duration);
      }
    }, 1000);

    return () => clearInterval(saveInterval);
  }, [isPlaying, currentTime, duration]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error('Playback failed:', error);
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    localStorage.setItem('audioCurrentTime', newTime.toString());
    localStorage.setItem('audioDuration', duration.toString());
  };

  const handleRewind = () => {
    if (audioRef.current) {
      const newTime = Math.max(audioRef.current.currentTime - 10, 0);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      localStorage.setItem('audioCurrentTime', newTime.toString());
      localStorage.setItem('audioDuration', duration.toString());
    }
  };

  const handleSkip = () => {
    if (audioRef.current) {
      const newTime = Math.min(
        audioRef.current.currentTime + 10,
        audioRef.current.duration
      );
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      localStorage.setItem('audioCurrentTime', newTime.toString());
      localStorage.setItem('audioDuration', duration.toString());
    }
  };

  const ProgressBar = ({ currentTime, duration, onSeek }: ProgressBarProps) => {
    const progressBarRef = useRef<HTMLDivElement>(null);
    
    const calculateProgress = () => {
      if (!duration) return 0;
      return (currentTime / duration) * 100;
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current) return;
      
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.min(Math.max(x / rect.width, 0), 1);
      const newTime = percentage * duration;
      onSeek(newTime);
    };

    const formatRemainingTime = (time: number) => {
      if (!isMetadataLoaded || isNaN(time) || time <= 0) return '--:--';
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `-${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
      <div className="progress-container">
        <span className="time">{formatTime(currentTime)}</span>
        <div 
          className="p_playerSeekBarHolder"
          ref={progressBarRef}
          onClick={handleSeek}
        >
          <div className="p_bar">
            <div 
              className="p_progressBar"
              style={{ 
                width: `${calculateProgress()}%`,
                transition: 'width 0.1s linear'
              }}
            >
              <div className="seek-dot" />
            </div>
          </div>
        </div>
        <span className="time">{formatRemainingTime(duration - currentTime)}</span>
      </div>
    );
  };

  // Format time to MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatRemainingTime = (time: number) => {
    if (!isMetadataLoaded || isNaN(time) || time <= 0) return '--:--';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `-${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.player}>
      <div>
        <div className="play-c-herospace-container">
          <section
            className="sc-c-herospace gel-1/1 sc-u-clip-overflow"
            aria-labelledby="sc-id-benji-b"
          >
            <div
              style={{
                backgroundImage:
                  "url()"
              }}
              className="sc-c-herospace__background-image gel-1/1"
            />
            <div className="gel-wrap gs-u-box-size sc-o-island sc-c-herospace__container">
              <div className="sc-c-herospace__details gel-1/1 gs-u-box-size">
                <div className="gel-9/24@xl gs-u-display-inline-block@xl">
                  <div className="sc-c-herospace__imagery gs-u-display-inline-block gel-3/12 gel-2/12@l gel-10/24@xl sc-o-island gs-u-float-right@xl">
                    <picture>
                      <source
                        type="image/webp"
                        srcSet="https://ichef.bbci.co.uk/images/ic/320x320/p0jw5wbt.jpg.webp 320w"
                      />
                      <source
                        type="image/jpg"
                        srcSet="https://ichef.bbci.co.uk/images/ic/320x320/p0jw5wbt.jpg 320w"
                      />
                      <img
                        src="https://ichef.bbci.co.uk/images/ic/320x320/p0jw5wbt.jpg"
                        alt=""
                        className="sc-c-herospace__image sc-c-herospace__image--live"
                      />
                    </picture>
                    <img
                      src="https://sounds.files.bbci.co.uk/3.7.0/networks/bbc_radio_one/colour_default.svg"
                      alt="Radio 1"
                      className="sc-c-herospace__network-logo sc-c-herospace__network-logo--live sc-o-island__point sc-o-island__point--br"
                    />
                  </div>
                </div>
                <div className="sc-c-herospace__details gs-u-pl++@xl gel-15/24@xl gs-u-display-inline-block@xl gs-u-align-top">
                  <div className="gel-17/24@xl sc-c-herospace__details-titles gs-u-pt+ gs-u-mh++">
                    <h1 className="sc-u-screenreader-only">
                      Radio 1 - Listen Live - BBC Sounds
                    </h1>
                    <span
                      aria-label="Radio 1"
                      className="sc-c-herospace__network-title gel-long-primer-bold gs-u-display-block"
                    >
                      RADIO 1
                    </span>
                    <hr className="gs-u-mt gs-u-mb-alt gs-u-display-inline-block gs-u-ml-0@xl" />
                    <div>
                      <a
                        id="sc-id-benji-b"
                        className="gel-pica-bold gs-u-display-inline-block gs-u-mb"
                        href="/programmes/b00v4tv3"
                      >
                        Benji B
                      </a>
                      <div className="sc-c-marquee--non-touch sc-c-marquee sc-c-herospace__details-titles-secondary">
                        <style
                          className="sc-c-marquee__style"
                          dangerouslySetInnerHTML={{ __html: "" }}
                        />
                        <div
                          className="sc-c-marquee__title gel-great-primer gs-u-pb- b-font-weight-500"
                          tabIndex={0}
                        >
                          <span className="sc-c-marquee__title-1">
                            FKA Twigs enters Album Mode
                          </span>
                          <span className="sc-c-marquee__title-2" aria-hidden="true">
                            FKA Twigs enters Album Mode
                          </span>
                          
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div
              id="smp-wrapper"
              className="sc-c-smp gel-wrap play-c-player optimizely-player gs-u-mt- gs-u-pb@m gs-u-pb+@xl gs-u-pl0 gs-u-pr0"
            >
              <div
                style={{
                  position: "relative",
                  zIndex: 999,
                  height: "100%",
                  width: "100%",
                  paddingBottom: 0
                  
                }}
                id="smphtml5iframesmp-wrapperwrp"
              >
             
                <audio
                  ref={audioRef}
                  src="/audio/kugudhimay.mp3"
                  preload="metadata"
                  onLoadedMetadata={() => {
                    if (audioRef.current) {
                      const audioDuration = audioRef.current.duration;
                      setDuration(audioDuration);
                      setIsMetadataLoaded(true);
                      localStorage.setItem('audioDuration', audioDuration.toString());
                      console.log('Audio duration loaded:', audioDuration);
                    }
                  }}
                  onTimeUpdate={() => {
                    if (audioRef.current) {
                      const current = audioRef.current.currentTime;
                      setCurrentTime(current);
                      console.log('Current time:', current, 'Duration:', duration);
                    }
                  }}
                  onEnded={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                    localStorage.removeItem('audioCurrentTime');
                  }}
                />
                
                <div className={styles.mediaContainer}>
                  <div className="control-group">
                    
                    <button
                      className="audioButton p_audioui_intervalButton"
                      id="p_audioui_backInterval"
                      aria-label="Rewind 10 seconds"
                      onClick={handleRewind}
                    >
                      <div className="p_audioButton_buttonInner">
                        <svg width={48} height={48} viewBox="0 0 48 48" focusable="false">
                          <path
                            id="p_audioui_backInterval_backArrow"
                            className="p_audioui_intervalArrow"
                            d="M23.9785895,8.59327393 C23.926122,8.59327393 23.8224363,8.59327393 23.8224363,8.59327393 L22.3845769,8.5920247 L25.6962756,5.28657205 L23.9298697,3.52391381 L17.3039737,10.1348191 L23.9298697,16.7457244 L25.6962756,14.9830662 L22.4158075,11.7088442 L23.8224363,11.7113426 C23.8224363,11.7113426 23.926122,11.7100934 23.9785895,11.7100934 C31.9124254,11.7100934 38.3446914,18.1286179 38.3446914,26.0462138 C38.3446914,33.9638098 31.9124254,40.3823343 23.9785895,40.3823343 C16.0435044,40.3823343 9.61248769,33.9638098 9.61248769,26.0462138 C9.61248769,26.0299739 9.61498614,26.0149832 9.61498614,25.9987433 L6.49192052,25.9987433 C6.49192052,26.0149832 6.48942206,26.0299739 6.48942206,26.0462138 C6.48942206,35.6852436 14.3195722,43.4991538 23.9785895,43.4991538 C33.6376069,43.4991538 41.467757,35.6852436 41.467757,26.0462138 C41.467757,16.4071841 33.6376069,8.59327393 23.9785895,8.59327393"
                            focusable="false"
                          />
                        </svg>
                        <div className="p_audioui_iconNumber">10</div>
                      </div>
                    </button>

                    <button
                      className="audioButton"
                      id="p_audioui_playpause"
                      aria-label={isPlaying ? "Pause" : "Play"}
                      onClick={handlePlayPause}
                    >
                      <div className="p_audioButton_buttonInner">
                        <svg width="68" height="68" viewBox="0 0 68 68" focusable="false">
                          <circle 
                            id="p_audioui_playpause_circle" 
                            cx="34" 
                            cy="34" 
                            r="32" 
                            className={styles.base_circle}
                          />
                          <circle 
                            id="p_audioui_playpause_highlightCircle" 
                            cx="34" 
                            cy="34" 
                            r="34" 
                            className={styles.highlight_circle}
                          />
                          <polygon 
                            id="p_audioui_playpause_playIcon" 
                            points="27 46 46 34 27 22" 
                            className={styles.play_icon}
                            style={{ opacity: isPlaying ? 0 : 1 }}
                          />
                          <g 
                            id="p_audioui_playpause_pauseIcon" 
                            className={styles.pause_icon}
                            style={{ opacity: isPlaying ? 1 : 0 }}
                          >
                            <rect x="26" y="24" width="6" height="20" />
                            <rect x="36" y="24" width="6" height="20" />
                          </g>
                          
                        </svg>
                      </div>
                    </button>

                    <button
                      className="audioButton p_audioui_intervalButton"
                      id="p_audioui_forwardInterval"
                      aria-label="Skip forward 10 seconds"
                      onClick={handleSkip}
                    >
                      <div className="p_audioButton_buttonInner">
                        <svg width={48} height={48} viewBox="0 0 48 48" focusable="false">
                          <path
                            id="p_audioui_forwardInterval_forwardArrow"
                            className="p_audioui_intervalArrow"
                            d="M23.9912,8.58202C24.0435,8.58202,24.147,8.58202,24.147,8.58202L25.5817,8.58077L22.2773,5.28266L24.0398,3.52391L30.651,10.1201L28.8872,11.8801L24.0398,16.7176L22.2773,14.9576L25.5505,11.6919L24.147,11.6932C24.147,11.6932,24.0435,11.6919,23.9912,11.6919C16.075,11.6919,9.65698,18.0962,9.65698,25.9962C9.65698,33.8962,16.0737,40.3005,23.9912,40.3005C31.9074,40.3005,38.3254,33.8962,38.3254,25.9962C38.3254,25.98,38.3229,25.965,38.3229,25.9488L41.439,25.9488C41.439,25.965,41.4415,25.98,41.4415,25.9962C41.4415,35.6138,33.6288,43.4104,23.9912,43.4104C14.3536,43.4104,6.54085,35.6138,6.54085,25.9962C6.54085,16.3786,14.3536,8.58202,23.9912,8.58202"
                            focusable="false"
                          />
                        </svg>
                        <div className="p_audioui_iconNumber">10</div>
                      </div>
                    </button>
                  </div>

                  <div className={styles.progressContainer}>
                    <span className={styles.time}>{formatTime(currentTime)}</span>
                    <div 
                      className={styles.playerSeekBarHolder}
                      ref={progressBarRef}
                      onClick={handleSeek}
                    >
                      <div className={styles.bar}>
                        <div 
                          className={`${styles.progressBar} ${isPlaying ? styles.playingIndicator : ''}`}
                          style={{ 
                            width: `${isMetadataLoaded && duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                            backgroundColor: '#ff4400'
                          }}
                        >
                          <div className={styles.seekDot} />
                        </div>
                      </div>
                    </div>
                    <span className={styles.time}>
                      {duration > 0 ? formatRemainingTime(duration - currentTime) : '--:--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <div>
            <div className="sc-s-contrast">
              <div className="sc-c-schedule sc-o-scrollable gs-u-pv gs-u-box-size">
                <div className="gel-wrap">
                  <ul className="sc-c-schedule__list gel-layout sc-u-flex-nowrap gs-u-ml0">
                    <li className="sc-c-broadcast gel-layout__item gs-u-align-top gel-1/3@l sc-u-flex-nowrap sc-c-broadcast--onair gs-u-pl0">
                      <div className="gel-layout sc-u-flex-nowrap gs-u-ml0 gel-layout--middle">
                        <div className="sc-c-broadcast__meta sc-u-truncate">
                          <p className="sc-u-truncate gel-1/1">
                            <span className="gel-minion-bold sc-c-broadcast__meta-status">
                              Now playing{/* */}:{" "}
                            </span>
                            <span className="gel-minion sc-c-broadcast__meta-time">
                              23:00{/* */} – {/* */}01:00
                            </span>
                          </p>
                          <p className="gel-pica-bold sc-u-truncate gel-1/1 gs-u-mt- gs-u-pr-alt+">
                            {" "}
                            {/* */}Benji B
                          </p>
                        </div>
                      </div>
                    </li>
                    <li className="sc-c-broadcast gel-layout__item gs-u-align-top gel-1/3@l sc-u-flex-nowrap sc-c-broadcast--next gs-u-ml gs-u-ml+@m gs-u-pl0">
                      <div className="gel-layout sc-u-flex-nowrap gs-u-ml0 gel-layout--middle">
                        <div className="sc-c-broadcast__meta sc-c-broadcast__meta-next gs-u-pl+ sc-u-truncate gel-layout__item">
                          <p className="sc-u-truncate gel-1/1">
                            <span className="gel-minion-bold sc-c-broadcast__meta-status">
                              Next{/* */}:{" "}
                            </span>
                            <span className="gel-minion sc-c-broadcast__meta-time">
                              01:00{/* */} – {/* */}01:30
                            </span>
                          </p>
                          <p className="gel-pica-bold sc-u-truncate gel-1/1 gs-u-mt-">
                            {" "}
                            {/* */}Radio 1 Dance Presents...
                          </p>
                          <p className="gel-long-primer sc-u-truncate gel-1/1 gs-u-mt--">
                            {" "}
                            {/* */}DJ Mag Tips for 2025 – livwutang
                          </p>
                        </div>
                      </div>
                    </li>
                    <li className="sc-c-broadcast sc-c-broadcast--next gel-1/3@l gs-u-ml gs-u-ml+@m">
                      <a
                        className="sc-c-schedule__full-schedule sc-o-link--secondary gel-brevier-bold gs-u-display-block sc-o-link gs-u-p+ gs-u-mt"
                        href="/sounds/schedules/bbc_radio_one"
                        data-bbc-container="player-live"
                        data-bbc-content-label="full-schedule"
                        data-bbc-event-type="select"
                        data-bbc-metadata='{"APP":"responsive::sounds","BID":"b00v4tv3"}'
                        data-bbc-result="m00273vc"
                        data-bbc-source="bbc_radio_one"
                        data-bbc-client-routed="true"
                      >
                        <svg
                          width="24px"
                          height="24px"
                          viewBox="0 0 32 32"
                          xmlns="http://www.w3.org/2000/svg"
                          className="sc-c-icon--tv-schedule sc-c-icon sc-c-icon--primary sc-c-schedule__schedule-icon gs-u-align-middle"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path d="M0 0h6v6H0zm0 10h6v6H0zm0 10h6v6H0zM8 0h24v6H8zm20.7 16H32v-6H8v6h9.3a9 9 0 0 0-2.8 4H8v6h6.5a9 9 0 1 0 14.2-10M23 30a7 7 0 1 1 7-7 7 7 0 0 1-7 7zM27.6 25.2L24 22.5V18h-2v5.5l4.4 3.3 1.2-1.6z" />
                        </svg>
                        <span className="sc-o-link__text sc-c-schedule__full-schedule-text gs-u-ml">
                          Radio 1 Schedule
                        </span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}