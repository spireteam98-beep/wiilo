"use client";
import { TbPlaylist } from "react-icons/tb";
import { AiOutlinePlus } from "react-icons/ai";
import { Button } from "./ui/button";

export const Library = () => {
  const onClick = () => {
    //Handle upload later
  };
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="inline-flex items-center gap-x-2">
          <TbPlaylist size={26} className="text-neutral-400" />
          <p className="text-neutral-400 font-medium text-lg">Your Library</p>
        </div>
        <AiOutlinePlus
          onClick={onClick}
          size={20}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
        />
      </div>
      <div className="flex flex-col gap-y-4 mt-4 px-3">
        <div className="flex flex-col gap-y-2 bg-neutral-800 p-4 rounded-md">
            <p className="font-semibold text-base">Create your first playlist</p>
            <p className="text-neutral-400 text-sm">It's easy, we'll help you</p>
            <Button className="mt-2 bg-white text-black w-[150px]">Create playlist</Button>
        </div>
        <div className="flex flex-col gap-y-2 bg-neutral-800 p-4 rounded-md">
            <p className="font-semibold text-base">Let's find some podcasts to follow</p>
            <p className="text-neutral-400 text-sm">We'll keep you updated on new episodes</p>
            <Button className="mt-2 bg-white text-black w-[150px]">Browse podcasts</Button>
        </div>
      </div>
    </div>
  );
};
