import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, hasExplicitFirebaseAdminCredentials } from "@/lib/firebase-admin";

const COLLECTION = "myblog_posts";
const LIVE_POSTS_API = "https://mohamedroyal.com/api/myblog-posts";

type PostRecord = Record<string, unknown> & { id: string };

function toMillis(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Date.parse(value) || 0;
  }
  if (value && typeof value.toMillis === "function") return value.toMillis();
  if (value && typeof value._seconds === "number") return value._seconds * 1000;
  if (value && typeof value.seconds === "number") return value.seconds * 1000;
  return 0;
}

function normalizePost(post: PostRecord): PostRecord {
  return {
    ...post,
    createdAt: toMillis((post as any).createdAt),
    updatedAt: toMillis((post as any).updatedAt),
  };
}

function jsonPosts(posts: PostRecord[]) {
  return NextResponse.json(posts, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}

function jsonEmptyFallback() {
  return NextResponse.json([], {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

async function readLivePostsFallback() {
  const response = await fetch(LIVE_POSTS_API, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Live posts fallback failed: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizePost) : [];
}

async function readLocalFirestorePosts() {
  const db = getAdminDb();
  const snapshot = await db.collection(COLLECTION).orderBy("createdAt", "desc").limit(200).get();
  const posts = snapshot.docs.map((doc) => normalizePost({ id: doc.id, ...doc.data() }));

  // If custom myblog posts are empty, fallback to existing "content" collection
  if (posts.length === 0) {
    const contentSnapshot = await db
      .collection("content")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    return contentSnapshot.docs
      .filter((doc) => {
        const data = doc.data() as any;
        return data?.category === "Culture" && data?.contentType === "article";
      })
      .slice(0, 200)
      .map((doc) => {
        const data = doc.data() as any;
        const createdAt = toMillis(data?.createdAt) || Date.now();

        return {
          id: doc.id,
          title: String(data?.title || ""),
          excerpt: String(data?.excerpt || ""),
          body: String(data?.fullBodyContent || data?.excerpt || ""),
          featuredImageUrl: String(data?.imageUrl || ""),
          path: String(data?.slug || doc.id),
          author: String(data?.author || "Mohamed Royal"),
          credit: String(data?.credit || "From content/Culture"),
          category: String(data?.category || ""),
          contentType: String(data?.contentType || ""),
          createdAt,
          updatedAt: createdAt,
        };
      });
  }

  return posts;
}

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    if (process.env.NODE_ENV !== "production" && !hasExplicitFirebaseAdminCredentials()) {
      return jsonPosts(await readLivePostsFallback());
    }

    return jsonPosts(await readLocalFirestorePosts());
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      try {
        return jsonPosts(await readLivePostsFallback());
      } catch {
        // Return the original local Firestore error below.
      }
    }

    console.error("[myblog-posts] Failed to load posts:", error);
    return jsonEmptyFallback();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = String(body?.title || "").trim();
    const excerpt = String(body?.excerpt || "").trim();
    const articleBody = String(body?.body || "").trim();
    const featuredImageUrl = String(body?.featuredImageUrl || "").trim();
    const path = String(body?.path || "").trim();
    const author = String(body?.author || "Mohamed Royal").trim();
    const credit = String(body?.credit || "").trim();

    if (!title || !excerpt || !articleBody) {
      return NextResponse.json({ message: "title, excerpt and body are required" }, { status: 400 });
    }

    const safePath = path || toSlug(title);
    const db = getAdminDb();
    const docRef = db.collection(COLLECTION).doc();
    await docRef.set({
      title,
      excerpt,
      body: articleBody,
      featuredImageUrl,
      path: safePath,
      author,
      credit,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to create post", error: String(error?.message || error) },
      { status: 500 }
    );
  }
}
