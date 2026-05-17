"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import newsStyles from '../../news.module.css';

interface NewsArticleClientProps {
  id: number;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  htmlContent: string;
}

function formatNewsDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

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

function estimateReadMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export default function NewsArticleClient({
  id,
  title,
  date,
  excerpt,
  image,
  htmlContent,
}: NewsArticleClientProps) {
  const router = useRouter();

  const plainTextContent = useMemo(() => stripHtml(htmlContent), [htmlContent]);
  const readMinutes = useMemo(() => estimateReadMinutes(plainTextContent), [plainTextContent]);

  return (
    <main className={newsStyles.sharePageRoot}>
      <article className={newsStyles.sharePageShell}>
        <div className={newsStyles.sharePageBody}>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => router.push('/')}
              className="h-10 w-10 rounded-full bg-black/40 backdrop-blur border border-white/20 hover:bg-black/60 flex items-center justify-center"
              aria-label="Back to home"
            >
              <Home className="h-5 w-5 text-white" />
            </button>
            <Link href="/" className={newsStyles.backLink}>
              Back to mohamedroyal.com
            </Link>
          </div>

            <header className={newsStyles.articleHero}>
              <p className={newsStyles.rubric}>News</p>
              <h1 className={newsStyles.articleTitle}>{title}</h1>
              {excerpt ? <p className={newsStyles.articleDek}>{excerpt}</p> : null}
              <div className={newsStyles.utilityBar}>
                <span className={newsStyles.timestamp}>{formatNewsDate(date)}</span>
                <span className={newsStyles.readTime}>{readMinutes} min read</span>
              </div>
            </header>

            <figure className={newsStyles.leadFigure}>
              <img src={image} alt={title} className={newsStyles.leadImage} />
              <figcaption className={newsStyles.leadCaption}>Photo: mohamedroyal.com / Source archive</figcaption>
            </figure>

            <hr className={newsStyles.divider} />

            <section className={newsStyles.articleWell}>
              <div className={newsStyles.body} dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </section>
        </div>
      </article>

    </main>
  );
}
