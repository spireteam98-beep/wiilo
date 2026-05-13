"use client";
import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { FaPlay, FaPause, FaExpand, FaCompress, FaVolumeUp, FaVolumeMute, FaCog, FaBackward, FaForward, FaStepBackward, FaStepForward, FaFastForward, FaFastBackward } from 'react-icons/fa';
import { BiExitFullscreen } from 'react-icons/bi';
import { MdClosedCaption, MdSubtitles, MdVolumeUp, MdVolumeOff } from 'react-icons/md';
import { AiOutlineArrowRight } from 'react-icons/ai';
import { IoMdSkipBackward, IoMdSkipForward } from 'react-icons/io';
import { BsThreeDotsVertical, BsSpeedometer2 } from 'react-icons/bs';
import { HiOutlineQueueList } from 'react-icons/hi2';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

interface VideoPlayerProps {
  src?: string;
  title?: string;
  poster?: string;
  onEnded?: () => void;
  subtitles?: Array<{
    label: string;
    src: string;
  }>;
  isMobile?: boolean;
  isTablet?: boolean;
  isDesktop?: boolean;
  autoPlay?: boolean;
  controls?: boolean;
  content?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  title, 
  poster, 
  onEnded, 
  subtitles = [], 
  isMobile = false, 
  isTablet = false, 
  isDesktop = true,
  autoPlay = false,
  controls = true,
  content
}) => {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [episodeIndex, setEpisodeIndex] = useState(0);
  const [showSpeedControls, setShowSpeedControls] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showRewind, setShowRewind] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const episodes = [
    { title: 'Royal House', src: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/adv_dv_atmos/main.m3u8' },
    { title: 'Episode 2', src: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8' },
    { title: 'Episode 3', src: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8' }
  ];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check if the source is HLS (m3u8)
    if (src && src.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        if (videoRef.current && videoRef.current.duration) {
          setDuration(videoRef.current.duration);
        }
      });
    } else {
      // For MP4 and other direct video sources
      video.src = src || '';
      video.load(); // Force load the video
      
      // Set initial duration once metadata is loaded
      video.addEventListener('loadedmetadata', () => {
        setDuration(video.duration);
      }, { once: true });
    }

    // Common event listeners for both HLS and MP4
    const handleTimeUpdate = () => {
      if (!isNaN(video.currentTime)) {
        setCurrentTime(video.currentTime);
      }
    };

    const handleDurationChange = () => {
      if (!isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };

    const handleWaiting = () => setBuffering(true);
    const handlePlaying = () => setBuffering(false);
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('progress', () => {
      setCurrentTime(prev => prev);
    });

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('progress', () => {});
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      video.src = ''; // Clear the source on cleanup
    };
  }, [src]);

  useEffect(() => {
    if (!playing) {
      setShowControls(true);
    }
  }, [playing]);

  const togglePlay = async () => {
    if (!videoRef.current) return;
    try {
      if (playing) {
        videoRef.current.pause();
      } else {
        await videoRef.current.play();
      }
      setPlaying(!playing);
    } catch (error) {
      console.log('Playback error:', error);
      setPlaying(false);
    }
  };

  const handleProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current && !isNaN(time)) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = value;
      setVolume(value);
      setMuted(value === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    
    // Clear any existing timeout
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    // Set new timeout to hide controls after 3 seconds
    const timeout = setTimeout(() => {
      if (playing) {
        setShowControls(false);
      }
    }, 3000);
    
    setControlsTimeout(timeout);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click from triggering when clicking controls
    if ((e.target as HTMLElement).closest('.controls-wrapper')) {
      return;
    }
    
    setShowControls(true);
    togglePlay();
    
    // Clear and set timeout for controls visibility
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    const timeout = setTimeout(() => {
      if (playing) {
        setShowControls(false);
      }
    }, 3000);
    
    setControlsTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  const handlePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackSpeed(rate);
    }
  };

  const toggleSubtitles = () => {
    if (subtitles && subtitles.length > 0) {
      setSubtitlesEnabled(!subtitlesEnabled);
      if (videoRef.current) {
        videoRef.current.textTracks[0].mode = subtitlesEnabled ? 'hidden' : 'showing';
      }
    }
  };

  const handleLeftClick = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
      setCurrentTime(videoRef.current.currentTime);
      setShowRewind(true);
      setTimeout(() => setShowRewind(false), 800); // Hide after 800ms
    }
  };

  const handleRightClick = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
      setCurrentTime(videoRef.current.currentTime);
      setShowForward(true);
      setTimeout(() => setShowForward(false), 800); // Hide after 800ms
    }
  };

  const handleNextEpisode = () => {
    const nextIndex = episodeIndex + 1;
    if (nextIndex < episodes.length) {
      setEpisodeIndex(nextIndex);
      const nextEpisode = episodes[nextIndex];
      if (videoRef.current) {
        videoRef.current.src = nextEpisode.src;
        videoRef.current.play();
      }
    }
  };

  const handleRewind = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black"
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        playsInline
        onEnded={onEnded}
      >
        <source src={src} type="application/x-mpegURL" />
        {subtitles.map((subtitle, index) => (
          <track 
            key={index}
            kind="subtitles"
            label={subtitle.label}
            src={subtitle.src}
            default={subtitlesEnabled && index === 0}
          />
        ))}
      </video>

      {/* Netflix-style gradient overlays */}
      {showControls && (
        <>
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/60 to-transparent" />
        </>
      )}

      {/* Video Controls */}
      <div 
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300
          ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Title */}
        <div className="absolute top-4 left-4">
          <h1 className="text-white text-2xl font-bold">{title}</h1>
        </div>

        <div className="video-controls p-4">
          {/* Progress bar */}
          <div className="progress-bar group mb-2">
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleProgress}
              className="w-full cursor-pointer"
            />
            <div 
              className="progress-bar-fill"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={togglePlay}
                className="play-button hover:scale-110 transition"
              >
                {playing ? <FaPause size={20} /> : <FaPlay size={20} />}
              </button>

              <button onClick={handleRewind}>
                <IoMdSkipBackward size={24} />
              </button>

              <button onClick={handleSkipForward}>
                <IoMdSkipForward size={24} />
              </button>

              <div className="group relative">
                <button onClick={toggleMute}>
                  {muted ? <MdVolumeOff size={24} /> : <MdVolumeUp size={24} />}
                </button>
                <div className="volume-slider opacity-0 group-hover:opacity-100 transition-opacity">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolume}
                    className="w-24"
                  />
                </div>
              </div>

              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <button onClick={toggleSubtitles}>
                {subtitlesEnabled ? <MdSubtitles size={24} /> : <MdClosedCaption size={24} />}
              </button>

              <button onClick={toggleFullscreen}>
                {isFullscreen ? <FaCompress size={20} /> : <FaExpand size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading spinner */}
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="netflix-loader" />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;