import type { Metadata } from "next";
import Link from "next/link";
import { getAdminDb } from "@/lib/firebase-admin";
import ShareRedirectClient from "./redirect-client";
import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await findPost(id);
  const title = post?.title || "Myblog";
  const description = post?.excerpt || "Read the full article";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:9002";
  const image = post?.featuredImageUrl || "https://picsum.photos/seed/myblog-share/1200/630";
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
      images: [{ url: image, secureUrl: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const target = id;
  const headerStore = await headers();
  const ua = (headerStore.get("user-agent") || "").toLowerCase();
  const isSocialCrawler =
    ua.includes("facebookexternalhit") ||
    ua.includes("facebot") ||
    ua.includes("twitterbot") ||
    ua.includes("whatsapp") ||
    ua.includes("linkedinbot") ||
    ua.includes("telegrambot") ||
    ua.includes("slackbot") ||
    ua.includes("discordbot") ||
    ua.includes("googlebot");

  if (!isSocialCrawler) {
    redirect(`/?post=${encodeURIComponent(target)}&ref=share`);
  }

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
