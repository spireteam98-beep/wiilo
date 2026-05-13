"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Play,
  Pause,
  ChevronLeft,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  FastForward,
  Lock,
} from 'lucide-react';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import type { User } from 'firebase/auth';

type TvVideo = {
  id: string;
  title: string;
  artist: string;
  thumb: string;
  src: string; // Direct URL to video
};

const TV_VIDEOS: TvVideo[] = [
  {
    id: '1',
    title: 'Maama HG',
    artist: 'Maama HG Official',
    thumb: 'https://picsum.photos/seed/v1/600/400',
    src: 'http://netbeins.com/wp-content/uploads/2026/04/maamahg3.mp4',
  },
  {
    id: '2',
    title: 'Seasons of Calm',
    artist: 'Nature Flow',
    thumb: 'https://picsum.photos/seed/v2/600/400',
    src: 'http://netbeins.com/wp-content/uploads/2026/04/maamahg3.mp4',
  },
  {
    id: '3',
    title: 'Electric Motion',
    artist: 'Vibe Studio',
    thumb: 'https://picsum.photos/seed/v3/600/400',
    src: 'http://netbeins.com/wp-content/uploads/2026/04/xilwareejin.mp4',
  },
  {
    id: '4',
    title: 'Maama HG — Extended',
    artist: 'Maama HG Official',
    thumb: 'https://picsum.photos/seed/v4/600/400',
    src: 'http://netbeins.com/wp-content/uploads/2026/04/maamahg3.mp4',
  },
];

