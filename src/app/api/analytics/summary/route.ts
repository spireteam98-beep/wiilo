import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const EVENTS_COLLECTION = "myblog_analytics_events";
const POSTS_COLLECTION = "myblog_posts";

type EventTotals = {
  open_modal: number;
  share_click: number;
  open_share_link: number;
  shared_to_contact: number;
  received_shared_link: number;
  conversion: number;
  page_view: number;
};

type AnalyticsRow = {
  articleId: string;
  title: string;
  excerpt: string;
  featuredImageUrl: string;
  totals: EventTotals;
  directVisits: number;
  directVisitsByDate: { [date: string]: number };
  totalEngagement: number;
  byDate: { [date: string]: EventTotals };
};

function emptyTotals(): EventTotals {
  return {
    open_modal: 0,
    share_click: 0,
    open_share_link: 0,
    shared_to_contact: 0,
    received_shared_link: 0,
    conversion: 0,
    page_view: 0,
  };
}

export async function GET() {
  try {
    const db = getAdminDb();
    const [postsSnap, eventsSnap] = await Promise.all([
      db.collection(POSTS_COLLECTION).orderBy("createdAt", "desc").limit(200).get(),
      db.collection(EVENTS_COLLECTION).orderBy("createdAt", "desc").limit(10000).get(),
    ]);

    const articleMap = new Map<string, AnalyticsRow>();
    const dailySiteVisits: { [date: string]: number } = {};
    const dailyDirectSiteVisits: { [date: string]: number } = {};

    postsSnap.docs.forEach((doc) => {
      const d = doc.data() as any;
      articleMap.set(doc.id, {
        articleId: doc.id,
        title: String(d?.title || ""),
        excerpt: String(d?.excerpt || ""),
        featuredImageUrl: String(d?.featuredImageUrl || ""),
        totals: emptyTotals(),
        directVisits: 0,
        directVisitsByDate: {},
        totalEngagement: 0,
        byDate: {},
      });
    });

    eventsSnap.docs.forEach((doc) => {
      const d = doc.data() as any;
      const articleId = String(d?.articleId || "site_visit");
      const eventType = String(d?.eventType || "");
      const date = String(d?.date || "unknown");
      const isDirect = Boolean(d?.isDirect);

      if (!articleMap.has(articleId)) {
        articleMap.set(articleId, {
          articleId,
          title: articleId,
          excerpt: "",
          featuredImageUrl: "",
          totals: emptyTotals(),
          directVisits: 0,
          directVisitsByDate: {},
          totalEngagement: 0,
          byDate: {},
        });
      }

      const row = articleMap.get(articleId)!;

      if (!row.byDate[date]) {
        row.byDate[date] = emptyTotals();
      }

      if (eventType in row.totals) {
        row.totals[eventType as keyof EventTotals] += 1;
        row.byDate[date][eventType as keyof EventTotals] += 1;
      }

      if (eventType === "page_view") {
        dailySiteVisits[date] = (dailySiteVisits[date] || 0) + 1;
      }

      if (isDirect && eventType === "page_view") {
        row.directVisits += 1;
        row.directVisitsByDate[date] = (row.directVisitsByDate[date] || 0) + 1;
        dailyDirectSiteVisits[date] = (dailyDirectSiteVisits[date] || 0) + 1;
      }

      row.totalEngagement += 1;
    });

    const rows = Array.from(articleMap.values()).sort((a, b) => b.totalEngagement - a.totalEngagement);

    return NextResponse.json(
      { ok: true, rows, dailySiteVisits, dailyDirectSiteVisits },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: "Failed to load analytics summary", error: String(error?.message || error) },
      { status: 500 }
    );
  }
}

