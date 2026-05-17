"use client";

import { FormEvent, useState } from "react";

export default function NewsSyncAdminPage() {
  const [secret, setSecret] = useState("");
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/news/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, limit }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        setResult(`Sync failed: ${data?.message || "Unknown error"}`);
      } else {
        setResult(`Sync complete. Imported ${data.synced} posts to Firestore.`);
      }
    } catch (error: any) {
      setResult(`Sync failed: ${String(error?.message || error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100dvh", background: "#0b0b0f", color: "#f5f5f7", padding: "24px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", border: "1px solid #23232b", borderRadius: 14, padding: 20, background: "#111119" }}>
        <h1 style={{ fontSize: 24, margin: "0 0 8px", fontWeight: 700 }}>News Sync Admin</h1>
        <p style={{ margin: "0 0 20px", color: "#b7b7c5", lineHeight: 1.5 }}>
          Import WordPress articles into Firestore. After import, home and article pages read from Firestore only.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#cfd0db" }}>Sync Secret</span>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
              placeholder="NEWS_SYNC_SECRET"
              style={{
                background: "#181823",
                border: "1px solid #2c2c39",
                borderRadius: 10,
                color: "#fff",
                height: 42,
                padding: "0 12px",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#cfd0db" }}>Limit (1 - 50)</span>
            <input
              type="number"
              min={1}
              max={50}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{
                background: "#181823",
                border: "1px solid #2c2c39",
                borderRadius: 10,
                color: "#fff",
                height: 42,
                padding: "0 12px",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 44,
              border: "none",
              borderRadius: 10,
              background: loading ? "#3d3d5a" : "#4f46e5",
              color: "#fff",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Syncing..." : "Run Sync"}
          </button>
        </form>

        {result ? (
          <p style={{ marginTop: 16, fontSize: 14, color: result.startsWith("Sync complete") ? "#86efac" : "#fca5a5" }}>
            {result}
          </p>
        ) : null}
      </div>
    </main>
  );
}

