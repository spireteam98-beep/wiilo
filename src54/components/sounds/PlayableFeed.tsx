"use client";

import { PlayableItem } from "./PlayableItem";

interface PlayableFeedProps {
  title: string;
  items: {
    name: string;
    artist: string;
    image: string;
    href: string;
  }[];
}

export const PlayableFeed: React.FC<PlayableFeedProps> = ({
  title,
  items,
}) => {
  return (
    <div className="my-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-2xl font-semibold">{title}</h2>
        <a
          href="#"
          className="text-neutral-400 font-semibold text-sm hover:underline"
        >
          Show all
        </a>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-4 mt-4">
        {items.map((item) => (
          <PlayableItem key={item.name} {...item} />
        ))}
      </div>
    </div>
  );
};
