"use client";

import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { FaPlay, FaList, FaHistory, FaFilm, FaTv, FaArrowLeft } from 'react-icons/fa';
import { BiMoviePlay } from 'react-icons/bi';
import Image from 'next/image';
import { useMediaQuery } from 'react-responsive';

interface WordPressPost {
  id: number;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  featured_media_url?: string;
  date: string;
}

// Add type for video
interface Video {
  poster: string;  // Make sure this is always a string
  title: string;
  // ... other video properties
}

const Playerhls = () => {
  // Device detection
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const isDesktop = useMediaQuery({ minWidth: 1024 });

  // State management
  const [wpPosts, setWpPosts] = useState<WordPressPost[]>([]);
  const [currentCategory, setCurrentCategory] = useState('featured');
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEpisodes, setShowEpisodes] = useState(!isMobile);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(!isMobile);

  // Update layout based on device
  useEffect(() => {
    setSidebarVisible(!isMobile);
    setShowEpisodes(!isMobile);
  }, [isMobile]);

  // Fetch WordPress posts
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('https://mohamedroyal.com/wp-json/wp/v2/posts?per_page=7&_embed');
        const posts = await response.json();
        
        const postsWithImages = posts.map((post: any) => ({
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          date: new Date(post.date).toLocaleDateString(),
          featured_media_url: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/default-image.jpg'
        }));
        
        setWpPosts(postsWithImages);
        // Set initial video if none selected
        if (!currentVideo) {
          const firstPost = postsWithImages[0];
          setCurrentVideo({
            src: "https://devstreaming-cdn.apple.com/videos/streaming/examples/adv_dv_atmos/main.m3u8",
            title: firstPost.title.rendered,
            description: firstPost.excerpt.rendered.replace(/<[^>]*>/g, ''),
            poster: firstPost.featured_media_url,
            duration: "Sample Duration",
            type: "hls",
            year: new Date(firstPost.date).getFullYear().toString(),
            rating: "N/A"
          });
        }
      } catch (error) {
        setError('Failed to fetch posts. Please try again later.');
        console.error('Error fetching WordPress posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const categories = {
    featured: wpPosts.map(post => ({
      src: "https://devstreaming-cdn.apple.com/videos/streaming/examples/adv_dv_atmos/main.m3u8",
      title: post.title.rendered,
      description: post.excerpt.rendered.replace(/<[^>]*>/g, ''),
      poster: post.featured_media_url,
      duration: "Sample Duration",
      type: "hls",
      year: new Date(post.date).getFullYear().toString(),
      rating: "N/A"
    })),
    action: [
      {
        src: "/videos/rocky.mp4",
        title: "Rocky I",
        description: "A small-time boxer gets a supremely rare chance to fight a heavyweight champion in a bout in which he strives to go the distance for his self-respect.",
        poster: "/images/rocky-poster.jpg",
        episode: "E01",
        duration: "2h 2min",
        type: "mp4",
        year: "1976",
        rating: "PG"
      },
      {
        src: "/videos/rocky.mp4",
        title: "Rocky II",
        description: "Rocky struggles in family life after his bout with Apollo Creed, while the embarrassed champ insistently goads him to accept a challenge for a rematch.",
        poster: "/images/rocky2-poster.jpg",
        episode: "E02",
        duration: "1h 59min",
        type: "mp4",
        year: "1979",
        rating: "PG-13"
      },
      {
        src: "https://devstreaming-cdn.apple.com/videos/streaming/examples/adv_dv_atmos/main.m3u8",
        title: "Rocky III",
        description: "After winning the ultimate title and being the world champion, Rocky falls into a hole and finds himself picked up by a former enemy.",
        poster: "/images/rocky3-poster.jpg",
        episode: "E03",
        duration: "1h 57min",
        type: "hls",
        year: "1982",
        rating: "PG-13"
      }
    ],
    drama: [
      {
        src: "/videos/godfather.mp4",
        title: "The Godfather",
        description: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
        poster: "/images/godfather-poster.jpg",
        duration: "2h 55min",
        type: "mp4",
        year: "1972",
        rating: "R"
      }
    ],
    scifi: [
      {
        src: "https://devstreaming-cdn.apple.com/videos/streaming/examples/adv_dv_atmos/main.m3u8",
        title: "Sample Sci-Fi",
        description: "A sample streaming video with advanced features.",
        poster: "https://bitdash-a.akamaihd.net/content/sintel/poster.png",
        duration: "1h 30min",
        type: "hls",
        year: "2023",
        rating: "PG-13"
      }
    ]
  };

  const handleVideoSelect = (video: any, index: number) => {
    setCurrentVideo(video);
    setCurrentIndex(index);
    // Hide sidebar and episodes list
    setSidebarVisible(false);
    setShowEpisodes(false);
    
    // Add a small delay to ensure DOM is updated before playing
    setTimeout(() => {
      const videoElement = document.querySelector('video');
      if (videoElement) {
        videoElement.play().catch(error => {
          console.log('Auto-play prevented:', error);
          // Handle auto-play prevention if needed
        });
      }
    }, 100);
  };

  const handleCategoryChange = (category: string) => {
    setCurrentCategory(category);
    // Optionally auto-select first video in category
    const categoryVideos = categories[category as keyof typeof categories];
    if (categoryVideos.length > 0) {
      handleVideoSelect(categoryVideos[0], 0);
    }
  };

  const menuItems = [
    {
      title: 'Now Playing',
      icon: <FaPlay className="text-base" />,
      active: !showEpisodes,
      onClick: () => setShowEpisodes(false)
    },
    {
      title: 'Movies',
      icon: <BiMoviePlay className="text-base" />,
      active: showEpisodes,
      onClick: () => setShowEpisodes(true)
    },
    {
      title: 'TV Shows',
      icon: <FaTv className="text-base" />,
      count: wpPosts.length,
      onClick: () => {
        setShowEpisodes(true);
        handleCategoryChange('featured');
      }
    }
  ];

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#E31E24] px-4 py-2 rounded-lg hover:bg-[#c41a1f]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Back Arrow */}
      {!sidebarVisible && (
        <button
          onClick={() => setSidebarVisible(true)}
          className="fixed top-4 left-4 z-40 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
        >
          <FaArrowLeft size={20} />
        </button>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-[#111111] p-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="text-white p-2"
          >
            <FaList size={24} />
          </button>
          <h1 className="text-white text-lg font-semibold">Video Player</h1>
          <div className="w-8" /> {/* Spacer for alignment */}
        </div>
      )}

      {/* Sidebar - Adjusted width and spacing */}
      <div className={`
        ${sidebarVisible ? 'w-72 md:w-80 lg:w-96' : 'w-0'}
        ${isMobile ? 'absolute inset-y-0 left-0 z-50' : 'relative'}
        bg-[#111111] border-r border-gray-800 flex flex-col
        transition-all duration-300 ease-in-out
        overflow-hidden
        ${isMobile ? 'h-full' : ''}
      `}>
        <div className="p-3 flex-none">
          <h2 className="text-white text-lg font-semibold mb-3">Video Library</h2>
          <nav className="space-y-2">
            {menuItems.map((item, index) => (
              <div key={index}>
                <button
                  onClick={item.onClick}
                  className={`w-full flex items-center justify-between p-2 rounded-lg ${
                    item.active 
                      ? 'bg-[#E31E24] text-white' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  } transition-all duration-300`}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span className="text-sm">{item.title}</span>
                  </div>
                  {item.count && (
                    <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full text-xs">
                      {item.count}
                    </span>
                  )}
                </button>
                {item.active && !showEpisodes && (
                  <div className="text-xs text-gray-400 mt-1 ml-9">
                    {currentVideo.title}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {showEpisodes && (
          <div className="flex-grow overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {/* Categories */}
            <div className="mb-4 flex space-x-2 flex-wrap gap-y-2">
              {Object.keys(categories).map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-3 py-1 rounded-full text-xs ${
                    currentCategory === category
                      ? 'bg-[#E31E24] text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {category === 'featured' ? 'Latest Posts' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Videos/Posts Grid */}
            <div className="grid grid-cols-1 gap-4">
              {categories[currentCategory as keyof typeof categories].map((video, index) => (
                <button
                  key={index}
                  onClick={() => handleVideoSelect(video, index)}
                  className={`w-full text-left group ${
                    currentVideo.title === video.title ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="relative aspect-video mb-2">
                    <Image
                      src={video.poster || '/default-poster.jpg'}
                      alt={video.title || 'Video thumbnail'}
                      fill
                      className="rounded object-cover"
                    />
                    {currentVideo.title === video.title && (
                      <div className="absolute inset-0 bg-[#E31E24]/20 rounded" />
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-white text-sm font-medium" 
                      dangerouslySetInnerHTML={{ __html: video.title }}
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-xs">{video.year}</span>
                      {video.rating !== 'N/A' && (
                        <span className="text-gray-400 text-xs border border-gray-700 px-1 rounded">
                          {video.rating}
                        </span>
                      )}
                      <span className="text-gray-400 text-xs">{video.duration}</span>
                    </div>
                  </div>
                  <div className="text-gray-400 text-xs line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: video.description }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Adjusted spacing */}
      <div className={`
        flex-1 flex flex-col overflow-hidden
        transition-all duration-300 ease-in-out
        ${sidebarVisible ? 'md:ml-0' : 'ml-0'}
      `}>
        {currentVideo && (
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="relative flex-1">
                <VideoPlayer 
                  src={currentVideo.src}
                  title={currentVideo.title}
                  poster={currentVideo.poster}
                  onEnded={() => {
                    const currentCategoryVideos = categories[currentCategory as keyof typeof categories];
                    if (currentIndex < currentCategoryVideos.length - 1) {
                      handleVideoSelect(currentCategoryVideos[currentIndex + 1], currentIndex + 1);
                    }
                  }}
                  subtitles={[
                    { label: 'English', src: '/subtitles/en.vtt' },
                    { label: 'Spanish', src: '/subtitles/es.vtt' }
                  ]}
                  isMobile={isMobile}
                  isTablet={isTablet}
                  isDesktop={isDesktop}
                />
              </div>
              
              {/* Video Info - Compact version with resume button */}
              <div className="p-2 md:p-3 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-lg md:text-xl font-semibold text-white"
                    dangerouslySetInnerHTML={{ __html: currentVideo.title }}
                  />
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        const videoElement = document.querySelector('video');
                        if (videoElement) {
                          videoElement.play().catch(console.log);
                        }
                      }}
                      className="flex items-center space-x-1 bg-[#E31E24] text-white px-3 py-1 rounded-lg hover:bg-[#c41a1f] transition-colors"
                    >
                      <FaPlay className="text-xs" />
                      <span className="text-sm">Resume</span>
                    </button>
                    {!isMobile && (
                      <button 
                        onClick={() => setSidebarVisible(true)}
                        className="flex items-center space-x-1 bg-gray-800 text-white px-3 py-1 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <FaList className="text-xs" />
                        <span className="text-sm">Episodes</span>
                      </button>
                    )}
                  </div>
                </div>
                {currentVideo.description && (
                  <p className="text-gray-400 text-xs md:text-sm line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: currentVideo.description }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarVisible(false)}
        />
      )}
    </div>
  );
};

export default Playerhls;
