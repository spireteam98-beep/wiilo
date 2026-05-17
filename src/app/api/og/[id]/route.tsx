import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(_request.url);
  const title = (url.searchParams.get("t") || "Mohamed Royal").slice(0, 140);
  const excerpt = (url.searchParams.get("e") || "Read the full article on mohamedroyal.com").slice(0, 220);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background: "linear-gradient(135deg, #0f0f0f 0%, #1b1b1b 60%, #2a2a2a 100%)",
          color: "white",
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 1.2, color: "#e7131a" }}>MOHAMED ROYAL</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 62, lineHeight: 1.05, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 30, lineHeight: 1.28, color: "#e5e5e5" }}>{excerpt}</div>
        </div>
        <div style={{ fontSize: 24, color: "#d4d4d4" }}>mohamedroyal.com / {id}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

