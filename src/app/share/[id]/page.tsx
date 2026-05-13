import type { Metadata } from "next";
import Link from "next/link";
import { getAdminDb } from "@/lib/firebase-admin";
import ShareRedirectClient from "./redirect-client";

type SharePost = {
  id: string;
  title: string;
  excerpt: string;
  featuredImageUrl?: string;
  body?: string;
  path?: string;
};

const COLLECTIONS = ["myblog_posts", "content"];

async function findPost(idOrPath: string): Promise<SharePost | null> {
  const db = getAdminDb();

  for (const collection of COLLECTIONS) {
    const byId = await db.collection(collection).doc(idOrPath).get();
    if (byId.exists) {
      const d = byId.data() as any;
      return {
        id: byId.id,
        title: String(d?.title || ""),
        excerpt: String(d?.excerpt || ""),
        body: String(d?.body || d?.fullBodyContent || ""),
        featuredImageUrl: String(d?.featuredImageUrl || d?.imageUrl || ""),
        path: String(d?.path || d?.slug || byId.id),
      };
    }

    const byPath = await db.collection(collection).where("path", "==", idOrPath).limit(1).get();
    if (!byPath.empty) {
      const doc = byPath.docs[0];
      const d = doc.data() as any;
      return {
        id: doc.id,
        title: String(d?.title || ""),
        excerpt: String(d?.excerpt || ""),
        body: String(d?.body || d?.fullBodyContent || ""),
        featuredImageUrl: String(d?.featuredImageUrl || d?.imageUrl || ""),
        path: String(d?.path || d?.slug || doc.id),
      };
    }
  }

  return null;
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
    title,
    description,
    openGraph: {
      title,
      description,
      url: absoluteUrl,
      type: "article",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
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
  const post = await findPost(id);
  const target = post?.path || post?.id || id;

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <ShareRedirectClient target={target} />
      <div style={{ textAlign: "center", maxWidth: "680px" }}>
        <h1 style={{ marginBottom: "12px" }}>{post?.title || "Opening article..."}</h1>
        <p style={{ marginBottom: "20px" }}>{post?.excerpt || "Redirecting to full article view..."}</p>
        <Link href={`/?post=${encodeURIComponent(target)}`}>Open article</Link>
      </div>
    </main>
  );
}