// ── Browse card (grid view) ──────────────────────────────────────────────────
function BrowseCard({
  item,
  unlocked,
  onSelect,
}: {
  item: TvVideo;
  unlocked: boolean;
  onSelect: (video: TvVideo) => void;
}) {
  return (
    <div
      className="group relative cursor-pointer rounded-2xl overflow-hidden border border-white/10 bg-white/5"
      onClick={() => onSelect(item)}
    >
      <div className="relative aspect-video">
        <img src={item.thumb} alt={item.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="h-7 w-7 text-white fill-current ml-1" />
          </div>
        </div>
        {unlocked ? (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/80 backdrop-blur-sm rounded-full px-2 py-1">
            <span className="text-[11px] font-bold text-white">Unlocked</span>
          </div>
        ) : (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
            <Lock className="h-3 w-3 text-yellow-400" />
            <span className="text-[11px] font-bold text-yellow-400">10 coins</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-bold truncate">{item.title}</p>
        <p className="text-[11px] uppercase tracking-wider text-white/50 mt-0.5 truncate">{item.artist}</p>
      </div>
    </div>
  );
}

// ── Coin-gate confirmation modal ─────────────────────────────────────────────
function CoinGateModal({
  video,
  onConfirm,
  onCancel,
  loading,
  error,
}: {
  video: TvVideo;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-white/15 rounded-3xl p-6 max-w-sm w-full space-y-4">
        <div className="aspect-video rounded-xl overflow-hidden">
          <img src={video.thumb} alt={video.title} className="h-full w-full object-cover" />
        </div>
        <div>
          <h2 className="text-lg font-black">{video.title}</h2>
          <p className="text-sm text-white/60 mt-0.5">{video.artist}</p>
        </div>
        <p className="text-sm text-white/70">
          Unlock <strong className="text-white">{video.title}</strong> for{' '}
          <strong className="text-yellow-400">10 coins</strong>. Once unlocked, you can rewatch for free.
        </p>
        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 rounded-xl px-3 py-2">{error}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold transition-colors disabled:opacity-50"
          >
            {loading ? 'Charging…' : 'Watch · 10 Coins'}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(time: number) {
  if (!Number.isFinite(time) || time < 0) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Get video URL (direct external URL)
async function getVideoUrl(videoPath: string): Promise<string> {
  return videoPath; // Return the URL directly
}

function BrandedVideoPlayer({ video }: { video: TvVideo }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [videoUrl, setVideoUrl] = useState<string>('');

  // Load video URL from Firebase Storage
  useEffect(() => {
    getVideoUrl(video.src).then(setVideoUrl);
  }, [video.src]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      return;
    }
    videoRef.current.pause();
    setIsPlaying(false);
  };

  const seekBy = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, videoRef.current.duration || 0));
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    const wrapper = videoRef.current.parentElement;
    if (!wrapper) return;
    if (!document.fullscreenElement) {
      wrapper.requestFullscreen().catch(() => undefined);
      return;
    }
    document.exitFullscreen().catch(() => undefined);
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const pct = Math.min(Math.max(x / rect.width, 0), 1);
    videoRef.current.currentTime = pct * duration;
  };

  return (
    <div className="video-container group/player w-full aspect-video rounded-3xl overflow-hidden border border-white/10">
      <video
        ref={videoRef}
        key={video.id}
        src={videoUrl}
        autoPlay
        playsInline
        className="h-full w-full object-contain bg-black"
        onLoadedMetadata={() => {
          if (!videoRef.current) return;
          setDuration(videoRef.current.duration || 0);
          setIsPlaying(!videoRef.current.paused);
        }}
        onTimeUpdate={() => {
          if (!videoRef.current) return;
          const ct = videoRef.current.currentTime;
          const dur = videoRef.current.duration || 1;
          setCurrentTime(ct);
          setProgress((ct / dur) * 100);

          const bufferedRanges = videoRef.current.buffered;
          if (bufferedRanges.length > 0) {
            const end = bufferedRanges.end(bufferedRanges.length - 1);
            setBuffered((end / dur) * 100);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="controls-container">
        <div className="progress-controls">
          <span className="time-display w-12 text-right pr-2">{formatTime(currentTime)}</span>
          <div ref={progressRef} className="progress-bar" onClick={handleProgressClick}>
            <div className="buffered-bar" style={{ width: `${buffered}%` }} />
            <div className="watched-bar" style={{ width: `${progress}%` }} />
            <div className="playhead" style={{ left: `${progress}%` }} />
          </div>
          <span className="time-display w-12 pl-2">{formatTime(duration)}</span>
        </div>

        <div className="controls">
          <div className="left-controls">
            <button onClick={() => seekBy(-10)} aria-label="Back 10 seconds">
              <RotateCcw className="h-5 w-5" />
            </button>
            <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
            </button>
            <button onClick={() => seekBy(10)} aria-label="Forward 10 seconds">
              <FastForward className="h-5 w-5" />
            </button>
            <div className="video-meta">
              <div className="video-title">{video.title}</div>
              <div className="time-inline">{formatTime(currentTime)} / {formatTime(duration)}</div>
            </div>
          </div>

          <div className="right-controls">
            <button
              onClick={() => {
                const next = volume === 0 ? 1 : 0;
                setVolume(next);
                if (videoRef.current) videoRef.current.volume = next;
              }}
              aria-label="Toggle mute"
            >
              {volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <button onClick={toggleFullscreen} aria-label="Fullscreen">
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page inner (inside Suspense) ────────────────────────────────────────
function TvPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialVideoId = searchParams.get('video');

  type ViewState = 'browse' | 'play';
  const [view, setView] = useState<ViewState>('browse');
  const [selectedVideo, setSelectedVideo] = useState<TvVideo | null>(null);
  const [pendingVideo, setPendingVideo] = useState<TvVideo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [coinLoading, setCoinLoading] = useState(false);
  const [coinError, setCoinError] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [unlockedVideos, setUnlockedVideos] = useState<string[]>([]);
  const [unlockedLoaded, setUnlockedLoaded] = useState(false);

  // Listen for auth state
  useEffect(() => {
    const { auth } = initializeFirebase();
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Load unlocked videos from Firestore once user is known
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setUnlockedVideos([]);
      setUnlockedLoaded(true);
      return;
    }
    setUnlockedLoaded(false);
    const { firestore } = initializeFirebase();
    getDoc(doc(firestore, 'users', user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUnlockedVideos(data.unlockedVideos ?? []);
      } else {
        setUnlockedVideos([]);
      }
      setUnlockedLoaded(true);
    });
  }, [user, authLoading]);

  // Handle ?video=id URL param once data is ready
  const initialHandledRef = useRef(false);
  useEffect(() => {
    if (!initialVideoId || !unlockedLoaded || initialHandledRef.current) return;
    initialHandledRef.current = true;
    const video = TV_VIDEOS.find((v) => v.id === initialVideoId);
    if (!video) return;
    if (unlockedVideos.includes(video.id)) {
      setSelectedVideo(video);
      setView('play');
    } else {
      setCoinError(null);
      setPendingVideo(video);
      setShowModal(true);
    }
  }, [initialVideoId, unlockedLoaded, unlockedVideos]);

  // Click handler for video cards
  const handleSelectVideo = (video: TvVideo) => {
    if (unlockedVideos.includes(video.id)) {
      setSelectedVideo(video);
      setView('play');
      return;
    }
    setCoinError(null);
    setPendingVideo(video);
    setShowModal(true);
  };

  const handleCoinConfirm = async () => {
    if (!pendingVideo || !user) return;
    setCoinLoading(true);
    setCoinError(null);
    try {
      const { firestore } = initializeFirebase();
      const userRef = doc(firestore, 'users', user.uid);
      let alreadyUnlocked = false;
      await runTransaction(firestore, async (tx) => {
        const snap = await tx.get(userRef);
        const data = snap.data() ?? {};
        const currentUnlocked: string[] = data.unlockedVideos ?? [];
        if (currentUnlocked.includes(pendingVideo.id)) {
          alreadyUnlocked = true;
          return;
        }
        const coins: number = data.coins ?? 0;
        if (coins < 10) throw new Error('Not enough coins');
        tx.set(
          userRef,
          {
            coins: coins - 10,
            unlockedVideos: [...new Set([...currentUnlocked, pendingVideo.id])],
          },
          { merge: true }
        );
      });
      // Update local state regardless
      setUnlockedVideos((prev) => [...new Set([...prev, pendingVideo.id])]);
      setSelectedVideo(pendingVideo);
      setView('play');
      setShowModal(false);
      setPendingVideo(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setCoinError(
        message === 'Not enough coins'
          ? "You don't have enough coins to watch this video."
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setCoinLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setPendingVideo(null);
    setCoinError(null);
  };

  // ── Play view ──────────────────────────────────────────────────────────────
  if (view === 'play' && selectedVideo) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] text-white p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('browse')}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              aria-label="Back to films"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{selectedVideo.title}</h1>
          </div>
          <BrandedVideoPlayer video={selectedVideo} />
          <div>
            <h2 className="text-lg font-black mb-3">More Films</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {TV_VIDEOS.filter((v) => v.id !== selectedVideo.id).map((v) => (
                <BrowseCard
                  key={v.id}
                  item={v}
                  unlocked={unlockedVideos.includes(v.id)}
                  onSelect={handleSelectVideo}
                />
              ))}
            </div>
          </div>
        </div>
        {showModal && pendingVideo && (
          <CoinGateModal
            video={pendingVideo}
            onConfirm={handleCoinConfirm}
            onCancel={closeModal}
            loading={coinLoading}
            error={coinError}
          />
        )}
      </main>
    );
  }

  // ── Browse view (default) ──────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            aria-label="Back to home"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Films</h1>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {TV_VIDEOS.map((v) => (
            <BrowseCard
              key={v.id}
              item={v}
              unlocked={unlockedVideos.includes(v.id)}
              onSelect={handleSelectVideo}
            />
          ))}
        </div>
      </div>
      {showModal && pendingVideo && (
        <CoinGateModal
          video={pendingVideo}
          onConfirm={handleCoinConfirm}
          onCancel={closeModal}
          loading={coinLoading}
          error={coinError}
        />
      )}
    </main>
  );
}

export default function TvPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b0b0b]" />}>
      <TvPageInner />
    </Suspense>
  );
}
