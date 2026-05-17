"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db } from '@/app/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { FaCalendar, FaUser, FaCoins, FaArrowLeft, FaPlay, FaPlus } from 'react-icons/fa';
import VideoPlayer from '@/app/components/VideoPlayer';
import PostPreview from '../../components/PostPreview';
import StreamLayout from '../../components/StreamLayout';
import LowBalanceWarning from '../../components/LowBalanceWarning';
import { useBalance } from '../../components/BalanceProvider';
import ZeroBalanceWarning from '../../components/ZeroBalanceWarning';

interface Post {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
    }>;
    author?: Array<{
      name: string;
    }>;
  };
  date: string;
  excerpt: { rendered: string };
}

const MIN_REQUIRED_BALANCE = 100;
const ARTICLE_COST = 10;

interface PostPreviewProps {
  post: Post;
  hasVideo: boolean;
  hasAccess: boolean;
  userCoins: number;
  ARTICLE_COST: number;
  onPurchase: () => void;
  buttonText: string;
  isInLibrary: boolean;
  onAddToLibrary: () => void;
}

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(false);
  const [showZeroBalanceWarning, setShowZeroBalanceWarning] = useState(false);
  const { userCoins, checkBalance, deductCoins } = useBalance();
  const [isInLibrary, setIsInLibrary] = useState(false);

  const checkUserAccess = async (uid: string) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        
        // Check if user has already purchased/accessed this article
        const savedArticles = userData.savedArticles || [];
        const hasArticle = savedArticles.some(
          (article: { slug: string }) => article.slug === params.slug
        );
        
        // Check if article is in library
        const library = userData.library || [];
        const inLibrary = library.some(
          (article: { slug: string }) => article.slug === params.slug
        );
        
        setIsInLibrary(inLibrary);
        setHasAccess(hasArticle);
        return hasArticle;
      }
      return false;
    } catch (error) {
      console.error("Error checking user access:", error);
      return false;
    }
  };

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://mohamedroyal.com/wp-json/wp/v2/posts?slug=${params.slug}&_embed`
      );
      const posts = await response.json();
      
      if (posts.length > 0) {
        setPost(posts[0]);
      } else {
        console.error('Post not found');
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUserAndFetchPost = async () => {
      const user = localStorage.getItem('user');
      if (!user) {
        router.push('/sign-in');
        return;
      }

      const parsedUser = JSON.parse(user);
      await checkBalance();
      const hasAccess = await checkUserAccess(parsedUser.uid);
      
      // Show warning if balance is low but don't prevent access
      if (!hasAccess && userCoins < MIN_REQUIRED_BALANCE && userCoins > 0) {
        setShowLowBalanceWarning(true);
      }
      
      // Show zero balance warning
      if (!hasAccess && userCoins <= 0) {
        setShowZeroBalanceWarning(true);
        return;
      }

      await fetchPost();
    };

    checkUserAndFetchPost();
  }, [params.slug]);

  const handleAddToLibrary = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push('/sign-in');
      return;
    }

    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        library: arrayUnion({
          id: post?.id,
          slug: params.slug,
          title: post?.title.rendered,
          addedDate: new Date().toISOString(),
          thumbnail: post?._embedded?.['wp:featuredmedia']?.[0]?.source_url
        })
      });
      setIsInLibrary(true);
    } catch (error) {
      console.error("Error adding to library:", error);
    }
  };

  const handleStartContent = async () => {
    if (hasAccess) {
      handleStartReading();
      return;
    }

    // Check if user has enough coins
    if (userCoins < ARTICLE_COST) {
      setShowZeroBalanceWarning(true);
      return;
    }

    // Show low balance warning but don't prevent access
    if (userCoins < MIN_REQUIRED_BALANCE) {
      setShowLowBalanceWarning(true);
    }

    // Process the purchase
    await handlePurchase();
  };

  const handlePurchase = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push('/sign-in');
      return;
    }

    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        purchasedItems: arrayUnion({
          id: post?.id,
          slug: params.slug,
          title: post?.title.rendered,
          purchaseDate: new Date().toISOString()
        }),
        coins: userCoins - ARTICLE_COST
      });
      await checkBalance();
      setHasAccess(true);
      handleStartReading();
    } catch (error) {
      console.error("Error purchasing access:", error);
    }
  };

  const hasVideo = React.useMemo(() => {
    if (!post?.content?.rendered) return false;
    
    const content = post.content.rendered;
    return (
      content.includes('youtube.com') ||
      content.includes('youtu.be') ||
      content.includes('.mp4') ||
      content.includes('<video') ||
      content.includes('<iframe') ||
      content.includes('wp-block-embed')
    );
  }, [post]);

  const handleStartReading = () => {
    document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!post || loading) {
    return (
      <StreamLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E31E24]"></div>
        </div>
      </StreamLayout>
    );
  }

  return (
    <StreamLayout>
      <div className="min-h-screen bg-black text-white">
        <PostPreview
          post={post}
          hasVideo={hasVideo}
          hasAccess={hasAccess}
          userCoins={userCoins}
          ARTICLE_COST={ARTICLE_COST}
          onPurchase={handleStartContent}
          buttonText={hasVideo ? 'Play' : 'Read'}
          isInLibrary={isInLibrary}
          onAddToLibrary={handleAddToLibrary}
        />

        {/* Content Section with updated styling */}
        {hasAccess && (
          <div id="content" className="max-w-4xl mx-auto px-4 py-20">
            {hasVideo ? (
              <VideoPlayer 
                content={post.content.rendered}
                src=""
                autoPlay={false}
                controls={true}
              />
            ) : (
              <article className="prose prose-invert prose-lg max-w-none">
                <div 
                  className="text-gray-100 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: post.content.rendered 
                  }}
                />
              </article>
            )}
          </div>
        )}

        {/* Premium Content Lock with brand colors */}
        {!hasAccess && (
          <div className="max-w-4xl mx-auto px-4 py-20 text-center">
            <div className="bg-[#000000]/90 rounded-xl p-8 backdrop-blur-sm border border-[#E31E24]">
              <FaPlay className="text-4xl text-[#E31E24] mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Premium Content</h2>
              <p className="text-gray-300 mb-6">
                Unlock this {hasVideo ? 'video' : 'article'} for {ARTICLE_COST} coins to continue.
              </p>
              {userCoins < MIN_REQUIRED_BALANCE && userCoins > 0 && (
                <div className="text-sm text-[#E31E24] mt-4 font-medium">
                  Your balance is running low. Consider adding more coins soon.
                </div>
              )}
            </div>
          </div>
        )}

        {showZeroBalanceWarning && (
          <ZeroBalanceWarning
            onClose={() => setShowZeroBalanceWarning(false)}
          />
        )}

        {showLowBalanceWarning && userCoins > 0 && (
          <LowBalanceWarning
            currentBalance={userCoins}
            requiredBalance={MIN_REQUIRED_BALANCE}
            onClose={() => setShowLowBalanceWarning(false)}
          />
        )}
      </div>
    </StreamLayout>
  );
}