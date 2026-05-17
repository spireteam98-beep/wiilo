import { NextRequest, NextResponse } from "next/server";
import { syncWordPressPostsToFirestore } from "@/lib/news";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const providedSecret = String(body?.secret || "");
    const expectedSecret = process.env.NEWS_SYNC_SECRET || "";

    if (!expectedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const limit = Math.min(Math.max(Number(body?.limit) || 20, 1), 50);
    const result = await syncWordPressPostsToFirestore(limit);
    return NextResponse.json({
      ok: true,
      synced: result.count,
      source: "wordpress->firestore",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: "Sync failed", error: String(error?.message || error) },
      { status: 500 }
    );
  }
}

