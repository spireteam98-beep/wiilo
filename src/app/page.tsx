"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, Copy, Lock, ShieldCheck, UserRound, X } from "lucide-react";
import styles from "./page.module.css";
import Link from "next/link";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import TopUpDialog from "@/components/TopUpDialog";

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
    credit: post.credit || "",
    body: bodyParts.length > 0 ? bodyParts : [post.excerpt],
    featuredImageUrl: post.featuredImageUrl || "",
  };
}

export default function HomePage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingArticleId, setPendingArticleId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mohamedroyal.com";
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    fetch("/api/myblog-posts", { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ApiPost[]) => {
        if (!mounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const sorted = [...data].sort(
            (a: any, b: any) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0)
          );
          setEntries(sorted.map(mapApiPost));
          try {
            localStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(sorted));
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
        clearTimeout(timeout);
        if (mounted) setLoaded(true);
      });
    return () => {
      mounted = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setCoinBalance(0);
      return;
    }
    const userRef = doc(firestore, "users", user.uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        const data = snap.data() as { coins?: number } | undefined;
        setCoinBalance(Number(data?.coins || 0));
      },
      () => {
        setCoinBalance(0);
      }
    );
    return () => unsub();
  }, [firestore, user?.uid]);

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

  const openArticle = (articleId: string) => {
    if (!user) {
      const returnTo = `/?post=${encodeURIComponent(articleId)}`;
      router.push(`/signin?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (coinBalance <= 0) {
      setPendingArticleId(articleId);
      setPaywallOpen(true);
      return;
    }
    setSelectedId(articleId);
    void trackEvent(articleId, "open_modal");
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
        <div className={styles.utilityRow}>
          <a className={styles.utilityLink} href="/admin/myblog-posts">Admin</a>
          <a className={styles.utilityLink} href="/api/myblog-posts">Feed</a>
        </div>
        <div className={styles.statusRow}>
          <span className={styles.statusPill}>
            <CircleDollarSign className={styles.statusIcon} />
            Balance: {coinBalance} coins
          </span>
          <span className={styles.statusPill}>
            <ShieldCheck className={styles.statusIcon} />
            Protected
          </span>
          <span className={styles.statusPill}>
            <UserRound className={styles.statusIcon} />
            {user ? "Signed in" : "Guest"}
          </span>
        </div>
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
                lead.credit ? <p className={styles.credit}>{lead.credit}</p> : null
              )}
            </div>
            <article>
              <p className={styles.sectionLabel}>Ideas</p>
              <button
                type="button"
                onClick={() => openArticle(lead.id)}
                className={styles.leadTitle}
              >
                {lead.title}
              </button>
              <p className={styles.leadSubtitle}>{lead.subtitle}</p>
              <p className={styles.author}>{lead.author}</p>
              <button
                type="button"
                onClick={() => openArticle(lead.id)}
                className={styles.readMore}
              >
                Read more
              </button>
              {!user ? (
                <p className={styles.gateHint}>
                  <Lock className={styles.gateHintIcon} />
                  Sign in to read full article
                </p>
              ) : null}
            </article>
          </section>

          <section className={styles.river}>
            {river.map((post) => (
              <article key={post.id} className={styles.card}>
                {post.credit ? <p className={styles.credit}>{post.credit}</p> : null}
                <p className={styles.sectionLabel}>Notes</p>
                <button
                  type="button"
                  onClick={() => openArticle(post.id)}
                  className={styles.cardTitle}
                >
                  {post.title}
                </button>
                <p className={styles.cardSubtitle}>{post.subtitle}</p>
                {post.author ? <p className={styles.author}>{post.author}</p> : null}
                <button
                  type="button"
                  onClick={() => openArticle(post.id)}
                  className={styles.readMore}
                >
                  Read more
                </button>
                {!user ? (
                  <p className={styles.gateHint}>
                    <Lock className={styles.gateHintIcon} />
                    Sign in required
                  </p>
                ) : null}
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
              <header
                className={styles.modalHeader}
                style={
                  selected.featuredImageUrl
                    ? { backgroundImage: `url("${selected.featuredImageUrl}")` }
                    : undefined
                }
              >
                <div className={styles.modalTopRule}>
                  <span className={styles.modalKicker}>Royal Notes</span>
                </div>
                <div className={styles.modalTitleWrap}>
                  <h2 className={styles.modalTitle}>{selected.title}</h2>
                  <span className={styles.modalTitleDot} aria-hidden="true" />
                  <p className={styles.modalSubtitle}>{selected.subtitle}</p>
                </div>
                <div className={styles.modalBottomRule} />
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

      <TopUpDialog
        open={paywallOpen}
        onOpenChange={(open) => {
          setPaywallOpen(open);
          if (!open) setPendingArticleId(null);
        }}
        userId={user?.uid || ""}
        userEmail={user?.email || null}
        currentCoins={coinBalance}
        onCoinsUpdated={(nextCoins) => setCoinBalance(nextCoins)}
        onSuccess={() => {
          if (pendingArticleId) {
            setSelectedId(pendingArticleId);
            void trackEvent(pendingArticleId, "open_modal");
            setPendingArticleId(null);
          }
        }}
      />

      <footer className={styles.footer}>
        <div className={styles.footerBottom}>
          <p className={styles.footerMeta}>Privacy Policy</p>
          <p className={styles.footerMeta}>Terms & Conditions</p>
          <p className={styles.footerMeta}>Site Map</p>
          <p className={styles.footerSignature}>mohamedroyal.com © 2026 Mohamed Royal</p>
        </div>
      </footer>
    </main>
  );
}
