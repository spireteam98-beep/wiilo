import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const EVENTS_COLLECTION = "myblog_analytics_events";
const SESSIONS_COLLECTION = "myblog_analytics_sessions";
const POSTS_COLLECTION = "myblog_posts";

type EventTotals = {
  open_modal: number;
  share_click: number;
  open_share_link: number;
  shared_to_contact: number;
  received_shared_link: number;
  conversion: number;
};

type AnalyticsRow = {
  articleId: string;
  title: string;
  excerpt: string;
  featuredImageUrl: string;
  totals: EventTotals;
  conversionRate: number; // percentage of share_click that lead to conversions
  totalEngagement: number;
  uniqueSessions: number;
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
  };
}

export async function GET() {
  try {
    const db = getAdminDb();
    const [postsSnap, eventsSnap, sessionsSnap] = await Promise.all([
      db.collection(POSTS_COLLECTION).orderBy("createdAt", "desc").limit(200).get(),
      db.collection(EVENTS_COLLECTION).orderBy("createdAt", "desc").limit(10000).get(),
      db.collection(SESSIONS_COLLECTION).limit(5000).get(),
    ]);

    const articleMap = new Map<string, AnalyticsRow>();

    // Initialize articles
    postsSnap.docs.forEach((doc) => {
      const d = doc.data() as any;
      articleMap.set(doc.id, {
        articleId: doc.id,
        title: String(d?.title || ""),
        excerpt: String(d?.excerpt || ""),
        featuredImageUrl: String(d?.featuredImageUrl || ""),
        totals: emptyTotals(),
        conversionRate: 0,
        totalEngagement: 0,
        uniqueSessions: new Set<string>().size,
        byDate: {},
      });
    });

    // Aggregate session data per article
    const sessionsByArticle = new Map<string, Set<string>>();
    sessionsSnap.docs.forEach((doc) => {
      const d = doc.data() as any;
      const articleIds = Object.keys(d?.articleIds || {});
      const sessionId = doc.id;
      
      articleIds.forEach((articleId) => {
        if (!sessionsByArticle.has(articleId)) {
          sessionsByArticle.set(articleId, new Set());
        }
        sessionsByArticle.get(articleId)!.add(sessionId);
      });
    });

    // Process events
    eventsSnap.docs.forEach((doc) => {
      const d = doc.data() as any;
      const articleId = String(d?.articleId || "");
      const eventType = String(d?.eventType || "");
      const date = String(d?.date || "unknown");
      const sessionId = String(d?.sessionId || "");

      if (!articleId || !Object.keys(emptyTotals()).includes(eventType)) return;

      if (!articleMap.has(articleId)) {
        articleMap.set(articleId, {
          articleId,
          title: articleId,
          excerpt: "",
          featuredImageUrl: "",
          totals: emptyTotals(),
          conversionRate: 0,
          totalEngagement: 0,
          uniqueSessions: 0,
          byDate: {},
        });
      }

      const row = articleMap.get(articleId)!;

      // Update totals
      row.totals[eventType as keyof EventTotals] += 1;

      // Update by date
      if (!row.byDate[date]) {
        row.byDate[date] = emptyTotals();
      }
      row.byDate[date][eventType as keyof EventTotals] += 1;
    });

    // Calculate derived metrics
    const rows = Array.from(articleMap.values()).map((row) => {
      // Set unique sessions count
      row.uniqueSessions = sessionsByArticle.get(row.articleId)?.size || 0;

      // Calculate total engagement
      row.totalEngagement = Object.values(row.totals).reduce((sum, count) => sum + count, 0);

      // Calculate conversion rate (share_click to conversion ratio)
      if (row.totals.share_click > 0) {
        row.conversionRate = Math.round((row.totals.conversion / row.totals.share_click) * 100);
      } else {
        row.conversionRate = 0;
      }

      return row;
    });

    // Sort by total engagement
    rows.sort((a, b) => b.totalEngagement - a.totalEngagement);

    return NextResponse.json(
      { ok: true, rows, lastUpdated: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: "Failed to load analytics summary", error: String(error?.message || error) },
      { status: 500 }
    );
  }
}

