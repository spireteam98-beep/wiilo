"use client";

import { Header } from "@/components/Header";
import { ListItem } from "@/components/ListItem";
import { PlayableFeed } from "@/components/PlayableFeed";

const trendingSongs = [
  {
    name: "Nyaduse",
    artist: "KODONGKLAN",
    image: "https://i.scdn.co/image/ab67616d00001e028b684f5d1926c65e14a83231",
    href: "/playlist?autoplay=true",
  },
  {
    name: "Digi Digi",
    artist: "Abongo Jakabwana",
    image: "https://i.scdn.co/image/ab67616d00001e02ba9ad74e367e3b4d2229593a",
    href: "/playlist?autoplay=true",
  },
  {
    name: "Nani",
    artist: "Diamond Platnumz",
    image: "https://i.scdn.co/image/ab67616d00001e02b613cd1b434af1c426f2eb58",
    href: "/playlist?autoplay=true",
  },
  {
    name: "I'm a mess - Choir Version",
    artist: "Urban Chords",
    image: "https://i.scdn.co/image/ab67616d00001e025638a5776d3412a20cd4f9b3",
    href: "/playlist?autoplay=true",
  },
  {
    name: "M.O.T.O",
    artist: "X.O, SUNS3T",
    image: "https://i.scdn.co/image/ab67616d00001e029cb3114254829241d211cb84",
    href: "/playlist?autoplay=true",
  },
];

const popularArtists = [
  {
    name: "Escaladizzy",
    artist: "Escaladizzy",
    image: "https://i.scdn.co/image/ab67616d00001e0235893bb4df71439deafe7958",
    href: "/playlist?autoplay=true",
  },
  {
    name: "Rumours",
    artist: "Rumours",
    image: "https://i.scdn.co/image/ab67616d00001e02a18ae82cd4f66b83b275c709",
    href: "/playlist?autoplay=true",
  },
  {
    name: "So Easy (To Fall In Love)",
    artist: "So Easy (To Fall In Love)",
    image: "https://i.scdn.co/image/ab67616d00001e029a336bfb6d40bbd90a507417",
    href: "/playlist?autoplay=true",
  },
  {
    name: "Rehab",
    artist: "Rehab",
    image: "https://i.scdn.co/image/ab67616d00001e02b9ff0a5f40d3406aed5e5e3b",
    href: "/playlist?autoplay=true",
  },
  {
    name: "Venus",
    artist: "Venus",
    image: "https://i.scdn.co/image/ab67616d00001e028733f2e8a1db14bd2f9e9033",
    href: "/playlist?autoplay=true",
  },
  {
    name: "NOW OR NEVER",
    artist: "NOW OR NEVER",
    image: "https://i.scdn.co/image/ab67616d00001e029a6178c1a91168e2e63bbc76",
    href: "/playlist?autoplay=true",
  },
  {
    name: "No Stress",
    artist: "No Stress",
    image: "https://i.scdn.co/image/ab67616d00001e0290e89e3afc4441bf36720a73",
    href: "/playlist?autoplay=true",
  },
  {
    name: "EYES CLOSED (with ZAYN)",
    artist: "EYES CLOSED (with ZAYN)",
    image: "https://i.scdn.co/image/ab67616d00001e028af5b74e90634123d95fe5fa",
    href: "/playlist?autoplay=true",
  },
  {
    name: "FUN",
    artist: "FUN",
    image: "https://i.scdn.co/image/ab67616d00001e0266e58284256f704decf7be28",
    href: "/playlist?autoplay=true",
  },
  {
    name: "Exile",
    artist: "Exile",
    image: "https://i.scdn.co/image/ab67616d00001e023a96d8285b4ab910e8c50dbe",
    href: "/playlist?autoplay=true",
  },
  {
    name: "TOXIC (with Skepta)",
    artist: "TOXIC (with Skepta)",
    image: "https://i.scdn.co/image/ab67616d00001e026b219c8d8462bfe2e54a20469",
    href: "/playlist?autoplay=true",
  },
  {
    name: "BADMAN GANGSTA",
    artist: "BADMAN GANGSTA",
    image: "https://i.scdn.co/image/ab67616d00001e02db8582d51a88b1f54d9fd315",
    href: "/playlist?autoplay=true",
  },
  {
    name: "Aweh [Remix] (feat. Cassper Nyovest)",
    artist: "Aweh [Remix] (feat. Cassper Nyovest)",
    image: "https://i.scdn.co/image/ab67616d00001e02862ea9a1da40cc42c156b498",
    href: "/playlist?autoplay=true",
  },
  {
    name: "Laho II",
    artist: "Laho II",
    image: "https://i.scdn.co/image/ab67616d00001e02883c35354f2e517402f3035a",
    href: "/playlist?autoplay=true",
  },
  {
    name: "No Broke Boys",
    artist: "No Broke Boys",
    image: "https://i.scdn.co/image/ab67616d00001e025dcede7ece7b2cb72cee4eee",
    href: "/playlist?autoplay=true",
  },
];

export default function HomeDesktop() {
  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
      <Header>
        <div className="mb-2">
          <h1 className="text-white text-3xl font-semibold">Welcome back</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 mt-4">
            <ListItem
              image="/pictures/Host.jpg"
              name="Liked Songs"
              href="liked"
            />
          </div>
        </div>
      </Header>
      <div className="mt-2 mb-7 px-6">
        <PlayableFeed title="Trending songs" items={trendingSongs} />
        <PlayableFeed title="Popular artists" items={popularArtists} />
      </div>
    </div>
  );
}
