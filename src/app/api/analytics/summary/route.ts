import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const EVENTS_COLLECTION = "myblog_analytics_events";
const POSTS_COLLECTION = "myblog_posts";

type Totals = {
  open_modal: number;
  share_click: number;
  open_share_link: number;
};

function emptyTotals(): Totals {
  return { open_modal: 0, share_click: 0, open_share_link: 0 };
}

export async function GET() {
  try {
    const db = getAdminDb();
    const [postsSnap, eventsSnap] = await Promise.all([
      db.collection(POSTS_COLLECTION).orderBy("createdAt", "desc").limit(200).get(),
      db.collection(EVENTS_COLLECTION).orderBy("createdAt", "desc").limit(5000).get(),
    ]);

    const articleMap = new Map<
      string,
      {
        articleId: string;
        title: string;
        excerpt: string;
        featuredImageUrl: string;
        totals: Totals;
      }
    >();

    postsSnap.docs.forEach((doc) => {
      const d = doc.data() as any;
      articleMap.set(doc.id, {
        articleId: doc.id,
        title: String(d?.title || ""),
        excerpt: String(d?.excerpt || ""),
        featuredImageUrl: String(d?.featuredImageUrl || ""),
        totals: emptyTotals(),
      });
    });

    eventsSnap.docs.forEach((doc) => {
      const d = doc.data() as any;
      const articleId = String(d?.articleId || "");
      const eventType = String(d?.eventType || "");
      if (!articleId) return;

      if (!articleMap.has(articleId)) {
        articleMap.set(articleId, {
          articleId,
          title: articleId,
          excerpt: "",
          featuredImageUrl: "",
          totals: emptyTotals(),
        });
      }

      const row = articleMap.get(articleId)!;
      if (eventType === "open_modal") row.totals.open_modal += 1;
      if (eventType === "share_click") row.totals.share_click += 1;
      if (eventType === "open_share_link") row.totals.open_share_link += 1;
    });

    const rows = Array.from(articleMap.values()).sort(
      (a, b) =>
        b.totals.open_modal + b.totals.share_click + b.totals.open_share_link -
        (a.totals.open_modal + a.totals.share_click + a.totals.open_share_link)
    );

    return NextResponse.json({ ok: true, rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: "Failed to load analytics summary", error: String(error?.message || error) },
      { status: 500 }
    );
  }
}

