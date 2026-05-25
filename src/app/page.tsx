"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Coins, Copy, Lock, ShieldCheck, Sparkles, UserRound, X } from "lucide-react";
import styles from "./page.module.css";
import Link from "next/link";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { arrayUnion, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import TopUpDialog from "@/components/TopUpDialog";
import { toast } from "@/hooks/use-toast";

type Entry = {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  credit: string;
  bodyHtml: string;
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

const POSTS_CACHE_KEY = "myblog_posts_cache_v1";

function mapApiPost(post: ApiPost): Entry {
  const bodyHtml = String(post.body || post.excerpt || "").trim();

  return {
    id: post.id,
    title: post.title,
    subtitle: post.excerpt,
    author: post.author || "Mohamed Royal",
    credit: post.credit || "",
    bodyHtml,
    featuredImageUrl: post.featuredImageUrl || "",
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeArticleHtml(value: string): string {
  const cleaned = value
    .replace(/\r\n/g, "\n")
    .replace(/\bclassName=/g, "class=")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<gpt-ad[\s\S]*?<\/gpt-ad>/gi, "")
    .replace(/<\/?(?:iframe|object|embed|form|input|button|link|meta)[^>]*>/gi, "")
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(?:href|src)=["']\s*javascript:[^"']*["']/gi, "");
  const preserveInnerSpacing = cleaned.replace(
    /<(blockquote|div|p|section|h[1-6])\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    (_match, tag, attrs, content) => `<${tag}${attrs}>${content.trim().replace(/\n{2,}/g, "\n")}</${tag}>`
  );

  const normalized = preserveInnerSpacing
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (/^<\/?(?:section|div|p|h[1-6]|blockquote|ul|ol|li|span|strong|em|i|small|hr|br|a|img|figure|figcaption|picture|source)\b/i.test(block)) {
        return block;
      }

      return `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  const bodyInnerHtml = normalized
    .trim()
    .replace(/^<section\b[^>]*ArticleBody_root__2gF81[^>]*>([\s\S]*)<\/section>$/i, "$1")
    .replace(/^<section\b[^>]*>([\s\S]*)<\/section>$/i, "$1");

  return bodyInnerHtml
    .replace(/<p\b(?![^>]*\bclass=)([^>]*)>/gi, '<p class="ArticleParagraph_root__4mszW" data-flatplan-paragraph="true"$1>')
    .replace(/<p\b([^>]*\bclass=["'][^"']*ArticleParagraph_root__4mszW[^"']*["'][^>]*)>/gi, (match) =>
      /\bdata-flatplan-paragraph=/.test(match)
        ? match
        : match.replace(/>$/, ' data-flatplan-paragraph="true">')
    );
}

function getArticlePreviewHtml(normalizedHtml: string): string {
  const paragraphMatches = normalizedHtml.match(/<p\b[\s\S]*?<\/p>/gi);
  if (paragraphMatches?.length) {
    return paragraphMatches.slice(0, 2).join("\n");
  }

  const textOnly = normalizedHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return textOnly ? `<p>${escapeHtml(textOnly.slice(0, 700))}</p>` : "";
}

export default function HomePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingArticleId, setPendingArticleId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [freeReadIds, setFreeReadIds] = useState<string[]>([]);
  const [walletLoaded, setWalletLoaded] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [shareOpenedId, setShareOpenedId] = useState<string | null>(null);
  const [readerPromptVisible, setReaderPromptVisible] = useState(false);
  const [readerPromptDismissed, setReaderPromptDismissed] = useState(false);
  const [podcastNoticeOpen, setPodcastNoticeOpen] = useState(false);
  const modalArticleRef = useRef<HTMLElement | null>(null);
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mohamedroyal.com";

  const trackEvent = async (
    articleId: string | null,
    eventType: "open_modal" | "share_click" | "open_share_link" | "page_view",
    options?: { pageUrl?: string; referrer?: string; source?: string }
  ) => {
    try {
      const payload: Record<string, unknown> = {
        eventType,
        source: options?.source || "home",
      };
      if (articleId) payload.articleId = articleId;
      if (options?.pageUrl) payload.pageUrl = options.pageUrl;
      if (options?.referrer) payload.referrer = options.referrer;

      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify(payload),
      });
    } catch {
      // swallow analytics errors so UI remains smooth
    }
  };

  useEffect(() => {
    const sendPageView = () => {
      const pageUrl = window.location.href;
      const referrer = document.referrer || "";
      void trackEvent(null, "page_view", {
        pageUrl,
        referrer,
        source: referrer ? "referral" : "direct",
      });
    };
    const idleId =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(sendPageView, { timeout: 2200 })
        : window.setTimeout(sendPageView, 900);

    return () => {
      if ("cancelIdleCallback" in window && typeof idleId === "number") {
        window.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, []);

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
    const timeout = setTimeout(() => controller.abort(), 6000);

    fetch("/api/myblog-posts", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
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
        } else if (entries.length === 0) {
          setEntries([]);
        }
      })
      .catch(() => {
        // Keep cached posts on screen if a refresh has a temporary API/server issue.
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
      setFreeReadIds([]);
      setWalletLoaded(true);
      return;
    }
    setWalletLoaded(false);
    const userRef = doc(firestore, "users", user.uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        const data = snap.data() as { coins?: number; freeArticleReads?: unknown } | undefined;
        setCoinBalance(Number(data?.coins || 0));
        const reads = Array.isArray(data?.freeArticleReads)
          ? data.freeArticleReads.filter((v): v is string => typeof v === "string")
          : [];
        setFreeReadIds(reads);
        setWalletLoaded(true);
      },
      () => {
        setCoinBalance(0);
        setFreeReadIds([]);
        setWalletLoaded(true);
      }
    );
    return () => unsub();
  }, [firestore, user?.uid]);

  const markFreeRead = async (articleId: string) => {
    if (!user?.uid) return;
    const userRef = doc(firestore, "users", user.uid);
    try {
      await updateDoc(userRef, { freeArticleReads: arrayUnion(articleId) });
    } catch {
      await setDoc(userRef, { freeArticleReads: [articleId] }, { merge: true });
    }
  };

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
  const selectedArticleHtml = useMemo(
    () => (selected ? normalizeArticleHtml(selected.bodyHtml) : ""),
    [selected]
  );
  const selectedPreviewHtml = useMemo(
    () => getArticlePreviewHtml(selectedArticleHtml),
    [selectedArticleHtml]
  );
  const visibleArticleHtml = selectedArticleHtml || selectedPreviewHtml;
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

  const trackShareClick = () => {
    if (selected?.id) void trackEvent(selected.id, "share_click");
  };

  const handleInstagramShare = async () => {
    await handleCopyLink();
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  const openArticle = (articleId: string) => {
    if (!user) {
      setSelectedId(articleId);
      void trackEvent(articleId, "open_modal");
      return;
    }
    const hasFreeRead = freeReadIds.includes(articleId);
    const freeReadsUsed = freeReadIds.length;
    const hasFreeReadsLeft = freeReadsUsed < 3;

    if (coinBalance <= 0 && !hasFreeRead && !hasFreeReadsLeft) {
      setPendingArticleId(articleId);
      setPaywallOpen(true);
      return;
    }

    if (coinBalance <= 0 && !hasFreeRead && hasFreeReadsLeft) {
      void markFreeRead(articleId);
    }

    setSelectedId(articleId);
    void trackEvent(articleId, "open_modal");
  };

  useEffect(() => {
    if (entries.length === 0 || selectedId || isUserLoading || !walletLoaded) return;
    const params = new URLSearchParams(window.location.search);
    const queryPost = params.get("post");
    if (!queryPost || queryPost === shareOpenedId) return;
    const match = entries.find((item) => item.id === queryPost);
    if (match) {
      setShareOpenedId(match.id);
      openArticle(match.id);
    }
  }, [entries, selectedId, isUserLoading, walletLoaded, shareOpenedId, user, coinBalance, freeReadIds]);

  useEffect(() => {
    setReaderPromptVisible(false);
    setReaderPromptDismissed(false);
  }, [selectedId]);

  useEffect(() => {
    if (!selected || readerPromptDismissed) return;
    const scroller = modalArticleRef.current;
    if (!scroller) return;

    const showAt = Math.max(280, window.innerHeight * 0.42);
    const onScroll = () => {
      if (scroller.scrollTop > showAt) {
        setReaderPromptVisible(true);
      }
    };

    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [selected, readerPromptDismissed]);

  const handleReaderPromptTopUp = () => {
    setReaderPromptDismissed(true);
    setReaderPromptVisible(false);
    if (!user) {
      toast({
        title: "Email access coming soon",
        description: "We are replacing Google sign-in with an email code flow for easier social browser access.",
      });
      return;
    }
    setPendingArticleId(null);
    setPaywallOpen(true);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.statusRow}>
          <span className={styles.statusPill}>
            <ShieldCheck className={styles.statusIcon} />
            Protected
          </span>
          <span className={styles.statusPill}>
            <UserRound className={styles.statusIcon} />
            {user ? "Signed in" : "Guest"}
          </span>
          {user ? (
            <>
              <span className={styles.statusPill}>
                <Coins className={styles.statusIcon} />
                Coins: {coinBalance}
              </span>
              <span className={styles.statusPill}>
                Free reads left: {Math.max(0, 3 - freeReadIds.length)}
              </span>
              <button
                type="button"
                className={styles.topUpStatusButton}
                onClick={() => {
                  setPendingArticleId(null);
                  setPaywallOpen(true);
                }}
              >
                <Coins className={styles.statusIcon} />
                Top up
              </button>
            </>
          ) : null}
        </div>
        <div className={styles.authBar}>
          <h1 className={styles.brand}>Mohamed Royal</h1>
          <div className={styles.headerActions}>
            <nav className={styles.headerMenu} aria-label="Primary">
              <button
                type="button"
                className={styles.headerMenuLink}
                onClick={() => setPodcastNoticeOpen(true)}
              >
                Podcast
              </button>
            </nav>
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
        </div>
      </header>

      {!lead ? (
        loaded ? (
          <p className={styles.emptyState}>Posts will appear shortly.</p>
        ) : (
          <section className={styles.loadingShell} aria-label="Loading posts">
            <div className={styles.loadingImage} />
            <div className={styles.loadingCopy}>
              <span className={styles.loadingLineWide} />
              <span className={styles.loadingLine} />
              <span className={styles.loadingLineShort} />
            </div>
          </section>
        )
      ) : (
        <>
          <section className={styles.leadSection}>
            <div className={styles.creditPanel}>
              {lead.featuredImageUrl ? (
                <img
                  src={lead.featuredImageUrl}
                  alt={lead.title}
                  className={styles.featureImage}
                  decoding="async"
                  fetchPriority="high"
                  sizes="(max-width: 1023px) 100vw, 52vw"
                />
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
                {post.featuredImageUrl ? (
                  <button
                    type="button"
                    onClick={() => openArticle(post.id)}
                    className={styles.cardImageButton}
                  >
                    <img
                      src={post.featuredImageUrl}
                      alt={post.title}
                      className={styles.cardImage}
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 640px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    />
                  </button>
                ) : (
                  post.credit ? <p className={styles.credit}>{post.credit}</p> : null
                )}
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
            <article className={`${styles.modalArticle} ArticleLayout_article__RHFMN article-content-body`} ref={modalArticleRef}>
              <header className={`${styles.modalHeader} ArticleHero_root__3w7kV ArticleHero_articleStandard__2tcdv`} data-event-module="hero">
                <div className="ArticleHero_defaultArticleLockup__vb8lz">
                <div className={styles.articleLockup}>
                  <div className={`${styles.modalRubric} ArticleHero_rubric__e4rjD`}>
                    <div className="ArticleRubric_root__HNhbf" id="rubric" data-flatplan-rubric="true">
                      <span className={`${styles.modalRubricLink} ArticleRubric_link__nl9hy`}>Ideas</span>
                    </div>
                  </div>
                  <div className={`${styles.modalTitleWrap} ArticleHero_title__PQ4pC`}>
                    <h1 className={`${styles.modalTitle} ArticleTitle_root__VrZaG`} data-flatplan-title="true">{selected.title}</h1>
                  </div>
                  <div className={`${styles.modalDek} ArticleHero_dek__EqdkK`} data-flatplan-description="true">
                    <p className={`${styles.modalSubtitle} ArticleDek_root__P3leE`}>{selected.subtitle}</p>
                  </div>
                  <div className={`${styles.modalByline} ArticleHero_byline__iFT6A`}>
                    <div className="ArticleBylines_root__IBR5V">
                      <address id="byline">By <span className="ArticleBylines_link__kNP4C" data-flatplan-author-link="true">{selected.author || "Mohamed Royal"}</span></address>
                    </div>
                  </div>
                </div>

                {selected.featuredImageUrl ? (
                  <div className={`${styles.articleLeadArt} ArticleLeadArt_root__nRSLU`}>
                    <figure className={`${styles.articleLeadFigure} ArticleLeadFigure_root__Bj81R ArticleLeadFigure_standard__20Izv`}>
                      <div className={`${styles.articleLeadFigureMedia} ArticleLeadFigure_media__R1npW`} data-flatplan-lead_figure_media="true">
                        <picture>
                          <img
                            src={selected.featuredImageUrl}
                            alt={selected.title}
                            className={`${styles.articleLeadImage} Image_root__XxsOp ArticleLeadArt_image__HZS4B`}
                            width={960}
                            height={540}
                            sizes="(min-width: 976px) 976px, 100vw"
                            id="article-lead-image"
                          />
                        </picture>
                      </div>
                      {selected.credit ? (
                        <figcaption className={`${styles.articleLeadCaption} ArticleLeadFigure_caption__Byu7W ArticleLeadFigure_standardCaption__PsDkd`} data-flatplan-lead_figure_caption="true">{selected.credit}</figcaption>
                      ) : null}
                    </figure>
                  </div>
                ) : null}
                </div>

                <div className={`${styles.articleUtilityBar} ArticleHero_articleUtilityBar__JbQFj`}>
                  <div className={`${styles.articleTimestamp} ArticleHero_timestamp__bKhcB`}>
                    <time className="ArticleTimestamp_root__b3bL6" dateTime={new Date().toISOString()} data-flatplan-timestamp="true">Gift Notes</time>
                  </div>
                  <div className={`${styles.articleUtilityTools} ArticleHero_articleUtilityBarTools__ZHw8s`}>
                    <button type="button" className={styles.shareBtn} onClick={handleCopyLink} aria-label="Copy article link">
                      <Copy className={styles.shareIcon} />
                      {copied ? "Copied" : "Share"}
                    </button>
                  </div>
                </div>
              </header>
              <div className={styles.modalBody}>
                <section
                  className={`${styles.articleContent} ArticleBody_root__2gF81`}
                  data-event-module="article body"
                  data-flatplan-body="true"
                  data-cmd="true"
                  dangerouslySetInnerHTML={{ __html: visibleArticleHtml }}
                />
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
                    onClick={trackShareClick}
                  >
                    Facebook
                  </a>
                  <a
                    className={styles.shareBtn}
                    href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={trackShareClick}
                  >
                    WhatsApp
                  </a>
                  <a
                    className={styles.shareBtn}
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={trackShareClick}
                  >
                    Twitter
                  </a>
                  <a
                    className={styles.shareBtn}
                    href={`https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={trackShareClick}
                  >
                    Snapchat
                  </a>
                  <button
                    type="button"
                    className={styles.shareBtn}
                    onClick={handleInstagramShare}
                  >
                    Instagram
                  </button>
                </div>
              </div>
              {readerPromptVisible && !readerPromptDismissed ? (
                <aside className={styles.readerPrompt} aria-label="Subscribe reminder">
                  <button
                    type="button"
                    className={styles.readerPromptClose}
                    onClick={() => {
                      setReaderPromptDismissed(true);
                      setReaderPromptVisible(false);
                    }}
                    aria-label="Dismiss subscribe reminder"
                  >
                    <X className={styles.readerPromptCloseIcon} />
                  </button>
                  <div className={styles.readerPromptIcon}>
                    <Sparkles className={styles.readerPromptSparkle} />
                  </div>
                  <div className={styles.readerPromptCopy}>
                    <p className={styles.readerPromptKicker}>Support Gift Notes</p>
                    <p className={styles.readerPromptText}>
                      Keep reading premium stories with a quick coin top-up.
                    </p>
                  </div>
                  <div className={styles.readerPromptActions}>
                    <button
                      type="button"
                      className={styles.readerPromptCancel}
                      onClick={() => {
                        setReaderPromptDismissed(true);
                        setReaderPromptVisible(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.readerPromptButton}
                      onClick={handleReaderPromptTopUp}
                    >
                      Subscribe
                    </button>
                  </div>
                </aside>
              ) : null}
            </article>
          ) : null}
        </section>
      </div>

      {podcastNoticeOpen ? (
        <div className={styles.podcastNoticeLayer} role="presentation" onClick={() => setPodcastNoticeOpen(false)}>
          <section
            className={styles.podcastNotice}
            role="dialog"
            aria-modal="true"
            aria-labelledby="podcast-notice-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.podcastNoticeClose}
              onClick={() => setPodcastNoticeOpen(false)}
              aria-label="Close podcast message"
            >
              <X className={styles.podcastNoticeCloseIcon} />
            </button>
            <p className={styles.podcastNoticeKicker}>Podcast</p>
            <h2 id="podcast-notice-title" className={styles.podcastNoticeTitle}>
              Goordhow Filow
            </h2>
          </section>
        </div>
      ) : null}

      <TopUpDialog
        open={paywallOpen}
        onOpenChange={(open) => {
          setPaywallOpen(open);
          if (!open) setPendingArticleId(null);
        }}
        userId={user?.uid || ""}
        userEmail={user?.email || null}
        userDisplayName={user?.displayName || null}
        userPhotoURL={user?.photoURL || null}
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
