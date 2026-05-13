'use client';

import React from 'react';
import {
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Clock,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Button } from './ui/button';

type PlayerControlsProps = {
  state: any;
  actions: any;
  videoTitle: string;
  videoRef: React.RefObject<HTMLVideoElement>;
};

const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) {
    return '00:00';
  }
  const date = new Date(0);
  date.setSeconds(timeInSeconds);
  const timeString = date.toISOString().substr(11, 8);
  return timeString.startsWith('00:') ? timeString.substr(3) : timeString;
};

const SkipPreviousIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="scale(-1, 1)">
        <path d="M5 5.5V18.5L13.5 12L5 5.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.5 5.5V18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


const SkipNextIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 5.5V18.5L13.5 12L5 5.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.5 5.5V18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const SubtitlesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 15H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 11H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 11H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4l15 8-15 8z" />
    </svg>
);

const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
    </svg>
);

export default function PlayerControls({
  state,
  actions,
  videoTitle,
  videoRef
}: PlayerControlsProps) {
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const clickPositionX = e.clientX - progressBar.getBoundingClientRect().left;
    const progressBarWidth = progressBar.offsetWidth;
    const percentage = (clickPositionX / progressBarWidth) * 100;
    actions.handleSeek(percentage);
  };
  
  const handleVolumeChange = (value: number[]) => {
    actions.setVolume(value[0]);
  };

  const timeToShow = state.isPlaying
    ? `-${formatTime(state.duration - state.currentTime)}`
    : formatTime(state.duration);

  return (
    <div
      className={`controls-container ${
        state.showControls ? 'opacity-100' : 'opacity-0'
      }`}
      onMouseMove={actions.showControls}
    >
      <div className="progress-controls">
        <div className="progress-bar" onClick={handleProgressClick}>
          <div
            className="watched-bar"
            style={{ width: `${state.progress}%` }}
          ></div>
          <div
            className="buffered-bar"
            style={{ width: `${state.buffered}%` }}
           ></div>
          <div className="playhead" style={{ left: `${state.progress}%` }}></div>
        </div>
      </div>
      <div className="controls">
        {/* Left Controls */}
        <div className="flex items-center gap-4">
            <button onClick={actions.togglePlay} aria-label={state.isPlaying ? 'Pause' : 'Play'}>
                {state.isPlaying ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7" />}
            </button>
            <button onClick={() => {}} aria-label="Previous episode">
                <SkipPreviousIcon className="w-7 h-7" />
            </button>
            <button onClick={() => {}} aria-label="Next episode">
                <SkipNextIcon className="w-7 h-7" />
            </button>
            <div className="flex items-center gap-2">
                 <button onClick={actions.toggleMute} aria-label={state.isMuted ? 'Unmute' : 'Mute'}>
                    {state.isMuted || state.volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
                <div className="w-24">
                    <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={[state.volume]}
                        onValueChange={handleVolumeChange}
                        className="w-full"
                        aria-label="Volume slider"
                        thumbClassName="h-3 w-3"
                        rangeClassName="bg-white"
                    />
                </div>
            </div>
            <div className="time-display hidden md:block">
                {formatTime(state.currentTime)} / {formatTime(state.duration)}
            </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
            <div className="time-display md:hidden">
                {timeToShow}
            </div>
            
            {videoRef.current && videoRef.current.textTracks.length > 0 && (
                <Popover>
                    <PopoverTrigger asChild>
                        <button aria-label="Subtitles"><SubtitlesIcon className="w-6 h-6" /></button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-48 bg-black bg-opacity-80 border-gray-700 text-white p-0">
                        <Button variant="ghost" className="w-full justify-start rounded-none" onClick={() => actions.changeSubtitle('off')}>
                            Off
                        </Button>
                        {Array.from(videoRef.current.textTracks).map(track => (
                            <Button
                                key={track.language}
                                variant="ghost"
                                className="w-full justify-start rounded-none"
                                onClick={() => actions.changeSubtitle(track.language)}
                            >
                                {track.label}
                            </Button>
                        ))}
                    </PopoverContent>
                </Popover>
            )}

            <Popover>
                <PopoverTrigger asChild>
                    <button aria-label="More options"><MoreHorizontal className="w-6 h-6" /></button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 bg-black bg-opacity-80 border-gray-700 text-white p-0">
                   <div className="flex flex-col">
                        <Popover>
                            <PopoverTrigger asChild>
                               <Button variant="ghost" className="w-full justify-between rounded-none">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4"/> <span>Playback speed</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>{state.playbackRate === 1 ? 'Normal' : `${state.playbackRate}x`}</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent side="left" align="end" className="w-32 bg-black bg-opacity-80 border-gray-700 text-white p-0">
                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                                    <Button
                                        key={rate}
                                        variant="ghost"
                                        className="w-full justify-start rounded-none"
                                        onClick={() => actions.changePlaybackRate(rate)}
                                    >
                                        {rate === 1 ? 'Normal' : `${rate}x`}
                                    </Button>
                                ))}
                            </PopoverContent>
                        </Popover>
                   </div>
                </PopoverContent>
            </Popover>
            <button onClick={actions.toggleFullScreen} aria-label={state.isFullScreen ? 'Exit full screen' : 'Enter full screen'}>
                {state.isFullScreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
            </button>
        </div>
      </div>
    </div>
  );
}
