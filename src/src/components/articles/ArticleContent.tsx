'use client';

import type { FC } from 'react';
import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ContentItem } from '@/services/contentService';
import { Loader2, AlertTriangle } from 'lucide-react';
import ArticleCard from './ArticleCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import '@/components/ui/articles.css';

const ArticleContentInternal: FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  const fetchWordPressPosts = useCallback(async () => {
    setIsLoading(true);
    setCurrentError(null);

    try {
      const response = await fetch('https://netbeins.com/wp-json/wp/v2/posts?_embed=1&per_page=20');
      if (!response.ok) throw new Error('Failed to fetch from netbeins.com');

      const wpData = await response.json();

      const mappedArticles: ContentItem[] = wpData.map((post: any) => {
        const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
        const imageUrl = featuredMedia?.media_details?.sizes?.large?.source_url
                      || featuredMedia?.source_url
                      || 'https://placehold.co/600x400?text=Netbeins';

        return {
          id: post.id.toString(),
          title: post.title.rendered,
          imageUrl: imageUrl,
          excerpt: post.excerpt.rendered.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...',
          fullBodyContent: post.content.rendered,
          contentType: 'article',
          authorName: post._embedded?.author?.[0]?.name || 'Netbeins',
          createdAt: { seconds: new Date(post.date).getTime() / 1000, nanoseconds: 0 } as any,
        };
      });

      setArticles(mappedArticles);
    } catch (err: any) {
      console.error("WordPress API Error:", err);
      setCurrentError("Unable to load articles from netbeins.com. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWordPressPosts();
  }, [fetchWordPressPosts]);

  useEffect(() => {
    const articleId = searchParams.get('articleId');
    if (articleId && articles.length > 0) {
      setExpandedArticleId(articleId);
    }
  }, [searchParams, articles]);

  const handleShare = useCallback(async (article: ContentItem) => {
    const shareUrl = `${window.location.origin}/?articleId=${article.id}`;
    
    const shareData = { 
        title: article.title, 
        text: article.excerpt, 
        url: shareUrl 
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ 
            title: "Link Copied!", 
            description: "You can now share this article with your friends."
        });
      }
    } catch (err) { 
        if ((err as Error).name !== 'AbortError') console.error(err); 
    }
  }, [toast]);

  const handleOpenImage = useCallback((article: ContentItem) => {
    if (article.imageUrl) {
      window.open(article.imageUrl, '_blank');
    } else {
      toast({ title: "No image available", variant: "destructive" });
    }
  }, [toast]);

  // NEW: Handle generating and opening OG image
  const handleShareImageTest = useCallback((article: ContentItem) => {
    const ogUrl = `${window.location.origin}/api/og?title=${encodeURIComponent(article.title)}&description=${encodeURIComponent(article.excerpt)}&image=${encodeURIComponent(article.imageUrl || '')}`;
    
    // Open OG image in new tab
    window.open(ogUrl, '_blank');

    // Copy OG URL for social sharing
    navigator.clipboard.writeText(ogUrl)
      .then(() => toast({ title: "OG URL copied!", description: "You can share this image URL on social media." }))
      .catch(() => toast({ title: "Failed to copy OG URL", variant: "destructive" }));
  }, [toast]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 px-4 md:px-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-white/5 animate-pulse rounded-xl" />
          ))}
        </div>
      );
    }

    if (currentError) {
      return (
        <div className="flex flex-col items-center py-20 text-center px-4">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-white/70 max-w-xs">{currentError}</p>
          <Button className="mt-6" variant="outline" onClick={fetchWordPressPosts}>Try Again</Button>
        </div>
      );
    }

    const articlesToDisplay = expandedArticleId 
      ? articles.filter(a => a.id === expandedArticleId) 
      : articles;

    return (
      <div className={`mt-4 pb-20 ${expandedArticleId ? 'px-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-0'}`}>
        {articlesToDisplay.length > 0 ? (
          articlesToDisplay.map((article) => (
            <ArticleCard 
              key={article.id} 
              article={article}
              isCurrentlyExpanded={expandedArticleId === article.id}
              onToggleExpand={() => setExpandedArticleId(expandedArticleId === article.id ? null : article.id)}
              onShare={() => handleShare(article)}
              extraButtons={(
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => handleOpenImage(article)}
                  >
                    Open Image
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 ml-2"
                    onClick={() => handleShareImageTest(article)}
                  >
                    Share Image Test
                  </Button>
                </>
              )}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-white/40">
            No articles found.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-center mb-6">
        <Button onClick={fetchWordPressPosts} variant="outline" className="px-10 font-bold">
          Home
        </Button>
      </div>

      {renderContent()}
    </div>
  );
};

const ArticleContent: FC = () => (
  <Suspense fallback={
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  }>
    <ArticleContentInternal />
  </Suspense>
);

export default ArticleContent;