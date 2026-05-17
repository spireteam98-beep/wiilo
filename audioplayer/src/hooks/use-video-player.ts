'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Video } from '@/lib/videos';

const VIEWING_HISTORY_KEY = 'streamflow_viewing_history';
const PLAYBACK_POSITION_KEY_PREFIX = 'streamflow_playback_position_';
const WATCHED_THRESHOLD = 0.9; // 90% watched

export function useVideoPlayer(video: Video) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    isMuted: false,
    volume: 1,
    progress: 0,
    playbackRate: 1,
    isFullScreen: false,
    duration: 0,
    currentTime: 0,
    showControls: true,
    activeSubtitle: 'off',
    buffered: 0,
    hasStarted: false, // To track if the video has been played at least once
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateState = (newState: Partial<typeof playerState>) => {
    setPlayerState((prevState) => ({ ...prevState, ...newState }));
  };
  
  const changeSubtitle = useCallback((lang: string, show: boolean = true) => {
    const videoElement = videoRef.current;
    if (videoElement) {
        let activeLang = 'off';
        for (let i = 0; i < videoElement.textTracks.length; i++) {
            const track = videoElement.textTracks[i];
             if (track.language === lang && show) {
                track.mode = 'showing';
                activeLang = lang;
            } else {
                track.mode = 'hidden';
            }
        }
        updateState({ activeSubtitle: activeLang });
    }
  }, []);

  // Resume from localStorage
  useEffect(() => {
    if (!isClient) return;
    
    const videoElement = videoRef.current;
    if (!videoElement || !video) return;

    const savedPosition = localStorage.getItem(`${PLAYBACK_POSITION_KEY_PREFIX}${video.id}`);
    if (savedPosition) {
      const time = parseFloat(savedPosition);
      if (!isNaN(time)) {
        // Set current time once metadata is loaded
        const onLoadedMetadata = () => {
            if (videoElement) {
                videoElement.currentTime = time;
                updateState({ duration: videoElement.duration });
            }
        };
        videoElement.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
        return () => videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
      }
    }
  }, [video, isClient]);


  const togglePlay = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (playerState.isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
    updateState({ isPlaying: !playerState.isPlaying, hasStarted: true });
  }, [playerState.isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (!isClient) return;
    const videoElement = videoRef.current;
    if (!videoElement || !isFinite(videoElement.duration)) return;

    const progress = (videoElement.currentTime / videoElement.duration) * 100;
    updateState({ progress, currentTime: videoElement.currentTime });
    
    // Save current time to localStorage (throttled by timeupdate event)
    localStorage.setItem(`${PLAYBACK_POSITION_KEY_PREFIX}${video.id}`, String(videoElement.currentTime));

    // Check if video is watched
    if (videoElement.currentTime / videoElement.duration > WATCHED_THRESHOLD) {
      addToViewingHistory(video.title);
    }
  }, [video, isClient]);

  const handleLoadedMetadata = useCallback(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      updateState({ duration: videoElement.duration, currentTime: videoElement.currentTime });
      
       if(isClient) {
         // Restore volume from localStorage
        const savedVolume = localStorage.getItem('streamflow_volume');
        const volume = savedVolume ? parseFloat(savedVolume) : 1;
        const isMuted = localStorage.getItem('streamflow_muted') === 'true';

        videoElement.volume = volume;
        videoElement.muted = isMuted;

        updateState({ volume, isMuted });
       }
    }
  }, [isClient]);

  const handleLoadedData = useCallback(() => {
    const videoElement = videoRef.current;
    if(videoElement && videoElement.textTracks.length > 0) {
        // Auto-select first subtitle track if available, but keep it hidden by default
        const firstSub = video.subtitles[0];
        if (firstSub) {
            changeSubtitle(firstSub.lang, false); // don't show by default
        }
    }
  }, [video.subtitles, changeSubtitle]);

  const handleProgress = useCallback(() => {
    const videoElement = videoRef.current;
    if (videoElement && videoElement.buffered.length > 0 && isFinite(videoElement.duration)) {
      const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
      const duration = videoElement.duration;
      if(duration > 0){
        updateState({ buffered: (bufferedEnd / duration) * 100 });
      }
    }
  }, []);

  const handleVideoEnd = useCallback(() => {
    updateState({ isPlaying: false });
    if (isClient) {
      addToViewingHistory(video.title);
      localStorage.removeItem(`${PLAYBACK_POSITION_KEY_PREFIX}${video.id}`);
    }
  }, [video, isClient]);

  const handleSeek = useCallback((value: number) => {
    const videoElement = videoRef.current;
    if (videoElement && isFinite(videoElement.duration)) {
      const newTime = (value / 100) * videoElement.duration;
      videoElement.currentTime = newTime;
      updateState({ progress: value, currentTime: newTime });
    }
  }, []);
  
  const seek = useCallback((amount: number) => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.currentTime += amount;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const videoElement = videoRef.current;
    if (videoElement && isClient) {
      const newMutedState = !videoElement.muted;
      videoElement.muted = newMutedState;
      updateState({ isMuted: newMutedState });
      localStorage.setItem('streamflow_muted', String(newMutedState));
    }
  }, [isClient]);

  const setVolume = useCallback((value: number) => {
    const videoElement = videoRef.current;
    if (videoElement && isClient) {
      const newVolume = Math.max(0, Math.min(1, value));
      videoElement.volume = newVolume;
      const isMuted = newVolume === 0;
      videoElement.muted = isMuted;
      updateState({ volume: newVolume, isMuted });
      localStorage.setItem('streamflow_volume', String(newVolume));
       localStorage.setItem('streamflow_muted', String(isMuted));
    }
  }, [isClient]);
  
