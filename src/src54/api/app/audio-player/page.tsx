"use client";

import React, { useEffect, useRef, useState } from 'react';

interface AudioState {
  currentTime: number;
  debouncedTime: number;
  writePlaysData: boolean;
  isLoading: boolean;
  hasGuidancePin: boolean;
  isPreplay: boolean;
  isEnded: boolean;
  currentProgrammeDuration: number;
}

const AudioPlayer = () => {
  const [state, setState] = useState<AudioState>({
    currentTime: 0,
    debouncedTime: 0,
    writePlaysData: true,
    isLoading: false,
    hasGuidancePin: false,
    isPreplay: true,
    isEnded: false,
    currentProgrammeDuration: 0
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  // Similar to the BBC's SMP_UPDATE_CURRENT_TIME action
  const updateCurrentTime = (currentTime: number) => {
    const isNearEnd = currentTime > state.currentProgrammeDuration - 90;
    setState(prev => ({
      ...prev,
      currentTime,
      debouncedTime: Math.floor(currentTime / 5) * 5,
      isEnded: isNearEnd
    }));
  };

  // Similar to BBC's fetchMediaManifest
  const fetchMediaManifest = async (pid: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await fetch(`/programmes/${pid}/playlist.json`);
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        currentProgrammeDuration: data.duration,
        writePlaysData: true
      }));

      return {
        hlsUrl: data.media_assets[0].url,
        duration: data.duration,
        versions: data.media_assets.map((asset: any) => ({
          bitrate: asset.bitrate,
          width: asset.width,
          height: asset.height
        }))
      };
    } catch (error) {
      console.error('Failed to fetch media manifest:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle playback state similar to BBC's implementation
  const handlePlay = () => {
    setState(prev => ({
      ...prev,
      isPreplay: false,
      writePlaysData: true
    }));
  };

  // Save progress using BBC's debounced approach
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (state.writePlaysData && !state.isPreplay) {
        localStorage.setItem('bbc-sounds-progress', JSON.stringify({
          time: state.debouncedTime,
          pid: currentPid
        }));
      }
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [state.debouncedTime, state.writePlaysData, state.isPreplay]);

  const currentPid = "example_pid"; // This would come from your routing/state

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="relative">
        {state.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="netflix-loader" />
          </div>
        )}
        
        <audio
          ref={audioRef}
          onTimeUpdate={(e) => updateCurrentTime(e.currentTarget.currentTime)}
          onPlay={handlePlay}
          onEnded={() => setState(prev => ({ ...prev, isEnded: true }))}
        />

        <div className="progress-bar bg-gray-200 h-1">
          <div 
            className="bg-red-600 h-full transition-all"
            style={{ 
              width: `${(state.currentTime / state.currentProgrammeDuration) * 100}%` 
            }}
          />
        </div>

        <div className="mt-4">
          <span className="text-sm">
            {Math.floor(state.currentTime)} / {state.currentProgrammeDuration}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer; 