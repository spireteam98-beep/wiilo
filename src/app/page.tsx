"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, X } from "lucide-react";
import styles from "./page.module.css";
import Link from "next/link";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";

type Entry = {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  credit: string;
  body: string[];
  featuredImageUrl?: string;
};

type ApiPost = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  author?: string;
  credit?: string;
  featuredImageUrl?: string;
};

function mapApiPost(post: ApiPost): Entry {
  const bodyParts = String(post.body || "")
    .split(/\n{2,}/)
    .map((text) => text.trim())
    .filter(Boolean);

  return {
    id: post.id,
    title: post.title,
    subtitle: post.excerpt,
    author: post.author || "Mohamed Royal",
    credit: post.credit || "Illustration by The Atlantic style",
    body: bodyParts.length > 0 ? bodyParts : [post.excerpt],
    featuredImageUrl: post.featuredImageUrl || "",
  };
}

export default function HomePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const POSTS_CACHE_KEY = "myblog_posts_cache_v1";

  const trackEvent = async (articleId: string, eventType: "open_modal" | "share_click" | "open_share_link") => {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ articleId, eventType, source: "home" }),
      });
    } catch {
      // swallow analytics errors so UI remains smooth
    }
  };

  useEffect(() => {
    let mounted = true;
    try {
      const cachedRaw = localStorage.getItem(POSTS_CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as ApiPost[];
        if (Array.isArray(cached) && cached.length > 0) {
          setEntries(cached.map(mapApiPost));
          setLoaded(true);
        }
      }
    } catch {
      // ignore malformed cache
    }

    fetch("/api/myblog-posts")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ApiPost[]) => {
        if (!mounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setEntries(data.map(mapApiPost));
          try {
            localStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(data));
          } catch {
            // ignore cache write errors
          }
        } else {
          setEntries([]);
        }
      })
      .catch(() => {
        setEntries([]);
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (entries.length === 0 || selectedId) return;
    const queryPost = new URLSearchParams(window.location.search).get("post");
    if (!queryPost) return;
    const match = entries.find((item) => item.id === queryPost);
    if (match) {
      setSelectedId(match.id);
    }
  }, [entries, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("ref") !== "share") return;
    const key = `share_open_tracked_${selectedId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void trackEvent(selectedId, "open_share_link");
  }, [selectedId]);

  const lead = entries[0];
  const river = entries.slice(1);
  const selected = useMemo(
    () => entries.find((item) => item.id === selectedId) ?? null,
    [entries, selectedId]
  );
  const shareUrl = useMemo(() => {
    if (!selected) return "";
    const base = publicSiteUrl || origin;
    if (!base) return "";
    return `${base.replace(/\/+$/, "")}/share/${encodeURIComponent(selected.id)}`;
  }, [origin, publicSiteUrl, selected]);
  const shareText = useMemo(() => (selected ? `${selected.title} - ${selected.subtitle}` : ""), [selected]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      if (selected?.id) {
        void trackEvent(selected.id, "share_click");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className={styles.page}>
      {!loaded ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#fff",
            display: "grid",
            placeItems: "center",
            zIndex: 120,
          }}
        >
          <p style={{ fontFamily: "AGaramondPro, serif", fontSize: 24, margin: 0 }}>Loading posts...</p>
        </div>
      ) : null}
      <header className={styles.header}>
        <div className={styles.authBar}>
          <h1 className={styles.brand}>Mohamed Royal</h1>
          {isUserLoading ? <span className={styles.authText}>Checking account...</span> : null}
          {user ? (
            <button
              type="button"
              className={styles.authBtn}
              disabled={signingOut}
              onClick={async () => {
                try {
                  setSigningOut(true);
                  await signOut(auth);
                } finally {
                  setSigningOut(false);
                }
              }}
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          ) : (
            <Link href="/signin" className={styles.authBtnLink}>
              Sign in
            </Link>
          )}
        </div>
      </header>

      {!lead ? (
        <p className={styles.emptyState}>{loaded ? "No posts found yet." : "Loading posts..."}</p>
      ) : (
        <>
          <section className={styles.leadSection}>
            <div className={styles.creditPanel}>
              {lead.featuredImageUrl ? (
                <img src={lead.featuredImageUrl} alt={lead.title} className={styles.featureImage} />
              ) : (
                <p className={styles.credit}>{lead.credit}</p>
              )}
            </div>
            <article>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(lead.id);
                  void trackEvent(lead.id, "open_modal");
                }}
                className={styles.leadTitle}
              >
                {lead.title}
              </button>
              <p className={styles.leadSubtitle}>{lead.subtitle}</p>
              <p className={styles.author}>{lead.author}</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(lead.id);
                  void trackEvent(lead.id, "open_modal");
                }}
                className={styles.readMore}
              >
                Read more
              </button>
            </article>
          </section>

          <section className={styles.river}>
            {river.map((post) => (
              <article key={post.id} className={styles.card}>
                <p className={styles.credit}>{post.credit}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(post.id);
                    void trackEvent(post.id, "open_modal");
                  }}
                  className={styles.cardTitle}
                >
                  {post.title}
                </button>
                <p className={styles.cardSubtitle}>{post.subtitle}</p>
                {post.author ? <p className={styles.author}>{post.author}</p> : null}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(post.id);
                    void trackEvent(post.id, "open_modal");
                  }}
                  className={styles.readMore}
                >
                  Read more
                </button>
              </article>
            ))}
          </section>
        </>
      )}

      <div className={`${styles.modalRoot} ${selected ? styles.modalOpen : ""}`} aria-hidden={!selected}>
        <div onClick={() => setSelectedId(null)} className={styles.backdrop} />
        <section role="dialog" aria-modal="true" className={styles.modal}>
          <button type="button" onClick={() => setSelectedId(null)} className={styles.close} aria-label="Close article">
            <X className={styles.closeIcon} />
          </button>

          {selected ? (
            <article className={styles.modalArticle}>
              <header className={styles.modalHeader}>
                {selected.featuredImageUrl ? (
                  <img src={selected.featuredImageUrl} alt={selected.title} className={styles.modalHeroImage} />
                ) : null}
                <div className={styles.modalHeroOverlay} />
                <div className={styles.modalTitleWrap}>
                  <p className={styles.modalCredit}>{selected.credit}</p>
                  <h2 className={styles.modalTitle}>{selected.title}</h2>
                  <p className={styles.modalSubtitle}>{selected.subtitle}</p>
                </div>
              </header>
              <div className={styles.modalBody}>
                {selected.body.map((paragraph, idx) => (
                  <p key={`${selected.id}-p-${idx}`} className={styles.modalParagraph}>
                    {paragraph}
                  </p>
                ))}
                <p className={styles.modalAuthor}>Royal Notes</p>
                <div className={styles.shareRow}>
                  <button type="button" className={styles.shareBtn} onClick={handleCopyLink} aria-label="Copy article link">
                    <Copy className={styles.shareIcon} />
                    {copied ? "Copied" : "Copy Link"}
                  </button>
                  <a
                    className={styles.shareBtn}
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (selected?.id) void trackEvent(selected.id, "share_click");
                    }}
                  >
                    Facebook
                  </a>
                  <a
                    className={styles.shareBtn}
                    href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (selected?.id) void trackEvent(selected.id, "share_click");
                    }}
                  >
                    WhatsApp
                  </a>
                  <a
                    className={styles.shareBtn}
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (selected?.id) void trackEvent(selected.id, "share_click");
                    }}
                  >
                    Twitter
                  </a>
                </div>
              </div>
            </article>
          ) : null}
        </section>
      </div>

      <footer className={styles.footer}>
        <p className={styles.footerSignature}>Mohamed Royal</p>
      </footer>
    </main>
  );
}
