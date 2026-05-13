// app/news/[id]/page.tsx

import { notFound } from 'next/navigation';
import NewsArticleClient from './NewsArticleClient';
import { getCachedPostById } from '@/lib/news';

// ── Helpers ───────────────────────────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Fetch post ────────────────────────────────────────────
async function getPost(id: string) {
  try {
    return await getCachedPostById(id);
  } catch {
    return null;
  }
}

// ── Metadata (CRITICAL for sharing) ───────────────────────
export async function generateMetadata({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);

  if (!post) {
    return {
      title: 'Article not found',
      description: 'This article could not be found.',
    };
  }

  const title = stripHtml(post.title?.rendered || 'News Article');
  const description = stripHtml(post.excerpt?.rendered || '').slice(0, 150);

  const image =
    post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
    'https://mohamedroyal.com/default-og.jpg'; // fallback image

  const url = `https://mohamedroyal.com/news/${params.id}`;

  return {
    metadataBase: new URL('https://mohamedroyal.com'),

    title,
    description,

    alternates: {
      canonical: url,
    },

    openGraph: {
      title,
      description,
      url,
      siteName: 'mohamedroyal.com',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
        },
      ],
      type: 'article',
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

// ── Page Component ────────────────────────────────────────
export default async function Page({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);

  if (!post) {
    notFound();
  }

  const image =
    post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
    'https://mohamedroyal.com/default-og.jpg';

  return (
    <NewsArticleClient
      id={post.id}
      title={post.title?.rendered || ''}
      date={post.date || ''}
      excerpt={post.excerpt?.rendered || ''}
      image={image}
      htmlContent={post.content?.rendered || ''}
    />
  );
}
