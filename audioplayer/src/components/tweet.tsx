'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Repeat, Heart, BarChartBig, Upload } from 'lucide-react';

interface TweetProps {
  author: string;
  username: string;
  date: string;
  content: string;
  avatar: string;
  replyCount: number;
  retweetCount: number;
  likeCount: number;
  viewCount: string;
}

export const Tweet: React.FC<TweetProps> = ({
  author,
  username,
  date,
  content,
  avatar,
  replyCount,
  retweetCount,
  likeCount,
  viewCount,
}) => {
  return (
    <div className="flex p-4 border-b border-neutral-800">
      <Avatar className="h-12 w-12 mr-4">
        <AvatarImage src={avatar} />
        <AvatarFallback>{author.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="w-full">
        <div className="flex items-center">
          <span className="font-bold">{author}</span>
          <span className="text-neutral-500 ml-2">{username}</span>
          <span className="text-neutral-500 ml-2">· {date}</span>
        </div>
        <p className="mt-1">{content}</p>
        <div className="flex justify-between mt-4 text-neutral-500 max-w-sm">
          <div className="flex items-center gap-1 cursor-pointer hover:text-blue-500">
            <MessageCircle size={18} />
            <span>{replyCount > 0 ? replyCount : ''}</span>
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:text-green-500">
            <Repeat size={18} />
            <span>{retweetCount > 0 ? retweetCount : ''}</span>
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:text-pink-500">
            <Heart size={18} />
            <span>{likeCount > 0 ? likeCount : ''}</span>
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:text-blue-500">
            <BarChartBig size={18} />
            <span>{viewCount}</span>
          </div>
          <div className="cursor-pointer hover:text-blue-500">
            <Upload size={18} />
          </div>
        </div>
      </div>
    </div>
  );
};
