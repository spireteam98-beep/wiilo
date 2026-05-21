import { NextResponse } from "next/server";
import { getAdminDb, hasExplicitFirebaseAdminCredentials } from "@/lib/firebase-admin";

const COLLECTIONS = ["myblog_posts", "content"];
const LIVE_POSTS_API = "https://mohamedroyal.com/api/myblog-posts";

type ShareImagePost = {
  id: string;
  title: string;
  excerpt: string;
  featuredImageUrl: string;
};

async function findLivePost(id: string): Promise<ShareImagePost | null> {
  const response = await fetch(LIVE_POSTS_API, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;

  const posts = await response.json();
  if (!Array.isArray(posts)) return null;
  const post = posts.find((item: any) => String(item?.id || "") === id);
  if (!post) return null;

  return {
    id,
    title: String(post?.title || ""),
    excerpt: String(post?.excerpt || ""),
    featuredImageUrl: String(post?.featuredImageUrl || post?.imageUrl || ""),
  };
}

async function findAdminPost(id: string): Promise<ShareImagePost | null> {
  const db = getAdminDb();

  for (const collection of COLLECTIONS) {
    const byId = await db.collection(collection).doc(id).get();
    if (byId.exists) {
      const data = byId.data() as any;
      return {
        id: byId.id,
        title: String(data?.title || ""),
        excerpt: String(data?.excerpt || ""),
        featuredImageUrl: String(data?.featuredImageUrl || data?.imageUrl || ""),
      };
    }
  }

  return null;
}

async function findPost(id: string): Promise<ShareImagePost | null> {
  if (process.env.NODE_ENV !== "production" && !hasExplicitFirebaseAdminCredentials()) {
    return findLivePost(id);
  }

  try {
    return await findAdminPost(id);
  } catch {
    return findLivePost(id);
  }
}

function fallbackOgUrl(request: Request, id: string, post?: ShareImagePost | null) {
  const url = new URL(request.url);
  url.pathname = `/api/og/${encodeURIComponent(id)}`;
  url.search = "";
  url.searchParams.set("t", post?.title || "Mohamed Royal");
  url.searchParams.set("e", post?.excerpt || "Read the full article on mohamedroyal.com");
  return url;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await findPost(id);
  const imageUrl = post?.featuredImageUrl?.trim();

  if (!imageUrl) {
    return NextResponse.redirect(fallbackOgUrl(request, id, post));
  }

  try {
    const imageResponse = await fetch(imageUrl, {
      cache: "no-store",
      headers: { Accept: "image/avif,image/webp,image/jpeg,image/png,image/*,*/*" },
    });
    if (!imageResponse.ok) {
      return NextResponse.redirect(fallbackOgUrl(request, id, post));
    }

    const input = Buffer.from(await imageResponse.arrayBuffer());
    const sharp = (await import("sharp")).default;
    const image = await sharp(input)
      .rotate()
      .resize(1200, 630, {
        fit: "contain",
        background: "#0c0c0c",
      })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();

    return new Response(image, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.redirect(fallbackOgUrl(request, id, post));
  }
}
