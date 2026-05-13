import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import NewsArticleClient from './NewsArticleClient';

interface WpPostResponse {
  id: number;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text?: string }>;
  };
}

const FALLBACK_IMAGE = 'https://picsum.photos/seed/wiillo-news/1200/630';

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
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getPost(id: string): Promise<WpPostResponse | null> {
  try {
    const response = await fetch(`https://www.netbeins.com/wp-json/wp/v2/posts/${id}?_embed`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const post = (await response.json()) as WpPostResponse;
    return post?.id ? post : null;
  } catch {
    return null;
  }
}

function getFeaturedImage(post: WpPostResponse): string {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? FALLBACK_IMAGE;
}

export const revalidate = 300;

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return {
      metadataBase: new URL('https://mohamedroyal.com'),
      title: 'mohamedroyal.com News',
      description: 'Latest stories on mohamedroyal.com.',
    };
  }

  const title = stripHtml(post.title.rendered);
  const description = stripHtml(post.excerpt.rendered).slice(0, 180);
  const image = getFeaturedImage(post);
  const url = `https://mohamedroyal.com/news/${post.id}`;

  return {
    metadataBase: new URL('https://mohamedroyal.com'),
    title: `${title} | mohamedroyal.com News`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: 'mohamedroyal.com',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function NewsSharePage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) notFound();

  const title = stripHtml(post.title.rendered);
  const excerpt = stripHtml(post.excerpt.rendered);
  const image = getFeaturedImage(post);

  return (
    <NewsArticleClient
      id={post.id}
      title={title}
      date={post.date}
      excerpt={excerpt}
      image={image}
      htmlContent={post.content.rendered}
    />
  );
}
