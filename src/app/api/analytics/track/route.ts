import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { randomBytes } from "crypto";

const EVENTS_COLLECTION = "myblog_analytics_events";
const SESSIONS_COLLECTION = "myblog_analytics_sessions";
const ALLOWED_EVENTS = new Set([
  "open_modal",
  "share_click",
  "open_share_link",
  "shared_to_contact",
  "received_shared_link",
  "conversion",
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const articleId = String(body?.articleId || "").trim();
    const eventType = String(body?.eventType || "").trim();
    const source = String(body?.source || "").trim();
    const sessionId = String(body?.sessionId || "").trim();
    const userId = String(body?.userId || "").trim();
    const referrer = String(body?.referrer || "").trim();
    const additionalData = body?.additionalData || {};

    if (!articleId || !ALLOWED_EVENTS.has(eventType)) {
      return NextResponse.json({ ok: false, message: "Invalid analytics payload" }, { status: 400 });
    }

    const db = getAdminDb();
    const timestamp = Date.now();
    
    // Create or update session
    const effectiveSessionId = sessionId || `session_${randomBytes(8).toString("hex")}`;
    
    await db.collection(EVENTS_COLLECTION).add({
      articleId,
      eventType,
      source: source || "web",
      sessionId: effectiveSessionId,
      userId: userId || "anonymous",
      referrer: referrer || null,
      additionalData,
      createdAt: timestamp,
      date: new Date(timestamp).toISOString().split("T")[0], // For easier aggregation
    });

    // Track session activity
    await db.collection(SESSIONS_COLLECTION).doc(effectiveSessionId).set(
      {
        articleIds: { [articleId]: true },
        eventCount: 1,
        lastActivityAt: timestamp,
        userId: userId || "anonymous",
        source: source || "web",
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

