"use client";

import Image from "next/image";
import { FaPlay } from "react-icons/fa";

interface PlayableItemProps {
  image: string;
  name: string;
  artist: string;
  onClick: () => void; // Changed from href to onClick
}

export const PlayableItem: React.FC<PlayableItemProps> = ({
  image,
  name,
  artist,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="relative group flex flex-col items-center justify-center rounded-md overflow-hidden gap-x-4 bg-neutral-400/5 hover:bg-neutral-400/10 transition p-3 cursor-pointer w-full flex-shrink-0"
    >
      <div className="relative aspect-square w-full h-full rounded-md overflow-hidden">
        <Image className="object-cover" src={image} fill alt="Image" />
      </div>
      <div className="flex flex-col items-start w-full pt-4 gap-y-1">
        <p className="font-semibold truncate w-full text-white">{name}</p>
        <p className="text-neutral-400 text-sm pb-4 w-full truncate">By {artist}</p>
      </div>
      <div className="absolute bottom-24 right-5">
        <div className="transition opacity-0 rounded-full flex items-center justify-center bg-green-500 p-4 drop-shadow-md group-hover:opacity-100 hover:scale-110">
          <FaPlay className="text-black" />
        </div>
      </div>
    </div>
  );
};