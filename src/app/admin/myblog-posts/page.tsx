"use client";

import { CSSProperties, FormEvent, useState } from "react";

export default function MyblogPostsAdminPage() {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [path, setPath] = useState("");
  const [author, setAuthor] = useState("Royal Midnimo");
  const [credit, setCredit] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [debug, setDebug] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setResult("");
    setDebug("");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch("/api/myblog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ title, excerpt, body, featuredImageUrl, path, author, credit }),
      });
      clearTimeout(timeout);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        setResult(`Failed to save post`);
        setDebug(
          `HTTP ${response.status} ${response.statusText}\n` +
            `message: ${data?.message || "Unknown error"}\n` +
            `error: ${data?.error || "n/a"}`
        );
      } else {
        setResult("Post saved successfully.");
        setDebug(`HTTP ${response.status} ${response.statusText}\nid: ${data?.id || "n/a"}`);
        setTitle("");
        setExcerpt("");
        setBody("");
        setFeaturedImageUrl("");
        setPath("");
        setCredit("");
      }
    } catch (error: any) {
      const isTimeout = error?.name === "AbortError";
      setResult(isTimeout ? "Failed: request timeout after 15s" : "Failed: network or server error");
      setDebug(String(error?.message || error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100dvh", background: "#fff", color: "#111", padding: "24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Myblog Post Admin</h1>
        <p style={{ marginTop: 8, color: "#555" }}>
          Add article title, excerpt, full body, featured image URL, and path.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 18 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required style={inputStyle} />
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Excerpt" required rows={3} style={textareaStyle} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Full article body" required rows={10} style={textareaStyle} />
          <input value={featuredImageUrl} onChange={(e) => setFeaturedImageUrl(e.target.value)} placeholder="Featured image URL" style={inputStyle} />
          <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="Path (example: secret-of-survivor)" style={inputStyle} />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" style={inputStyle} />
          <input value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="Credit line" style={inputStyle} />

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 44,
              border: "none",
              borderRadius: 8,
              background: loading ? "#9ca3af" : "#111",
              color: "#fff",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving..." : "Save Post"}
          </button>
        </form>

        {result ? <p style={{ marginTop: 14, color: result.startsWith("Post saved") ? "#166534" : "#b91c1c" }}>{result}</p> : null}
        {debug ? (
          <pre
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 8,
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              color: "#334155",
              fontSize: 12,
              whiteSpace: "pre-wrap",
            }}
          >
            {debug}
          </pre>
        ) : null}
      </div>
    </main>
  );
}

const inputStyle: CSSProperties = {
  height: 42,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "0 12px",
  fontSize: 14,
};

const textareaStyle: CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  lineHeight: 1.5,
};
