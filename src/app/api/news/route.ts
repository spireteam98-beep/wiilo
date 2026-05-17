import { NextRequest, NextResponse } from "next/server";
import { getCachedPosts } from "@/lib/news";

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitParam) || 8, 1), 20);
    const posts = await getCachedPosts(limit);
    return NextResponse.json(posts, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch news posts", error: String(error?.message || error) },
      { status: 500 }
    );
  }
}