const toggleFullScreen = useCallback(async () => {
  const container = playerContainerRef.current;
  const isMobile = window.innerWidth <= 768;

  if (!playerState.isFullScreen) {
    try {
      if (container?.requestFullscreen) {
        await container.requestFullscreen({ navigationUI: "hide" });
      }

      // Force landscape orientation on mobile
      if (isMobile && screen.orientation?.lock) {
        await screen.orientation.lock("landscape");
      }

      setPlayerState(prev => ({ ...prev, isFullScreen: true }));
    } catch (err) {
      console.error("Fullscreen or orientation error:", err);
    }
  } else {
    try {
      if (isMobile && screen.orientation?.unlock) {
        screen.orientation.unlock();
      }
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setPlayerState(prev => ({ ...prev, isFullScreen: false }));
    } catch (err) {
      console.error("Exit fullscreen error:", err);
    }
  }
}, [playerState.isFullScreen]);


  const changePlaybackRate = useCallback((rate: number) => {
    const videoElement = videoRef.current;
    if(videoElement) {
      videoElement.playbackRate = rate;
      updateState({ playbackRate: rate });
    }
  }, []);

  const hideControls = () => {
    if (playerState.isPlaying) {
      updateState({ showControls: false });
    }
  };

  const showControls = () => {
     updateState({ showControls: true });
  }

  const handleMouseMove = useCallback(() => {
    showControls();
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(hideControls, 3000);
  }, [playerState.isPlaying]);

  const handleMouseLeave = useCallback(() => {
    if (playerState.isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      hideControls();
    }
  }, [playerState.isPlaying]);

  const handleKeyboardShortcuts = useCallback((e: React.KeyboardEvent) => {
    const { key, metaKey, ctrlKey } = e;
    
    // Allow default browser behavior for some shortcuts
    if (metaKey || ctrlKey) return;
    
    e.preventDefault();

    switch(key.toLowerCase()){
      case ' ':
      case 'k':
        togglePlay();
        break;
      case 'f':
        toggleFullScreen();
        break;
      case 'm':
        toggleMute();
        break;
      case 'arrowright':
        seek(10);
        break;
      case 'arrowleft':
        seek(-10);
        break;
      case 'arrowup':
        setVolume(playerState.volume + 0.1);
        break;
      case 'arrowdown':
        setVolume(playerState.volume - 0.1);
        break;
      case 'l':
        seek(10);
        break;
      case 'j':
        seek(-10);
        break;
      case '>':
         if (videoRef.current) changePlaybackRate(Math.min(videoRef.current.playbackRate + 0.25, 2));
        break;
      case '<':
        if (videoRef.current) changePlaybackRate(Math.max(videoRef.current.playbackRate - 0.25, 0.5));
        break;
    }
  }, [togglePlay, toggleFullScreen, toggleMute, setVolume, seek, changePlaybackRate, playerState.volume]);

  const addToViewingHistory = (videoTitle: string) => {
    if (!isClient) return;
    try {
        const historyJson = localStorage.getItem(VIEWING_HISTORY_KEY);
        let viewingHistory: string[] = historyJson ? JSON.parse(historyJson) : [];
        if (!viewingHistory.includes(videoTitle)) {
            viewingHistory = [videoTitle, ...viewingHistory.slice(0, 9)]; // Keep last 10
            localStorage.setItem(VIEWING_HISTORY_KEY, JSON.stringify(viewingHistory));
        }
    } catch(e) {
        console.error("Could not save viewing history", e);
        localStorage.removeItem(VIEWING_HISTORY_KEY);
    }
  };

  return {
    videoRef,
    playerContainerRef,
    playerState,
    isClient,
    actions: {
      togglePlay,
      handleTimeUpdate,
      handleLoadedMetadata,
      handleLoadedData,
      handleProgress,
      handleSeek,
      seek,
      toggleMute,
      setVolume,
      toggleFullScreen,
      changePlaybackRate,
      changeSubtitle,
      handleMouseMove,
      handleMouseLeave,
      handleKeyboardShortcuts,
      handleVideoEnd,
      showControls
    },
  };
}

    