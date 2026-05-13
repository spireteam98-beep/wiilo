import { Metadata } from 'next';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ClientPageContent from './ClientPageContent';

export async function generateMetadata({ searchParams }: { searchParams: any }): Promise<Metadata> {
  const params = await searchParams;
  const articleId = params?.articleId;

  if (!articleId) return {}; // Falls back to layout.tsx metadata

  try {
    const docRef = doc(db, 'content', articleId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const article = snap.data();
      const title = article.title || 'Royal Notes';
      const description = (article.excerpt || "Read the full story on Mohamed Royal").replace(/<[^>]*>?/gm, '').substring(0, 150);
      
      // Use the absolute URL for the image generator
      const ogImageUrl = `/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&image=${encodeURIComponent(article.imageUrl || '')}`;

      return {
        title: title,
        description: description,
        openGraph: {
          title: title,
          description: description,
          url: `/?articleId=${articleId}`,
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
          type: 'article',
        },
        twitter: {
          card: 'summary_large_image',
          images: [ogImageUrl],
        },
      };
    }
  } catch (e) {
    console.error("Metadata error", e);
  }
  return {};
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary/50" /></div>}>
      <ClientPageContent />
    </Suspense>
  );
}