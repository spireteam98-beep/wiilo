'use client';
import { useEffect, useRef, useState } from 'react';
import '../style1.css';

export default function VideoPlayerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const playProgressRef = useRef<HTMLDivElement>(null);
  const loadProgressRef = useRef<HTMLDivElement>(null);
  const hoverProgressRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const timeDisplayRef = useRef<HTMLDivElement>(null);
  const volumeSliderRef = useRef<HTMLDivElement>(null);
  const muteBtnRef = useRef<HTMLButtonElement>(null);
  const volumePanelRef = useRef<HTMLDivElement>(null);
  const volumeHandleRef = useRef<HTMLDivElement>(null);
  const volumeAreaRef = useRef<HTMLSpanElement>(null);
  const fullscreenBtnRef = useRef<HTMLButtonElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const wasPausedRef = useRef(true);

  function formatTime(sec: number) {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const togglePlayPause = async () => {
    const video = videoRef.current;
    if (video) {
        try {
            if (video.paused) {
                await video.play();
            } else {
                video.pause();
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                // This error is expected when a play() request is interrupted by a pause() call.
                // We can safely ignore it.
            } else {
                console.error("Error during play/pause toggle:", error);
            }
        }
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && !progressContainerRef.current?.classList.contains('scrubbing')) {
      const played = video.currentTime / video.duration;
      if(playProgressRef.current) playProgressRef.current.style.transform = `scaleX(${played})`;
      if(scrubberRef.current) scrubberRef.current.style.left = `${played * 100}%`;
      setCurrentTime(video.currentTime);
    }
  };

  const handleProgress = () => {
    const video = videoRef.current;
    if (video && video.buffered.length > 0 && loadProgressRef.current) {
      const buffered = video.buffered.end(video.buffered.length - 1) / video.duration;
      loadProgressRef.current.style.transform = `scaleX(${buffered})`;
    }
  };
  
  const handleSeek = (e: MouseEvent) => {
    const progressContainer = progressContainerRef.current;
    const video = videoRef.current;
    if (progressContainer && video && video.duration) {
      const rect = progressContainer.getBoundingClientRect();
      const pos = Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width;
      video.currentTime = pos * video.duration;
    }
  };
  
  const handleHover = (e: MouseEvent) => {
    const progressContainer = progressContainerRef.current;
    if(progressContainer && hoverProgressRef.current){
        const rect = progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        hoverProgressRef.current.style.transform = `scaleX(${pos})`;
    }
  };

  const handleMouseLeave = () => {
    if(hoverProgressRef.current) {
        hoverProgressRef.current.style.transform = 'scaleX(0)';
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if(video) {
        video.muted = !video.muted;
    }
  };
  
  const handleVideoVolumeChange = () => {
    const video = videoRef.current;
    const playerContainer = playerContainerRef.current;
    if (video && volumeHandleRef.current && volumePanelRef.current && playerContainer) {
        const volume = video.volume;
        const muted = video.muted;
        setIsMuted(muted);
        
        let newLeft = volume * 100;
        if (muted) newLeft = 0;
        
        if (volumeHandleRef.current) volumeHandleRef.current.style.left = `${newLeft}%`;
        if (volumePanelRef.current) (volumePanelRef.current as HTMLElement).style.setProperty('--volume-progress', `${newLeft}%`);

        let volumeLevel;
        if (muted || volume === 0) {
            volumeLevel = "muted";
        } else if (volume >= 0.5) {
            volumeLevel = "high";
        } else {
            volumeLevel = "low";
        }
        playerContainer.dataset.volumeLevel = volumeLevel;
    }
  };

  const handleVolumeScrub = (e: MouseEvent) => {
    const video = videoRef.current;
    const volumeSlider = volumeSliderRef.current;
    if(video && volumeSlider) {
        const rect = volumeSlider.getBoundingClientRect();
        const percent = Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width;
        video.volume = percent;
        video.muted = percent === 0;
        handleVideoVolumeChange();
    }
  };
  
  const toggleScrubbing = (e: MouseEvent, scrubbing: boolean) => {
    const video = videoRef.current;
    const progressContainer = progressContainerRef.current;
    if (!video || !progressContainer) return;
    
    progressContainer.classList.toggle("scrubbing", scrubbing);
    if (scrubbing) {
        wasPausedRef.current = video.paused;
        video.pause();
    } else {
        if (!wasPausedRef.current) {
            video.play().catch((error: any) => {
                if (error.name !== 'AbortError') {
                    console.error("Error playing video after scrubbing:", error);
                }
            });
        }
    }
    handleSeek(e);
  }

  const toggleFullScreen = () => {
    const playerContainer = playerContainerRef.current;
    if (!playerContainer) return;

    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        playerContainer.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    const playBtn = playBtnRef.current;
    const progressContainer = progressContainerRef.current;
    const muteBtn = muteBtnRef.current;
    const volumePanel = volumePanelRef.current;
    const fullscreenBtn = fullscreenBtnRef.current;
    const playerContainer = playerContainerRef.current;

    if (!video || !playBtn || !progressContainer || !muteBtn || !volumePanel || !fullscreenBtn || !playerContainer) return;

    // State updaters
    const onLoadedMetadata = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
        if(playerContainer) playerContainer.dataset.fullscreen = String(!!document.fullscreenElement);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener("volumechange", handleVideoVolumeChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('click', togglePlayPause);
    playBtn.addEventListener('click', togglePlayPause);
    muteBtn.addEventListener('click', toggleMute);
    fullscreenBtn.addEventListener('click', toggleFullScreen);
    
    // Mouse events for seeking
    progressContainer.addEventListener('mousemove', handleHover);
    progressContainer.addEventListener('mouseleave', handleMouseLeave);
    
    let isScrubbing = false;
    const handleProgressMouseDown = (e: MouseEvent) => {
        isScrubbing = true;
        toggleScrubbing(e, true);
    };
    progressContainer.addEventListener("mousedown", handleProgressMouseDown);
    
    // Mouse events for volume
    let isVolumeScrubbing = false;
    const handleVolumeMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        isVolumeScrubbing = true;
        if(volumePanel) volumePanel.classList.add('scrubbing');
        handleVolumeScrub(e);
    };
    if (volumeSliderRef.current) {
        volumeSliderRef.current.addEventListener("mousedown", handleVolumeMouseDown);
    }


    // Global mouse up/move for scrubbing
    const handleMouseUp = (e: MouseEvent) => {
        if (isScrubbing) {
            isScrubbing = false;
            toggleScrubbing(e, false);
        }
        if(isVolumeScrubbing) {
            isVolumeScrubbing = false;
            if(volumePanel) volumePanel.classList.remove('scrubbing');
        }
    };
    const handleMouseMove = (e: MouseEvent) => {
        if (isScrubbing) handleSeek(e);
        if (isVolumeScrubbing) handleVolumeScrub(e);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    // Initial state setup
    handleVideoVolumeChange();
    if(playerContainer) playerContainer.dataset.fullscreen = String(!!document.fullscreenElement);


    return () => {
      if (!video || !playBtn || !progressContainer || !muteBtn || !volumePanel || !fullscreenBtn) return;
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener("volumechange", handleVideoVolumeChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('click', togglePlayPause);

      playBtn.removeEventListener('click', togglePlayPause);
      progressContainer.removeEventListener('mousemove', handleHover);
      progressContainer.removeEventListener('mouseleave', handleMouseLeave);
      progressContainer.removeEventListener("mousedown", handleProgressMouseDown);
      muteBtn.removeEventListener('click', toggleMute);
      fullscreenBtn.removeEventListener('click', toggleFullScreen);
      if (volumeSliderRef.current) {
        volumeSliderRef.current.removeEventListener("mousedown", handleMouseDown);
      }

      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const getPlayButtonPath = () => {
    if (isPlaying) {
      return "M 9 9 H 13 V 27 H 9 V 9 Z M 23 9 H 27 V 27 H 23 V 9 Z";
    }
    return "M 17 8.6 L 10.89 4.99 C 9.39 4.11 7.5 5.19 7.5 6.93 C 7.5 6.93 7.5 6.93 7.5 6.93 L 7.5 29.06 C 7.5 30.8 9.39 31.88 10.89 31 C 10.89 31 10.89 31 10.89 31 L 17 27.4 C 17 27.4 17 27.4 17 27.4 C 17 27.4 17 27.4 17 27.4 L 17 8.6 C 17 8.6 17 8.6 17 8.6 C 17 8.6 17 8.6 17 8.6 Z M 17 8.6 L 17 8.6 C 17 8.6 17 8.6 17 8.6 C 17 8.6 17 8.6 17 8.6 V 27.4 C 17 27.4 17 27.4 17 27.4 C 17 27.4 17 27.4 17 27.4 L 33 18 C 33 18 33 18 33 18 C 33 18 33 18 33 18 V 18 L 17 8.6 C 17 8.6 17 8.6 17 8.6 C 17 8.6 17 8.6 17 8.6 Z";
  };
  
  return (
    <div className="flex justify-center items-center h-screen bg-black">
      <div ref={playerContainerRef} className="html5-video-player" id="movie_player">
        <div className="html5-video-container">
          <video ref={videoRef} id="video" src="/video/video1.mp4"></video>
        </div>

        <div ref={progressContainerRef} className="ytp-progress-bar-container" id="progressContainer">
          <div className="ytp-progress-bar" tabIndex={0} role="slider" aria-label="Seek slider">
            <div ref={loadProgressRef} className="ytp-load-progress" id="loadProgress"></div>
            <div ref={hoverProgressRef} className="ytp-hover-progress" id="hoverProgress"></div>
            <div ref={playProgressRef} className="ytp-play-progress" id="playProgress"></div>
            <div ref={scrubberRef} className="ytp-scrubber-container" id="scrubber">
              <div className="ytp-scrubber-button"></div>
            </div>
          </div>
        </div>

        <div className="ytp-gradient-bottom"></div>

        <div className="ytp-chrome-controls">
          <div className="ytp-left-controls">
            <button ref={playBtnRef} className="ytp-play-button ytp-button" title={isPlaying ? "Pause" : "Play"} aria-label={isPlaying ? "Pause" : "Play"}>
              <svg fill="white" height="36" viewBox="0 0 36 36" width="36">
                <path d={getPlayButtonPath()}></path>
              </svg>
            </button>
            <a className="ytp-prev-button ytp-button" title="Replay">
                <svg fill="white" height="24" viewBox="0 0 24 24" width="24"><path d="M4 4C3.73 4 3.48 4.10 3.29 4.29C3.10 4.48 3 4.73 3 5V19C3 19.26 3.10 19.51 3.29 19.70C3.48 19.89 3.73 20 4 20C4.26 20 4.51 19.89 4.70 19.70C4.89 19.51 5 19.26 5 19V5C5 4.73 4.89 4.48 4.70 4.29C4.51 4.10 4.26 4 4 4ZM18.95 4.23L6 12.00L18.95 19.77C19.15 19.89 19.39 19.96 19.63 19.96C19.87 19.97 20.10 19.91 20.31 19.79C20.52 19.67 20.69 19.50 20.81 19.29C20.93 19.09 21.00 18.85 21 18.61V5.38C20.99 5.14 20.93 4.91 20.81 4.70C20.69 4.50 20.52 4.33 20.31 4.21C20.10 4.09 19.87 4.03 19.63 4.03C19.39 4.04 19.15 4.10 18.95 4.23Z"></path></svg>
            </a>
             <a className="ytp-next-button ytp-button" title="Next">
                <svg fill="white" height="24" viewBox="0 0 24 24" width="24"><path d="M20 20C20.26 20 20.51 19.89 20.70 19.70C20.89 19.51 21 19.26 21 19V5C21 4.73 20.89 4.48 20.70 4.29C20.51 4.10 20.26 4 20 4C19.73 4 19.48 4.10 19.29 4.29C19.10 4.48 19 4.73 19 5V19C19 19.26 19.10 19.51 19.29 19.70C19.48 19.89 19.73 20 20 20ZM5.04 19.77L18 12L5.04 4.22C4.84 4.10 4.60 4.03 4.36 4.03C4.12 4.03 3.89 4.09 3.68 4.21C3.47 4.32 3.30 4.49 3.18 4.70C3.06 4.91 2.99 5.14 3 5.38V18.61C2.99 18.85 3.06 19.08 3.18 19.29C3.30 19.50 3.47 19.67 3.68 19.79C3.89 19.90 4.12 19.96 4.36 19.96C4.60 19.96 4.84 19.89 5.04 19.77Z" ></path></svg>
            </a>
            
            <span ref={volumeAreaRef} className="ytp-volume-area">
                <button ref={muteBtnRef} className="ytp-mute-button ytp-button" title={isMuted ? "Unmute" : "Mute"}>
                    <svg height="24" viewBox="0 0 24 24" width="24">
                        <path className="ytp-svg-fill ytp-svg-volume-animation-speaker" d="M 11.60 2.08 L 11.48 2.14 L 3.91 6.68 C 3.02 7.21 2.28 7.97 1.77 8.87 C 1.26 9.77 1.00 10.79 1 11.83 V 12.16 L 1.01 12.56 C 1.07 13.52 1.37 14.46 1.87 15.29 C 2.38 16.12 3.08 16.81 3.91 17.31 L 11.48 21.85 C 11.63 21.94 11.80 21.99 11.98 21.99 C 12.16 22.00 12.33 21.95 12.49 21.87 C 12.64 21.78 12.77 21.65 12.86 21.50 C 12.95 21.35 13 21.17 13 21 V 3 C 12.99 2.83 12.95 2.67 12.87 2.52 C 12.80 2.37 12.68 2.25 12.54 2.16 C 12.41 2.07 12.25 2.01 12.08 2.00 C 11.92 1.98 11.75 2.01 11.60 2.08 Z" fill="#fff"></path>
                        <path className="ytp-svg-volume-animation-small-ripple" d=" M 15.53 7.05 C 15.35 7.22 15.25 7.45 15.24 7.70 C 15.23 7.95 15.31 8.19 15.46 8.38 L 15.53 8.46 L 15.70 8.64 C 16.09 9.06 16.39 9.55 16.61 10.08 L 16.70 10.31 C 16.90 10.85 17 11.42 17 12 L 16.99 12.24 C 16.96 12.73 16.87 13.22 16.70 13.68 L 16.61 13.91 C 16.36 14.51 15.99 15.07 15.53 15.53 C 15.35 15.72 15.25 15.97 15.26 16.23 C 15.26 16.49 15.37 16.74 15.55 16.92 C 15.73 17.11 15.98 17.21 16.24 17.22 C 16.50 17.22 16.76 17.12 16.95 16.95 C 17.6 16.29 18.11 15.52 18.46 14.67 L 18.59 14.35 C 18.82 13.71 18.95 13.03 18.99 12.34 L 19 12 C 18.99 11.19 18.86 10.39 18.59 9.64 L 18.46 9.32 C 18.15 8.57 17.72 7.89 17.18 7.3 L 16.95 7.05 L 16.87 6.98 C 16.68 6.82 16.43 6.74 16.19 6.75 C 15.94 6.77 15.71 6.87 15.53 7.05" fill="#fff" transform="translate(18, 12) scale(1) translate(-18,-12)"></path>
                        <path className="ytp-svg-volume-animation-big-ripple" d="M18.36 4.22C18.18 4.39 18.08 4.62 18.07 4.87C18.05 5.12 18.13 5.36 18.29 5.56L18.36 5.63L18.66 5.95C19.36 6.72 19.91 7.60 20.31 8.55L20.47 8.96C20.82 9.94 21 10.96 21 11.99L20.98 12.44C20.94 13.32 20.77 14.19 20.47 15.03L20.31 15.44C19.86 16.53 19.19 17.52 18.36 18.36C18.17 18.55 18.07 18.80 18.07 19.07C18.07 19.33 18.17 19.59 18.36 19.77C18.55 19.96 18.80 20.07 19.07 20.07C19.33 20.07 19.59 19.96 19.77 19.77C20.79 18.75 21.61 17.54 22.16 16.20L22.35 15.70C22.72 14.68 22.93 13.62 22.98 12.54L23 12C22.99 10.73 22.78 9.48 22.35 8.29L22.16 7.79C21.67 6.62 20.99 5.54 20.15 4.61L19.77 4.22L19.70 4.15C19.51 3.99 19.26 3.91 19.02 3.93C18.77 3.94 18.53 4.04 18.36 4.22 Z" fill="#fff" transform="translate(22, 12) scale(1) translate(-22, -12)"></path>
                    </svg>
                </button>
              <div ref={volumePanelRef} className="ytp-volume-panel" title="Volume">
                <div ref={volumeSliderRef} className="ytp-volume-slider" draggable="true">
                  <div ref={volumeHandleRef} className="ytp-volume-slider-handle"></div>
                </div>
              </div>
            </span>

             <div ref={timeDisplayRef} className="ytp-time-display" id="time">{formatTime(currentTime)} / {formatTime(duration)}</div>
          </div>

          <div className="ytp-right-controls">
            <button className="ytp-subtitles-button ytp-button" title="Subtitles/closed captions unavailable">
                <svg className="ytp-subtitles-button-icon" height="100%" version="1.1" viewBox="0 0 36 36" width="100%" fillOpacity="0.3">
                    <path d="M11,11 C9.89,11 9,11.9 9,13 L9,23 C9,24.1 9.89,25 11,25 L25,25 C26.1,25 27,24.1 27,23 L27,13 C27,11.9 26.1,11 25,11 L11,11 Z M17,17 L15.5,17 L15.5,16.5 L13.5,16.5 L13.5,19.5 L15.5,19.5 L15.5,19 L17,19 L17,20 C17,20.55 16.55,21 16,21 L13,21 C12.45,21 12,20.55 12,20 L12,16 C12,15.45 12.45,15 13,15 L16,15 C16.55,15 17,15.45 17,16 L17,17 L17,17 Z M24,17 L22.5,17 L22.5,16.5 L20.5,16.5 L20.5,19.5 L22.5,19.5 L22.5,19 L24,19 L24,20 C24,20.55 23.55,21 23,21 L20,21 C19.45,21 19,20.55 19,20 L19,16 C19,15.45 19.45,15 20,15 L23,15 C23.55,15 24,15.45 24,16 L24,17 L24,17 Z" fill="#fff"></path>
                </svg>
            </button>
            <button className="ytp-button ytp-settings-button" title="Settings">
              <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
                <path d="m 23.94,18.78 c .03,-0.25 .05,-0.51 .05,-0.78 0,-0.27 -0.02,-0.52 -0.05,-0.78 l 1.68,-1.32 c .15,-0.12 .19,-0.33 .09,-0.51 l -1.6,-2.76 c -0.09,-0.17 -0.31,-0.24 -0.48,-0.17 l -1.99,.8 c -0.41,-0.32 -0.86,-0.58 -1.35,-0.78 l -0.30,-2.12 c -0.02,-0.19 -0.19,-0.33 -0.39,-0.33 l -3.2,0 c -0.2,0 -0.36,.14 -0.39,.33 l -0.30,2.12 c -0.48,.2 -0.93,.47 -1.35,.78 l -1.99,-0.8 c -0.18,-0.07 -0.39,0 -0.48,.17 l -1.6,2.76 c -0.10,.17 -0.05,.39 .09,.51 l 1.68,1.32 c -0.03,.25 -0.05,.52 -0.05,.78 0,.26 .02,.52 .05,.78 l -1.68,1.32 c -0.15,.12 -0.19,.33 -0.09,.51 l 1.6,2.76 c .09,.17 .31,.24 .48,.17 l 1.99,-0.8 c .41,.32 .86,.58 1.35,.78 l .30,2.12 c .02,.19 .19,.33 .39,.33 l 3.2,0 c .2,0 .36,-0.14 .39,-0.33 l .30,-2.12 c .48,-0.2 .93,-0.47 1.35,-0.78 l 1.99,.8 c .18,.07 .39,0 .48,.17 l 1.6,-2.76 c .09,-0.17 .05,-0.39 -0.09,-0.51 l -1.68,-1.32 0,0 z m -5.94,2.01 c -1.54,0 -2.8,-1.25 -2.8,-2.8 0,-1.54 1.25,-2.8 2.8,-2.8 1.54,0 2.8,1.25 2.8,2.8 0,1.54 -1.25,2.8 -2.8,2.8 l 0,0 z" fill="#fff"></path>
              </svg>
            </button>
            <button ref={fullscreenBtnRef} className="ytp-fullscreen-button ytp-button" title={isFullscreen ? "Exit full screen" : "Full screen"}>
                <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
                    <g className="ytp-fullscreen-button-corner-0"><path className="ytp-svg-fill" d="m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z"></path></g>
                    <g className="ytp-fullscreen-button-corner-1"><path className="ytp-svg-fill" d="m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z"></path></g>
                    <g className="ytp-fullscreen-button-corner-2"><path className="ytp-svg-fill" d="m 24,24 -4,0 0,2 L 26,26 l 0,-6 -2,0 0,4 0,0 z"></path></g>
                    <g className="ytp-fullscreen-button-corner-3"><path className="ytp-svg-fill" d="M 12,20 10,20 10,26 l 6,0 0,-2 -4,0 0,-4 0,0 z"></path></g>
                </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
