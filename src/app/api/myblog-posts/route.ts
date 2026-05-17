import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const COLLECTION = "myblog_posts";

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection(COLLECTION).orderBy("createdAt", "desc").limit(50).get();
    const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // If custom myblog posts are empty, fallback to existing "content" collection
    if (posts.length === 0) {
      const contentSnapshot = await db
        .collection("content")
        .orderBy("createdAt", "desc")
        .limit(200)
        .get();

      const mapped = contentSnapshot.docs
        .filter((doc) => {
          const data = doc.data() as any;
          return data?.category === "Culture" && data?.contentType === "article";
        })
        .slice(0, 50)
        .map((doc) => {
        const data = doc.data() as any;
        const createdAt =
          data?.createdAt && typeof data.createdAt?.toMillis === "function"
            ? data.createdAt.toMillis()
            : Date.now();

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

      return NextResponse.json(mapped, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      });
    }

    return NextResponse.json(posts, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to load posts", error: String(error?.message || error) },
      { status: 500 }
    );
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
