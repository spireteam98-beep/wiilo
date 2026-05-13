"use client";

import React from 'react';
import { FaPlay, FaBook, FaPlus } from 'react-icons/fa';

interface Post {
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url?: string;
    }>;
  };
}

interface PostPreviewProps {
  post: Post;
  hasVideo: boolean;
  hasAccess: boolean;
  userCoins: number;
  ARTICLE_COST: number;
  onPurchase: () => Promise<void>;
  buttonText: string;
  isInLibrary: boolean;
  onAddToLibrary: () => Promise<void>;
}

const PostPreview: React.FC<PostPreviewProps> = ({
  post,
  hasVideo,
  hasAccess,
  userCoins,
  ARTICLE_COST,
  onPurchase,
  buttonText,
  isInLibrary,
  onAddToLibrary
}) => {
  if (!post) return null;

  // Extract first 100 characters from excerpt
  const truncateExcerpt = (excerpt: string) => {
    const div = document.createElement('div');
    div.innerHTML = excerpt;
    const text = div.textContent || div.innerText || '';
    return text.slice(0, 100) + '...';
  };

  return (
    <div className="relative h-screen bg-[#000000]">
      {/* Background Image with Gradient */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${post._embedded?.['wp:featuredmedia']?.[0]?.source_url})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 w-full">
          <div className="max-w-2xl space-y-6 mt-[20vh]">
            {/* Title */}
            <h1 
              className="text-6xl md:text-7xl font-bold text-shadow-xl leading-none mb-8 text-white"
              dangerouslySetInnerHTML={{ __html: post.title.rendered }}
            />

            {/* Truncated Excerpt */}
            <p className="text-lg text-gray-300 mb-8">
              {truncateExcerpt(post.excerpt.rendered)}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              {/* Watch/Read Button */}
              <button 
                onClick={onPurchase}
                className="flex items-center space-x-3 bg-[#E31E24] text-white px-8 py-4 rounded-md hover:bg-[#c41a1f] transition-all duration-300"
                disabled={userCoins < ARTICLE_COST && !hasAccess}
              >
                {hasVideo ? <FaPlay className="text-lg" /> : <FaBook className="text-lg" />}
                <span className="font-medium text-lg">
                  {hasAccess ? (hasVideo ? 'Watch Now' : 'Read Now') : 
                   userCoins < ARTICLE_COST ? 'Insufficient coins' : 
                   (hasVideo ? 'Watch for ' + ARTICLE_COST + ' coins' : 'Read for ' + ARTICLE_COST + ' coins')}
                </span>
              </button>

              {/* Library Button */}
              <button
                onClick={onAddToLibrary}
                className={`flex items-center space-x-2 px-6 py-4 rounded-md transition-all duration-300 ${
                  isInLibrary 
                    ? 'bg-[#E31E24] text-white' 
                    : 'bg-transparent border-2 border-white text-white hover:bg-white/10'
                }`}
              >
                <FaPlus className="text-lg" />
                <span>{isInLibrary ? 'In Library' : 'Add to Library'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPreview; 