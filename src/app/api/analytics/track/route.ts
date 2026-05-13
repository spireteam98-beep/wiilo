import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const EVENTS_COLLECTION = "myblog_analytics_events";
const ALLOWED_EVENTS = new Set(["open_modal", "share_click", "open_share_link"]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const articleId = String(body?.articleId || "").trim();
    const eventType = String(body?.eventType || "").trim();
    const source = String(body?.source || "").trim();

    if (!articleId || !ALLOWED_EVENTS.has(eventType)) {
      return NextResponse.json({ ok: false, message: "Invalid analytics payload" }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection(EVENTS_COLLECTION).add({
      articleId,
      eventType,
      source: source || "web",
      createdAt: Date.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: "Failed to record analytics event", error: String(error?.message || error) },
      { status: 500 }
    );
  }
}

