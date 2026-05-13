"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaPlay, FaBook, FaCoins, FaInfo } from 'react-icons/fa';
import StreamLayout from './components/StreamLayout';
import { useBalance } from './components/BalanceProvider';
import Playerhls from './components/playerhls';

interface Post {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
    }>;
  };
  categories: number[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { userCoins, loading: balanceLoading } = useBalance();

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const response = await fetch('https://mohamedroyal.com/wp-json/wp/v2/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        if (isMounted) {
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    const fetchPosts = async () => {
      try {
        const response = await fetch(
          'https://mohamedroyal.com/wp-json/wp/v2/posts?_embed&per_page=100'
        );
        if (!response.ok) throw new Error('Failed to fetch posts');
        const data = await response.json();
        if (isMounted) {
          setPosts(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCategories();
    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const getPostsByCategory = (categoryId: number, limit: number = 7) => {
    return posts
      .filter(post => post.categories.includes(categoryId))
      .slice(0, limit); // Limit to 7 posts per category
  };

  // Define category IDs
  const CATEGORY_CONFIG = [
    { id: categories.find(cat => cat.slug === 'films')?.id || 2, name: 'Films' },
    { id: categories.find(cat => cat.slug === 'music')?.id || 1, name: 'Music' },
    { id: categories.find(cat => cat.slug === 'podcast')?.id || 3, name: 'Podcasts' }
  ];

  const hasVideo = (content: string) => {
    return (
      content.includes('youtube.com') ||
      content.includes('youtu.be') ||
      content.includes('.mp4') ||
      content.includes('<video') ||
      content.includes('<iframe') ||
      content.includes('wp-block-embed')
    );
  };

  if (loading || balanceLoading) {
    return (
      <StreamLayout>
        <div className="flex items-center justify-center min-h-screen bg-[#000000]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E31E24]"></div>
        </div>
      </StreamLayout>
    );
  }

  return (
    <StreamLayout>
      <div className="relative bg-[#000000] min-h-screen">
        {/* Hero Section */}
        {posts[0] && (
          <div className="relative h-[85vh] w-full">
            <div className="absolute inset-0">
              <img
                src={posts[0]._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/default-thumbnail.jpg'}
                alt={posts[0].title.rendered}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 hero-gradient" />
            </div>

            <div className="absolute bottom-[20%] left-[4%] max-w-xl">
              <div className="flex items-center space-x-4 mb-4">
                {hasVideo(posts[0].content.rendered) ? (
                  <div className="flex items-center space-x-2 text-orange-500">
                    <FaPlay />
                    <span>Video</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-blue-500">
                    <FaBook />
                    <span>Article</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-orange-500">
                  <FaCoins />
                  <span>10 coins</span>
                </div>
              </div>
              <h1 
                className="text-4xl font-bold mb-4"
                dangerouslySetInnerHTML={{ __html: posts[0].title.rendered }}
              />
              <div 
                className="text-gray-300 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: posts[0].excerpt.rendered }}
              />
            </div>
          </div>
        )}

        {/* Content Rows */}
        <div className="relative z-10 pb-16 px-4">
          <div className="space-y-8">
            {CATEGORY_CONFIG.map(({ id, name }) => {
              const categoryPosts = getPostsByCategory(id);
              
              if (categoryPosts.length === 0) return null;

              return (
                <section key={id} className="content-section pt-8">
                  <h2 className="text-2xl font-medium mb-3 text-white pl-4">{name}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 p-2"> {/* Updated to show up to 7 columns on large screens */}
                    {categoryPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/post/${post.slug}`}
                        className="relative hover-card group"
                        style={{ aspectRatio: '2/3' }}
                      >
                        <img
                          src={post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/default-thumbnail.jpg'}
                          alt={post.title.rendered}
                          className="w-full h-full object-cover rounded-sm transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm">
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 
                              className="text-sm font-medium text-white line-clamp-2 text-shadow-sm"
                              dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                            />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
      <Playerhls />
    </StreamLayout>
  );
}