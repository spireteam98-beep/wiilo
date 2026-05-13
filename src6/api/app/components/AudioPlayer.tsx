"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface AudioState {
  currentTime: number;
  debouncedTime: number;
  writePlaysData: boolean;
  isLoading: boolean;
  hasGuidancePin: boolean;
  isPreplay: boolean;
  isEnded: boolean;
  currentProgrammeDuration: number;
  currentStation: string;
  stations: string[];
}

const BBC_STATIONS = [
  "bbc_1xtra",
  "bbc_radio_one",
  "bbc_radio_one_anthems",
  "bbc_radio_one_dance",
  "bbc_radio_two",
  "bbc_radio_three",
  "bbc_radio_three_unwind",
  "bbc_radio_four",
  "bbc_radio_four_extra",
  "bbc_radio_five_live",
  "bbc_radio_five_live_sports_extra",
  "bbc_6music",
  "bbc_asian_network",
  "bbc_world_service"
];

const AudioPlayer = () => {
  const [state, setState] = useState<AudioState>({
    currentTime: 0,
    debouncedTime: 0,
    writePlaysData: true,
    isLoading: false,
    hasGuidancePin: false,
    isPreplay: true,
    isEnded: false,
    currentProgrammeDuration: 0,
    currentStation: BBC_STATIONS[0],
    stations: BBC_STATIONS
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    fetchMediaManifest(state.currentStation);
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [state.currentStation]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStationChange = (station: string) => {
    setState(prev => ({ ...prev, currentStation: station }));
    setIsPlaying(false);
  };

  const updateCurrentTime = (currentTime: number) => {
    const isNearEnd = currentTime > state.currentProgrammeDuration - 90;
    setState(prev => ({
      ...prev,
      currentTime,
      debouncedTime: Math.floor(currentTime / 5) * 5,
      isEnded: isNearEnd
    }));
  };

  const initializeHLS = (url: string) => {
    if (Hls.isSupported() && audioRef.current) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.attachMedia(audioRef.current);
      hls.loadSource(url);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setState(prev => ({ ...prev, isLoading: false }));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              initializeHLS(url);
              break;
          }
        }
      });

      hlsRef.current = hls;
    }
  };

  const fetchMediaManifest = async (pid: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await fetch(`/api/audio/${pid}`);
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        currentProgrammeDuration: data.duration,
        writePlaysData: true,
      }));

      initializeHLS(data.media_assets[0].url);

    } catch (error) {
      console.error('Failed to fetch media manifest:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
    setState(prev => ({
      ...prev,
      isPreplay: false,
      writePlaysData: true
    }));
  };

  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (state.writePlaysData && !state.isPreplay) {
        localStorage.setItem('bbc-sounds-progress', JSON.stringify({
          time: state.debouncedTime,
          pid: state.currentStation
        }));
      }
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [state.debouncedTime, state.writePlaysData, state.isPreplay, state.currentStation]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-black/60 rounded-lg">
      <div className="relative">
        {state.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="netflix-loader" />
          </div>
        )}
        
        <div className="flex flex-col space-y-4">
          {/* Station Selector */}
          <select 
            value={state.currentStation}
            onChange={(e) => handleStationChange(e.target.value)}
            className="bg-black text-white p-2 rounded border border-[#E31E24]"
          >
            {state.stations.map(station => (
              <option key={station} value={station}>
                {station.split('_').join(' ').toUpperCase()}
              </option>
            ))}
          </select>

          <button 
            onClick={handlePlay}
            className="px-4 py-2 bg-[#E31E24] text-white rounded hover:bg-[#E31E24]/80 transition"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <audio
            ref={audioRef}
            onTimeUpdate={(e) => updateCurrentTime(e.currentTarget.currentTime)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setState(prev => ({ ...prev, isEnded: true }));
            }}
          />

          <div className="progress-bar bg-gray-800 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-[#E31E24] h-full transition-all duration-200"
              style={{ 
                width: `${(state.currentTime / state.currentProgrammeDuration) * 100}%` 
              }}
            />
          </div>

          <div className="flex justify-between text-white text-sm">
            <span>{formatTime(state.currentTime)}</span>
            <span>{formatTime(state.currentProgrammeDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;