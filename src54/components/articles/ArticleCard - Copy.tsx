'use client';

import type { FC } from 'react';
import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ContentItem } from '@/services/contentService';
import { ArrowRight, Heart, Bookmark, Share2, Lock, ImageIcon } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';
import '@/components/ui/articles.css'; 

interface ArticleCardProps {
  article: ContentItem;
  isCurrentlyExpanded: boolean;
  onToggleExpand: (articleId: string | null) => void;
  onShare: () => void; // Existing standard link share
}

const ArticleCard: FC<ArticleCardProps> = ({ article, isCurrentlyExpanded, onToggleExpand, onShare }) => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  // --- Date Formatting Logic ---
  let dateToFormat: Date | null = null;
  if (article.createdAt) {
    if (article.createdAt instanceof Timestamp) {
      dateToFormat = article.createdAt.toDate();
    } else if (typeof article.createdAt === 'string') {
      dateToFormat = parseISO(article.createdAt);
    } else if (typeof (article.createdAt as any)?.seconds === 'number') { 
      dateToFormat = new Timestamp((article.createdAt as any).seconds, (article.createdAt as any).nanoseconds).toDate();
    }
  }
  const formattedDate = dateToFormat && isValid(dateToFormat) ? format(dateToFormat, 'MMMM dd, yyyy') : 'Date unavailable';
  const metaInfo = `${article.category || 'Article'} | ${formattedDate}`;

  // --- Native Share UI Logic (OG Image URL) ---
  const handleShareImage = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card from collapsing/expanding

    const origin = window.location.origin;
    const encodedTitle = encodeURIComponent(article.title);
    const encodedDesc = encodeURIComponent(article.excerpt || '');
    const encodedImg = encodeURIComponent(article.imageUrl || '');

    // Generates the exact URL structure you requested
    const ogUrl = `${origin}/api/og?title=${encodedTitle}&description=${encodedDesc}&image=${encodedImg}`;

    const shareData = {
      title: article.title,
      text: `Check out this visual summary: ${article.title}`,
      url: ogUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Native Share (like Desktop Firefox)
        await navigator.clipboard.writeText(ogUrl);
        toast({ 
          title: "OG URL Copied!", 
          description: "System share not supported, link copied to clipboard instead." 
        });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error(err);
    }
  };

  const handleInteractionRedirect = () => {
    localStorage.setItem('pendingArticleId', article.id);
    window.location.href = `${window.location.origin}/auth/signin`;
  };

  const isLiked = userProfile?.likedContentIds?.includes(article.id) ?? false;
  const isSaved = userProfile?.savedContentIds?.includes(article.id) ?? false;

  return (
    <Card id={`article-${article.id}`} className="w-full bg-transparent border-none shadow-none rounded-none mb-8 break-inside-avoid-column">
      {/* Thumbnail View */}
      {article.imageUrl && !isCurrentlyExpanded && (
        <div className="relative w-full aspect-[16/9] overflow-hidden mb-3 rounded-md cursor-pointer group" onClick={() => onToggleExpand(article.id)}>
          <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}

      <CardContent className="p-0">
        {!isCurrentlyExpanded ? (
          <>
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{metaInfo}</p>
            <CardTitle className="text-xl lg:text-2xl font-bold text-foreground mb-2 leading-tight hover:text-primary transition-colors cursor-pointer" onClick={() => onToggleExpand(article.id)}>
              {article.title}
            </CardTitle>
            {article.excerpt && <p className="text-sm text-foreground/80 line-clamp-3 mb-3">{article.excerpt}</p>}
          </>
        ) : (
          /* Expanded View */
          <div className="ArticleBody_root__2gF81">
            {article.imageUrl && (
              <div className="relative w-full aspect-[16/9] overflow-hidden mb-4">
                <Image src={article.imageUrl} alt={article.title} fill className="object-cover" />
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 leading-tight">{article.title}</h1>
            {article.subtitle && <div className="ArticleBooksModule_creator__kmwjl mb-4 text-primary font-medium">By {article.subtitle}</div>}
            
            {article.fullBodyContent?.split(/\n\s*\n|\n{2,}/).map((paragraphBlock, pIndex) => {
              if (!user && pIndex > 1) return null;
              return (
                <div key={pIndex}>
                  <p className={`ArticleParagraph_root__4mszW ${pIndex === 0 ? 'ArticleParagraph_dropcap__uIVzg' : ''}`}>
                    {paragraphBlock.split('\n').map((line, lIndex, linesArray) => (
                      <React.Fragment key={lIndex}>
                        {line}{lIndex < linesArray.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                  {!user && pIndex === 1 && (
                    <div className="mt-8 p-6 border border-primary/20 bg-primary/5 rounded-xl text-center space-y-4">
                      <Lock className="mx-auto h-8 w-8 text-primary/60" />
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white">Sign in to read more</h3>
                        <p className="text-sm text-muted-foreground">Log in to unlock the full article and exclusive content.</p>
                      </div>
                      <Button onClick={handleInteractionRedirect} className="w-full md:w-auto px-10 font-bold bg-white text-black hover:bg-white/90 rounded-full">
                        Sign In to Continue
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Actions Footer */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-1">
            {!isCurrentlyExpanded && (
                <Button variant="outline" className="px-4 py-2 text-foreground/90 hover:text-primary transition-colors text-sm flex items-center border-primary/30 hover:border-primary h-9 rounded-full" onClick={() => onToggleExpand(article.id)}>
                  Read More <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-primary text-primary' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-primary text-primary' : ''}`} />
              </Button>
              {/* Main Link Share */}
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => { e.stopPropagation(); onShare(); }}>
                <Share2 className="h-5 w-5 text-muted-foreground hover:text-primary" />
              </Button>
            </div>
          </div>

          {/* New Polished Share Image Button */}
          <Button 
            variant="default" 
            size="sm"
            onClick={handleShareImage}
            className="bg-primary text-black font-bold rounded-full px-5 h-9 flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
          >
            <ImageIcon className="h-4 w-4" />
            Share Image
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArticleCard;