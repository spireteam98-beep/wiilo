"use client";

import { useState } from "react";
import VideoPlayer from "@/components/video-player";
import { PlayableFeed } from "@/components/PlayableFeed";
import BottomNav from "@/components/common/bottom-nav";
import Recommendations from "@/components/recommendations";
import { videos, type Video } from "@/lib/videos";

// --- DATA STRUCTURES ---
interface Release {
  name: string;
  type: string;
  year: number;
  image: string;
  videoId: string; // link to a Video.id from videos.ts
}

interface HomeCardItem {
  name: string;
  image: string;
  videoId: string;
}

// --- DATA ARRAYS ---
const masiaOneReleases: Release[] = [
  {
    name: "Wine Pon It (Asian Version)",
    type: "Single",
    year: 2025,
    image: "https://i.scdn.co/image/ab67616d00001e02cdc0ad8059ea760bd4e03615",
    videoId: "big-buck-bunny", // maps to videos[0]
  }
];

const homeCards: HomeCardItem[] = [
  {
    name: "History (feat. James Blake)",
    image: "https://i.scdn.co/image/ab67616d00001e02fecaa7826bb0cbe139a8cb83",
    videoId: "for-bigger-blazes",
  },
  {
    name: "Rain Down (Feat. Sampha)",
    image: "https://i.scdn.co/image/ab67616d00001e0247bcac7a04ff11294c50a044",
    videoId: "big-buck-bunny",
  },
    {
    name: "Rain Down (Feat. Sampha)",
    image: "https://i.scdn.co/image/ab67616d00001e0247bcac7a04ff11294c50a044",
    videoId: "big-buck-bunny",
  },  {
    name: "Rain Down (Feat. Sampha)",
    image: "https://i.scdn.co/image/ab67616d00001e0247bcac7a04ff11294c50a044",
    videoId: "big-buck-bunny",
  },  {
    name: "Rain Down (Feat. Sampha)",
    image: "https://i.scdn.co/image/ab67616d00001e0247bcac7a04ff11294c50a044",
    videoId: "big-buck-bunny",
  },
];

const trendingSongs = [
  {
    name: "Nyaduse",
    artist: "KODONGKLAN",
    image: "https://i.scdn.co/image/ab67616d00001e028b684f5d1926c65e14a83231",
    videoId: "elephants-dream",
  },
  {
    name: "Digi Digi",
    artist: "Abongo Jakabwana",
    image: "https://i.scdn.co/image/ab67616d00001e02ba9ad74e367e3b4d2229593a",
    videoId: "for-bigger-blazes",
  },
   {
    name: "Digi Digi",
    artist: "Abongo Jakabwana",
    image: "https://i.scdn.co/image/ab67616d00001e02ba9ad74e367e3b4d2229593a",
    videoId: "for-bigger-blazes",
  }, {
    name: "Digi Digi",
    artist: "Abongo Jakabwana",
    image: "https://i.scdn.co/image/ab67616d00001e02ba9ad74e367e3b4d2229593a",
    videoId: "for-bigger-blazes",
  },
  {
    name: "Digi Digi",
    artist: "Abongo Jakabwana",
    image: "https://i.scdn.co/image/ab67616d00001e02ba9ad74e367e3b4d2229593a",
    videoId: "for-bigger-blazes",
  },{
    name: "Digi Digi",
    artist: "Abongo Jakabwana",
    image: "https://i.scdn.co/image/ab67616d00001e02ba9ad74e367e3b4d2229593a",
    videoId: "for-bigger-blazes",
  },{
    name: "Digi Digi",
    artist: "Abongo Jakabwana",
    image: "https://i.scdn.co/image/ab67616d00001e02ba9ad74e367e3b4d2229593a",
    videoId: "for-bigger-blazes",
  },
];

const popularArtists = [
  {
    name: "Escaladizzy",
    artist: "Escaladizzy",
    image: "https://i.scdn.co/image/ab67616d00001e0235893bb4df71439deafe7958",
    videoId: "big-buck-bunny",
  },
  {
    name: "Rumours",
    artist: "Rumours",
    image: "https://i.scdn.co/image/ab67616d00001e02a18ae82cd4f66b83b275c709",
    videoId: "elephants-dream",
  },
];


// --- Helper: map card to Video ---
function getVideoById(id: string): Video {
  const video = videos.find((v) => v.id === id);
  if (!video) {
    // fallback to first video if not found
    return videos[0];
  }
  return video;
}

