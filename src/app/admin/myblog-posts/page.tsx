"use client";

import { ClipboardEvent, CSSProperties, FormEvent, useRef, useState } from "react";

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
  conversionRate: number;
  totalEngagement: number;
  uniqueSessions: number;
  byDate: { [date: string]: EventTotals };
};

export default function MyblogPostsAdminPage() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [path, setPath] = useState("");
  const [author, setAuthor] = useState("Mohamed Royal");
  const [credit, setCredit] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [debug, setDebug] = useState("");
  const [analyticsRows, setAnalyticsRows] = useState<AnalyticsRow[]>([]);
  const [dailySiteVisits, setDailySiteVisits] = useState<{ [date: string]: number }>({});
  const [dailyDirectSiteVisits, setDailyDirectSiteVisits] = useState<{ [date: string]: number }>({});
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [analyticsView, setAnalyticsView] = useState<"summary" | "detailed">("summary");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const syncBodyFromEditor = () => {
    setBody(editorRef.current?.innerHTML || "");
  };

  const saveEditorSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    savedSelectionRef.current = range.cloneRange();
  };

  const restoreEditorSelection = () => {
    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current);
  };

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const runEditorCommand = (command: string, value?: string) => {
    focusEditor();
    restoreEditorSelection();
    document.execCommand(command, false, value);
    saveEditorSelection();
    syncBodyFromEditor();
  };

  const insertQuoteBlock = () => {
    focusEditor();
    restoreEditorSelection();
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (selectedText) {
      document.execCommand("formatBlock", false, "blockquote");
    } else {
      document.execCommand(
        "insertHTML",
        false,
        "<blockquote>Write a highlighted quote here.</blockquote><p><br></p>"
      );
    }
    saveEditorSelection();
    syncBodyFromEditor();
  };

  const handleEditorPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    saveEditorSelection();
    syncBodyFromEditor();
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const response = await fetch("/api/analytics/summary", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok || !Array.isArray(data?.rows)) {
        setAnalyticsError(data?.message || "Failed to load analytics");
        setAnalyticsRows([]);
        setDailySiteVisits({});
        setDailyDirectSiteVisits({});
      } else {
        setAnalyticsRows(data.rows);
        setDailySiteVisits(data.dailySiteVisits || {});
        setDailyDirectSiteVisits(data.dailyDirectSiteVisits || {});
      }
    } catch (error: any) {
      setAnalyticsError(String(error?.message || error));
      setAnalyticsRows([]);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setResult("");
    setDebug("");
    try {
      const articleBody = editorRef.current?.innerHTML || body;
      const articleText = editorRef.current?.innerText || "";
      if (!articleText.trim()) {
        setResult("Failed to save post");
        setDebug("Article body is required. Add body content before saving.");
        setLoading(false);
        return;
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch("/api/myblog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ title, excerpt, body: articleBody, featuredImageUrl, path, author, credit }),
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
        if (editorRef.current) editorRef.current.innerHTML = "";
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
      <div style={{ maxWidth: 1200, margin: "0 auto", border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Myblog Post Admin</h1>
        <p style={{ marginTop: 8, color: "#555" }}>
          Add article title, excerpt, full body, featured image URL, and path.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 18 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required style={inputStyle} />
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Excerpt" required rows={3} style={textareaStyle} />
          <section style={editorShellStyle}>
            <div style={editorHeaderStyle}>
              <div>
                <p style={editorLabelStyle}>Article Body Designer</p>
                <p style={editorHintStyle}>Use the tools to create headings, quotes, lists, color, and bold text. The saved body is HTML.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBody("");
                  if (editorRef.current) editorRef.current.innerHTML = "";
                }}
                style={subtleToolButtonStyle}
              >
                Clear
              </button>
            </div>

            <div style={toolbarStyle} aria-label="Article body formatting tools">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand("formatBlock", "p")} style={toolButtonStyle}>
                Paragraph
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand("formatBlock", "h1")} style={toolButtonStyle}>
                Huge title
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand("formatBlock", "h2")} style={toolButtonStyle}>
                Title
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand("formatBlock", "h3")} style={toolButtonStyle}>
                Big subtitle
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand("bold")} style={toolButtonStyle}>
                Bold
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand("italic")} style={toolButtonStyle}>
                Italic
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertQuoteBlock} style={toolButtonStyle}>
                Quote
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand("insertUnorderedList")} style={toolButtonStyle}>
                Bullet list
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand("insertOrderedList")} style={toolButtonStyle}>
                Numbering
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand("removeFormat")} style={toolButtonStyle}>
                Remove style
              </button>
              <button type="button" aria-label="Black text" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand("foreColor", "#000000")} style={{ ...colorToolStyle, background: "#000000" }} />
              <button type="button" aria-label="Red text" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand("foreColor", "#e7131a")} style={{ ...colorToolStyle, background: "#e7131a" }} />
              <button type="button" aria-label="Blue text" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand("foreColor", "#1d9bf0")} style={{ ...colorToolStyle, background: "#1d9bf0" }} />
              <button type="button" aria-label="Gold text" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand("foreColor", "#b7791f")} style={{ ...colorToolStyle, background: "#b7791f" }} />
            </div>

            <div
              ref={editorRef}
              contentEditable
              role="textbox"
              aria-label="Full article body"
              aria-multiline="true"
              onInput={syncBodyFromEditor}
              onBlur={syncBodyFromEditor}
              onFocus={saveEditorSelection}
              onKeyUp={saveEditorSelection}
              onMouseUp={saveEditorSelection}
              onSelect={saveEditorSelection}
              onPaste={handleEditorPaste}
              suppressContentEditableWarning
              style={editorCanvasStyle}
              data-placeholder="Write the full article body here. Select text and use the tools above to style it."
            />
            <input type="hidden" value={body} required readOnly />
            <details style={htmlPreviewStyle}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>HTML saved to Firestore</summary>
              <pre style={htmlCodeStyle}>{body || "<p>Your styled HTML will appear here.</p>"}</pre>
            </details>
          </section>
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

        <section style={{ marginTop: 28, borderTop: "1px solid #e5e7eb", paddingTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>Article Analytics</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={analyticsView}
                onChange={(e) => setAnalyticsView(e.target.value as "summary" | "detailed")}
                style={{
                  height: 38,
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  padding: "0 8px",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <option value="summary">Summary View</option>
                <option value="detailed">Detailed View</option>
              </select>
              <button
                type="button"
                onClick={loadAnalytics}
                disabled={analyticsLoading}
                style={{
                  height: 38,
                  border: "none",
                  borderRadius: 8,
                  background: analyticsLoading ? "#9ca3af" : "#111",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "0 14px",
                  cursor: analyticsLoading ? "not-allowed" : "pointer",
                }}
              >
                {analyticsLoading ? "Loading..." : "Refresh Analytics"}
              </button>
            </div>
          </div>

          {analyticsError ? (
            <p style={{ marginTop: 12, color: "#b91c1c" }}>{analyticsError}</p>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 18 }}>
            {(() => {
              const today = new Date().toISOString().split("T")[0];
              const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
              const todayVisits = dailySiteVisits[today] || 0;
              const yesterdayVisits = dailySiteVisits[yesterday] || 0;
              const allTimeVisits = Object.values(dailySiteVisits).reduce((sum, value) => sum + value, 0);
              const todayDirectVisits = dailyDirectSiteVisits[today] || 0;
              const allTimeDirectVisits = Object.values(dailyDirectSiteVisits).reduce((sum, value) => sum + value, 0);
              return (
                <>
                  <div style={{ ...metricBoxStyle, background: "#f8fafc" }}>
                    <p style={metricLabelStyle}>Today visits</p>
                    <p style={metricValueStyle}>{todayVisits}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>{today}</p>
                  </div>
                  <div style={{ ...metricBoxStyle, background: "#f8fafc" }}>
                    <p style={metricLabelStyle}>Yesterday visits</p>
                    <p style={metricValueStyle}>{yesterdayVisits}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>{yesterday}</p>
                  </div>
                  <div style={{ ...metricBoxStyle, background: "#f8fafc" }}>
                    <p style={metricLabelStyle}>Today direct visits</p>
                    <p style={metricValueStyle}>{todayDirectVisits}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>{today}</p>
                  </div>
                  <div style={{ ...metricBoxStyle, background: "#f8fafc" }}>
                    <p style={metricLabelStyle}>All-time visits</p>
                    <p style={metricValueStyle}>{allTimeVisits}</p>
                  </div>
                  <div style={{ ...metricBoxStyle, background: "#f8fafc" }}>
                    <p style={metricLabelStyle}>All-time direct visits</p>
                    <p style={metricValueStyle}>{allTimeDirectVisits}</p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* SUMMARY VIEW */}
          {analyticsView === "summary" && (
            <div style={{ marginTop: 12, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Article</th>
                    <th style={thStyle}>Modal Opens</th>
                    <th style={thStyle}>Share Clicks</th>
                    <th style={thStyle}>Share Link Opens</th>
                    <th style={thStyle}>Conversions</th>
                    <th style={thStyle}>Conversion Rate</th>
                    <th style={thStyle}>Total Engagement</th>
                    <th style={thStyle}>Unique Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsRows.length === 0 ? (
                    <tr>
                      <td style={tdStyle} colSpan={8}>
                        {analyticsLoading ? "Loading analytics..." : "No analytics yet. Click Refresh Analytics."}
                      </td>
                    </tr>
                  ) : (
                    analyticsRows.map((row) => (
                      <tr key={row.articleId} style={{ cursor: "pointer", background: expandedArticle === row.articleId ? "#f9fafb" : "transparent" }}>
                        <td style={tdStyle}>
                          <button
                            onClick={() => setExpandedArticle(expandedArticle === row.articleId ? null : row.articleId)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#0066cc",
                              textDecoration: "underline",
                              textAlign: "left",
                              padding: 0,
                            }}
                          >
                            <strong>{row.title || row.articleId}</strong>
                          </button>
                          {row.excerpt ? (
                            <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 13 }}>{row.excerpt}</p>
                          ) : null}
                        </td>
                        <td style={tdStyle}>{row.totals.open_modal}</td>
                        <td style={tdStyle}>{row.totals.share_click}</td>
                        <td style={tdStyle}>{row.totals.open_share_link}</td>
                        <td style={tdStyle}>{row.totals.conversion}</td>
                        <td style={tdStyle}>{row.conversionRate}%</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{row.totalEngagement}</td>
                        <td style={tdStyle}>{row.uniqueSessions}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* DETAILED VIEW */}
          {analyticsView === "detailed" && (
            <div style={{ marginTop: 12 }}>
              {analyticsRows.length === 0 ? (
                <p style={{ color: "#666" }}>No analytics yet. Click Refresh Analytics.</p>
              ) : (
                analyticsRows.map((row) => (
                  <div
                    key={row.articleId}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 12,
                      background: "#fafafa",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                      <div>
                        <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>{row.title || row.articleId}</h3>
                        {row.excerpt && <p style={{ margin: 0, color: "#666", fontSize: 13 }}>{row.excerpt}</p>}
                      </div>
                      <button
                        onClick={() => setExpandedArticle(expandedArticle === row.articleId ? null : row.articleId)}
                        style={{
                          background: "none",
                          border: "1px solid #d1d5db",
                          padding: "4px 8px",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        {expandedArticle === row.articleId ? "Hide Details" : "Show Details"}
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 12 }}>
                      <div style={metricBoxStyle}>
                        <p style={metricLabelStyle}>Modal Opens</p>
                        <p style={metricValueStyle}>{row.totals.open_modal}</p>
                      </div>
                      <div style={metricBoxStyle}>
                        <p style={metricLabelStyle}>Share Clicks</p>
                        <p style={metricValueStyle}>{row.totals.share_click}</p>
                      </div>
                      <div style={metricBoxStyle}>
                        <p style={metricLabelStyle}>Shared to Contacts</p>
                        <p style={metricValueStyle}>{row.totals.shared_to_contact}</p>
                      </div>
                      <div style={metricBoxStyle}>
                        <p style={metricLabelStyle}>Share Link Opens</p>
                        <p style={metricValueStyle}>{row.totals.open_share_link}</p>
                      </div>
                      <div style={metricBoxStyle}>
                        <p style={metricLabelStyle}>Received Shared Links</p>
                        <p style={metricValueStyle}>{row.totals.received_shared_link}</p>
                      </div>
                      <div style={metricBoxStyle}>
                        <p style={metricLabelStyle}>Conversions</p>
                        <p style={metricValueStyle}>{row.totals.conversion}</p>
                      </div>
                      <div style={metricBoxStyle}>
                        <p style={metricLabelStyle}>Conversion Rate</p>
                        <p style={metricValueStyle}>{row.conversionRate}%</p>
                      </div>
                      <div style={metricBoxStyle}>
                        <p style={metricLabelStyle}>Total Engagement</p>
                        <p style={metricValueStyle}>{row.totalEngagement}</p>
                      </div>
                      <div style={metricBoxStyle}>
                        <p style={metricLabelStyle}>Unique Sessions</p>
                        <p style={metricValueStyle}>{row.uniqueSessions}</p>
                      </div>
                    </div>

                    {expandedArticle === row.articleId && Object.keys(row.byDate).length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
                        <h4 style={{ margin: "0 0 10px", fontSize: 14 }}>Daily Breakdown</h4>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                            <thead>
                              <tr style={{ background: "#f3f4f6" }}>
                                <th style={{ ...thStyle, fontSize: 12 }}>Date</th>
                                <th style={{ ...thStyle, fontSize: 12 }}>Opens</th>
                                <th style={{ ...thStyle, fontSize: 12 }}>Shares</th>
                                <th style={{ ...thStyle, fontSize: 12 }}>Shared</th>
                                <th style={{ ...thStyle, fontSize: 12 }}>Link Opens</th>
                                <th style={{ ...thStyle, fontSize: 12 }}>Received</th>
                                <th style={{ ...thStyle, fontSize: 12 }}>Conversions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(row.byDate)
                                .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                                .map(([date, totals]) => (
                                  <tr key={date}>
                                    <td style={{ ...tdStyle, fontSize: 12 }}>{date}</td>
                                    <td style={{ ...tdStyle, fontSize: 12 }}>{totals.open_modal}</td>
                                    <td style={{ ...tdStyle, fontSize: 12 }}>{totals.share_click}</td>
                                    <td style={{ ...tdStyle, fontSize: 12 }}>{totals.shared_to_contact}</td>
                                    <td style={{ ...tdStyle, fontSize: 12 }}>{totals.open_share_link}</td>
                                    <td style={{ ...tdStyle, fontSize: 12 }}>{totals.received_shared_link}</td>
                                    <td style={{ ...tdStyle, fontSize: 12 }}>{totals.conversion}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </section>
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

const editorShellStyle: CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 12,
  overflow: "hidden",
  background: "#fff",
};

const editorHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 14px",
  borderBottom: "1px solid #e5e7eb",
  background: "#f8fafc",
};

const editorLabelStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
};

const editorHintStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: 12,
  lineHeight: 1.45,
  color: "#64748b",
};

const toolbarStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  padding: 12,
  borderBottom: "1px solid #e5e7eb",
  background: "#fff",
};

const toolButtonStyle: CSSProperties = {
  minHeight: 34,
  border: "1px solid #d1d5db",
  borderRadius: 999,
  padding: "0 12px",
  background: "#fff",
  color: "#111827",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const subtleToolButtonStyle: CSSProperties = {
  ...toolButtonStyle,
  color: "#64748b",
  fontWeight: 600,
};

const colorToolStyle: CSSProperties = {
  width: 34,
  height: 34,
  border: "2px solid #fff",
  borderRadius: 999,
  boxShadow: "0 0 0 1px #d1d5db",
  cursor: "pointer",
};

const editorCanvasStyle: CSSProperties = {
  minHeight: 360,
  padding: "18px 20px",
  fontFamily: 'TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: 18,
  lineHeight: "26px",
  color: "#000",
  outline: "none",
};

const htmlPreviewStyle: CSSProperties = {
  borderTop: "1px solid #e5e7eb",
  padding: "10px 12px",
  background: "#fbfdff",
  fontSize: 12,
  color: "#334155",
};

const htmlCodeStyle: CSSProperties = {
  margin: "10px 0 0",
  maxHeight: 180,
  overflow: "auto",
  whiteSpace: "pre-wrap",
  background: "#0f172a",
  color: "#e2e8f0",
  borderRadius: 8,
  padding: 10,
};

const thStyle: CSSProperties = {
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left",
  padding: "10px 8px",
  fontSize: 13,
  color: "#334155",
  fontWeight: 600,
};

const tdStyle: CSSProperties = {
  borderBottom: "1px solid #f1f5f9",
  textAlign: "left",
  padding: "10px 8px",
  fontSize: 14,
  verticalAlign: "top",
};

const metricBoxStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 12,
  textAlign: "center",
};

const metricLabelStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const metricValueStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: 24,
  fontWeight: "bold",
  color: "#111",
};
