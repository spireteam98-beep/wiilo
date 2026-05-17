import type { Metadata } from "next";
import Link from "next/link";
import { getAdminDb } from "@/lib/firebase-admin";
import ShareRedirectClient from "./redirect-client";
import { unstable_cache } from "next/cache";
import { headers } from "next/headers";

type SharePost = {
  id: string;
  title: string;
  excerpt: string;
  featuredImageUrl?: string;
  body?: string;
};

const COLLECTIONS = ["myblog_posts", "content"];

const findPostCached = unstable_cache(
  async (id: string): Promise<SharePost | null> => {
    if (id.startsWith("http://") || id.startsWith("https://")) return null;
    const db = getAdminDb();

    for (const collection of COLLECTIONS) {
      const byId = await db.collection(collection).doc(id).get();
      if (byId.exists) {
        const d = byId.data() as any;
        return {
          id: byId.id,
          title: String(d?.title || ""),
          excerpt: String(d?.excerpt || ""),
          body: String(d?.body || d?.fullBodyContent || ""),
          featuredImageUrl: String(d?.featuredImageUrl || d?.imageUrl || ""),
        };
      }
    }

    return null;
  },
  ["share-post-lookup-v1"],
  { revalidate: 300 }
);

async function findPost(id: string): Promise<SharePost | null> {
  if (id.startsWith("http://") || id.startsWith("https://")) return null;
  return findPostCached(id);
}

async function resolveShareImage(featuredImage: string | undefined, fallbackImage: string): Promise<string> {
  if (!featuredImage) return fallbackImage;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(featuredImage, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);

    if (!response.ok) return fallbackImage;
    const type = (response.headers.get("content-type") || "").toLowerCase();
    if (!type.startsWith("image/")) return fallbackImage;

    const length = Number(response.headers.get("content-length") || "0");
    if (length > 0 && length < 8000) return fallbackImage; // likely tiny image
    return featuredImage;
  } catch {
    return fallbackImage;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await findPost(id);
  const title = post?.title || "Myblog";
  const description = post?.excerpt || "Read the full article";
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const runtimeSiteUrl = host ? `${proto}://${host}` : "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || runtimeSiteUrl || "https://mohamedroyal.com";
  const fallbackImage = `${siteUrl}/api/og/${encodeURIComponent(id)}?t=${encodeURIComponent(title)}&e=${encodeURIComponent(description)}`;
  const image = await resolveShareImage(post?.featuredImageUrl, fallbackImage);
  const absoluteUrl = `${siteUrl}/share/${encodeURIComponent(id)}`;

  return {
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: absoluteUrl,
    },
    title,
    description,
    openGraph: {
      title,
      description,
      url: absoluteUrl,
      type: "article",
      siteName: "mohamedroyal.com",
      images: [{ url: image, secureUrl: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image, alt: title }],
      creator: "@mohamedroyal",
    },
  };
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const target = id;
  const post = await findPost(id);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <ShareRedirectClient target={target} />
      <div style={{ textAlign: "center", maxWidth: "680px" }}>
        <h1 style={{ marginBottom: "12px" }}>{post?.title || "Opening article..."}</h1>
        <p style={{ marginBottom: "20px" }}>{post?.excerpt || "Redirecting to full article view..."}</p>
        <Link href={`/?post=${encodeURIComponent(target)}&ref=share`}>Open article</Link>
      </div>
    </main>
  );
}