// --- CARD COMPONENTS ---
const ReleaseCard = ({ item, onSelect }: { item: Release; onSelect: (video: Video) => void }) => (
<div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
<div
    className="e-91000-box e-91000-baseline e-91000-box--naked e-91000-box--interactive e-91000-box--browser-default-focus e-91000-box--is-using-keyboard e-91000-box--padding-custom e-91000-Box-sc-1njtxi4-0 faRaKi Ji04otv4EkRALLN2jLQA Box-sc-1njtxi4-0 faRaKi Ji04otv4EkRALLN2jLQA"
    data-encore-id="card"
    role="group"
    aria-labelledby={`card-title-${item.name}`}
    data-testid="home-card"
    style={{
      ["--box-padding-block-start" as any]: "8px",
      ["--box-padding-block-end" as any]: "8px",
      ["--box-padding-inline-start" as any]: "8px",
      ["--box-padding-inline-end" as any]: "8px",
    }}
    onClick={() => onSelect(getVideoById(item.videoId))}
  >
    <div className="CardLink-sc-1ut6cns-0 DjiIj"></div>
    <div id={`onClickHint-${item.name}`} style={{ display: "none" }}></div>
    <img
      alt={item.name}
      data-encore-id="image"
      className="Image-sc-1u215sg-3 kOChlU"
      src={item.image}
      style={{ minInlineSize: "152px" }}
    />
    <div className="Areas__InteractiveArea-sc-1tea2mc-0 Areas__MainArea-sc-1tea2mc-1 MWEhk kLALqL">
      <div className="Areas__InteractiveArea-sc-1tea2mc-0 Areas__Column-sc-1tea2mc-2 MWEhk cuoMqc">
        <span className="e-91000-text encore-text-body-medium ListRowTitle__ListRowText-sc-1xe2if1-1 eFGzcP">
          {item.name}
        </span>
      </div>
    </div>
  </div> </div>
);

const HomeCard = ({ item, onSelect }: { item: HomeCardItem; onSelect: (video: Video) => void }) => (
  <div
    className="e-91000-box e-91000-baseline e-91000-box--naked e-91000-box--interactive e-91000-box--browser-default-focus e-91000-box--is-using-keyboard e-91000-box--padding-custom e-91000-Box-sc-1njtxi4-0 faRaKi Ji04otv4EkRALLN2jLQA group cursor-pointer"
    data-encore-id="card"
    role="group"
    aria-labelledby={`card-title-${item.name}`}
    data-testid="home-card"
    style={{
      ["--box-padding-block-start" as any]: "8px",
      ["--box-padding-block-end" as any]: "8px",
      ["--box-padding-inline-start" as any]: "8px",
      ["--box-padding-inline-end" as any]: "8px",
    }}
    onClick={() => onSelect(getVideoById(item.videoId))}
  >
    <div className="CardLink-sc-1ut6cns-0 DjiIj"></div>
    <div id={`onClickHint-${item.name}`} style={{ display: "none" }}></div>

    {/* Image with overlay */}
    <div className="relative">
      <img
        alt={item.name}
        data-encore-id="image"
        className="Image-sc-1u215sg-3 kOChlU"
        src={item.image}
        style={{ minInlineSize: "152px" }}
      />
      {/* Play icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <svg
          className="w-12 h-12 text-white transform group-hover:scale-110 transition-transform"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M6 4l15 8-15 8z" />
        </svg>
      </div>
    </div>

    <div className="Areas__InteractiveArea-sc-1tea2mc-0 Areas__MainArea-sc-1tea2mc-1 MWEhk kLALqL">
      <div className="Areas__InteractiveArea-sc-1tea2mc-0 Areas__Column-sc-1tea2mc-2 MWEhk cuoMqc">
        <span className="e-91000-text encore-text-body-medium ListRowTitle__ListRowText-sc-1xe2if1-1 eFGzcP">
          {item.name}
        </span>
      </div>
    </div>
  </div>
);

// --- MAIN PAGE ---
export default function PodcastsPage() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  if (selectedVideo) {
    return (
      <main className="flex flex-col items-center min-h-screen bg-neutral-900 text-white p-4">
        <div className="w-full max-w-6xl">
          <div className="w-full aspect-video">
            <VideoPlayer video={selectedVideo} />
          </div>
        </div>
        <div className="w-full max-w-6xl px-4 py-8">
          <Recommendations currentVideoId={selectedVideo.id} />
        </div>
        <button
          className="mt-4 px-4 py-2 bg-white text-black rounded"
          onClick={() => setSelectedVideo(null)}
        >
          Back
        </button>
      </main>
    );
  }

  return (
    <div className="mobile-web-player bg-neutral-900 text-white">
      <main className="p-4">
        <h2 className="text-2xl font-bold mb-4">Popular releases</h2>
        <div className="flex gap-4 overflow-x-auto">
          {masiaOneReleases.map((item, idx) => (
<ReleaseCard key={idx} item={item} onSelect={setSelectedVideo} />
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-4 mt-8">Trending Tracks</h2>
        <div className="flex gap-4 overflow-x-auto">
          {homeCards.map((item, idx) => (
            <HomeCard key={idx} item={item} onSelect={setSelectedVideo} />
          ))}
        </div>

        <div className="mt-8">
          <PlayableFeed
            title="Trending songs"
            items={trendingSongs}
            onSelect={(item) => setSelectedVideo(getVideoById(item.videoId))}
          />
          <PlayableFeed
            title="Popular artists"
            items={popularArtists}
            onSelect={(item) => setSelectedVideo(getVideoById(item.videoId))}
          />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
