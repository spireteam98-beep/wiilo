import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";

const WP_BASE = "https://www.netbeins.com/wp-json/wp/v2/posts";
const NEWS_COLLECTION = "news_posts";

export interface WpPost {
  id: number;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  link: string;
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string; alt_text?: string }>;
    "wp:term"?: Array<Array<{ name: string }>>;
  };
}

interface StoredNewsPost {
  wpId: number;
  date: string;
  titleRendered: string;
  excerptRendered: string;
  contentRendered: string;
  link: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function toWpShape(post: StoredNewsPost): WpPost {
  return {
    id: post.wpId,
    date: post.date,
    title: { rendered: post.titleRendered || "" },
    excerpt: { rendered: post.excerptRendered || "" },
    content: { rendered: post.contentRendered || "" },
    link: post.link || "",
    _embedded: {
      "wp:featuredmedia": [
        {
          source_url: post.featuredImage || `https://picsum.photos/seed/news${post.wpId}/600/400`,
          alt_text: post.featuredImageAlt || "",
        },
      ],
    },
  };
}

async function fetchWpJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`WordPress fetch failed: ${res.status}`);
  return res.json() as Promise<T>;
}

function fromWpToStored(post: WpPost): StoredNewsPost {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  return {
    wpId: post.id,
    date: post.date,
    titleRendered: post.title?.rendered || "",
    excerptRendered: post.excerpt?.rendered || "",
    contentRendered: post.content?.rendered || "",
    link: post.link || "",
    featuredImage: media?.source_url || "",
    featuredImageAlt: media?.alt_text || "",
    updatedAt: new Date().toISOString(),
  };
}

export async function syncWordPressPostsToFirestore(limit = 20) {
  const url = `${WP_BASE}?_embed&per_page=${Math.min(Math.max(limit, 1), 50)}`;
  const wpPosts = await fetchWpJson<WpPost[]>(url);
  const db = getAdminDb();
  const batch = db.batch();
  let count = 0;

  for (const post of wpPosts) {
    const docRef = db.collection(NEWS_COLLECTION).doc(String(post.id));
    batch.set(docRef, fromWpToStored(post), { merge: true });
    count += 1;
  }

  if (count > 0) await batch.commit();
  return { count };
}

async function readPostsFromFirestore(limit: number): Promise<WpPost[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection(NEWS_COLLECTION)
      .orderBy("date", "desc")
      .limit(limit)
      .get();

    if (snapshot.empty) return [];
    return snapshot.docs.map((doc) => toWpShape(doc.data() as StoredNewsPost));
  } catch (error) {
    console.error("[News] readPostsFromFirestore failed:", error);
    return [];
  }
}

async function readPostByIdFromFirestore(id: string): Promise<WpPost | null> {
  try {
    const db = getAdminDb();
    const doc = await db.collection(NEWS_COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return toWpShape(doc.data() as StoredNewsPost);
  } catch (error) {
    console.error("[News] readPostByIdFromFirestore failed:", error);
    return null;
  }
}

export const getCachedPosts = unstable_cache(
  async (limit: number) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);

    // Firestore-primary mode with fail-safe to keep homepage usable
    try {
      return await readPostsFromFirestore(safeLimit);
    } catch (error) {
      console.error("[News] Firestore read failed in getCachedPosts:", error);
      return [];
    }
  },
  ["news-posts-cache-v3-firestore-only"],
  { revalidate: 300 }
);

export const getCachedPostById = unstable_cache(
  async (id: string) => {
    // Firestore-only mode (no runtime WordPress fallback)
    const fromFirestore = await readPostByIdFromFirestore(id);
    if (!fromFirestore) {
      throw new Error(`Post ${id} not found in Firestore`);
    }
    return fromFirestore;
  },
  ["news-post-by-id-cache-v3-firestore-only"],
  { revalidate: 300 }
);
