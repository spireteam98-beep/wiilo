import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getAdminDb } from "@/lib/firebase-admin";

const EVENTS_COLLECTION = "myblog_analytics_events";
const SESSIONS_COLLECTION = "myblog_analytics_sessions";
const ALLOWED_EVENTS = new Set([
  "open_modal",
  "share_click",
  "open_share_link",
  "shared_to_contact",
  "received_shared_link",
  "conversion",
  "page_view",
]);

function getHostFromUrl(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawArticleId = String(body?.articleId || "").trim();
    const eventType = String(body?.eventType || "").trim();
    const source = String(body?.source || "").trim() || "web";
    const sessionId = String(body?.sessionId || "").trim();
    const userId = String(body?.userId || "").trim() || "anonymous";
    const referrer = String(body?.referrer || "").trim();
    const pageUrl = String(body?.pageUrl || "").trim();
    const domain = String(body?.domain || "").trim();
    const additionalData = body?.additionalData || {};

    const articleId = rawArticleId || (eventType === "page_view" ? "site_visit" : "");
    if (!articleId || !ALLOWED_EVENTS.has(eventType)) {
      return NextResponse.json({ ok: false, message: "Invalid analytics payload" }, { status: 400 });
    }

    const db = getAdminDb();
    const timestamp = Date.now();
    const date = new Date(timestamp).toISOString().split("T")[0];
    const effectiveSessionId = sessionId || `session_${randomBytes(8).toString("hex")}`;
    const pageHost = domain || getHostFromUrl(pageUrl) || "unknown";
    const referrerHost = getHostFromUrl(referrer);
    const isDirect = eventType === "page_view" && !referrerHost;

    await db.collection(EVENTS_COLLECTION).add({
      articleId,
      eventType,
      source,
      sessionId: effectiveSessionId,
      userId,
      referrer: referrer || null,
      referrerHost: referrerHost || null,
      pageUrl: pageUrl || null,
      domain: pageHost,
      isDirect,
      additionalData,
      createdAt: timestamp,
      date,
    });

    await db.collection(SESSIONS_COLLECTION).doc(effectiveSessionId).set(
      {
        articleIds: { [articleId]: true },
        eventCount: 1,
        lastActivityAt: timestamp,
        userId,
        source,
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, sessionId: effectiveSessionId });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: "Failed to record analytics event", error: String(error?.message || error) },
      { status: 500 }
    );
  }
}

