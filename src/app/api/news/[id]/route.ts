import { NextResponse } from "next/server";
import { getCachedPostById } from "@/lib/news";

export async function GET(_: Request, context: { params: { id: string } }) {
  try {
    const post = await getCachedPostById(context.params.id);
    return NextResponse.json(post, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }
}

