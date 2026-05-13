"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
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
  path?: string;
};

const defaultEntries: Entry[] = [
  {
    id: "survivor-secret",
    title: "The Secret of Survivor",
    subtitle:
      "For 50 seasons, the show has gamified the tension at the heart of American life: Are we individuals or a community?",
    author: "Julie Beck",
    credit:
      "Illustration by The Atlantic. Sources: CBS Broadcasting; CBS / Getty; Chuck Snyder / CBS / Getty; Monty Brinton / CBS Photo Archive / Getty; Monty Brinton / CBS / Getty.",
    body: [
      "The model of an authoritarian leader that the 20th century instilled in the Western imagination is a master of lies. Big Brother commands a machinery of propaganda that bombards his subjects with relentless projections of strength, combined with savaging of enemies real or imagined.",
      "Donald Trump resembles this archetype in many ways, both superficially (the obsession with building new monuments to his greatness or renaming existing structures after him) and substantively (pressuring media and business into capitulating, turning the power ministries into organs of vengeance). But he differs in one key aspect: The president is a recipient and victim of propaganda as much as he is an originator of it.",
    ],
  },
  {
    id: "checkmate-iran",
    title: "Checkmate in Iran",
    subtitle: "Washington can’t reverse or control the consequences of losing this war.",
    author: "Robert Kagan",
    credit:
      "Illustration by The Atlantic. Sources: Amirhossein Khorgooe / AFP / Getty; Maximillian Mann / The New York Times / Redux; Saul Loeb / AFP / Getty.",
    body: [
      "The model of an authoritarian leader that the 20th century instilled in the Western imagination is a master of lies. Big Brother commands a machinery of propaganda that bombards his subjects with relentless projections of strength, combined with savaging of enemies real or imagined.",
      "Donald Trump resembles this archetype in many ways, both superficially (the obsession with building new monuments to his greatness or renaming existing structures after him) and substantively (pressuring media and business into capitulating, turning the power ministries into organs of vengeance). But he differs in one key aspect: The president is a recipient and victim of propaganda as much as he is an originator of it.",
    ],
  },
  {
    id: "trump-vance-rubio",
    title: "Trump Isn’t Setting Vance or Rubio Up for the Future",
    subtitle:
      "The moves the president is making right now will put all possible successors in the same predicament.",
    author: "David A. Graham",
    credit: "Illustration by The Atlantic. Source: Tom William / CQ-Roll Call Inc. / Getty",
    body: [
      "The model of an authoritarian leader that the 20th century instilled in the Western imagination is a master of lies. Big Brother commands a machinery of propaganda that bombards his subjects with relentless projections of strength, combined with savaging of enemies real or imagined.",
      "Donald Trump resembles this archetype in many ways, both superficially (the obsession with building new monuments to his greatness or renaming existing structures after him) and substantively (pressuring media and business into capitulating, turning the power ministries into organs of vengeance). But he differs in one key aspect: The president is a recipient and victim of propaganda as much as he is an originator of it.",
    ],
  },
  {
    id: "unpredictable-unreliable",
    title: "Trump Has Gone From Unpredictable to Unreliable",
    subtitle: "Allies and rivals alike are less likely to give the president what he seeks.",
    author: "",
    credit: "Samuel Corum / Getty",
    body: [
      "The model of an authoritarian leader that the 20th century instilled in the Western imagination is a master of lies. Big Brother commands a machinery of propaganda that bombards his subjects with relentless projections of strength, combined with savaging of enemies real or imagined.",
      "Donald Trump resembles this archetype in many ways, both superficially (the obsession with building new monuments to his greatness or renaming existing structures after him) and substantively (pressuring media and business into capitulating, turning the power ministries into organs of vengeance). But he differs in one key aspect: The president is a recipient and victim of propaganda as much as he is an originator of it.",
    ],
  },
];

function mapApiPost(post: ApiPost): Entry {
  const bodyParts = String(post.body || "")
    .split(/\n{2,}/)
    .map((text) => text.trim())
    .filter(Boolean);
  return {
    id: post.id,
    title: post.title,
    subtitle: post.excerpt,
    author: post.author || "Royal Midnimo",
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
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    let mounted = true;
    fetch("/api/myblog-posts")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ApiPost[]) => {
        if (!mounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setEntries(data.map(mapApiPost));
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

  const lead = entries[0];
  const river = entries.slice(1);
  const selected = useMemo(
    () => entries.find((item) => item.id === selectedId) ?? null,
    [entries, selectedId]
  );

  if (!lead) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <div className={styles.authBar}>
            {isUserLoading ? (
              <span className={styles.authText}>Checking account...</span>
            ) : user ? (
              <>
                <span className={styles.authText}>Signed in as {user.email || "account user"}</span>
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
              </>
            ) : (
              <Link href="/signin" className={styles.authBtnLink}>
                Sign in
              </Link>
            )}
          </div>
          <p className={styles.kicker}>Myblog Home</p>
          <h1 className={styles.brand}>Royal Midnimo</h1>
        </header>
        <section className={styles.introWrap}>
          <p className={styles.intro}>
            {loaded
              ? "No posts found in Firestore yet. Add your first post in admin."
              : "Loading posts..."}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.authBar}>
          {isUserLoading ? (
            <span className={styles.authText}>Checking account...</span>
          ) : user ? (
            <>
              <span className={styles.authText}>Signed in as {user.email || "account user"}</span>
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
            </>
          ) : (
            <Link href="/signin" className={styles.authBtnLink}>
              Sign in
            </Link>
          )}
        </div>
        <p className={styles.kicker}>Myblog Home</p>
        <h1 className={styles.brand}>Royal Midnimo</h1>
      </header>

      <section className={styles.introWrap}>
        <p className={styles.intro}>A first entry from a slow personal site, built to last longer than a feed.</p>
      </section>

      <section className={styles.leadSection}>
        <div className={styles.creditPanel}>
          {lead.featuredImageUrl ? (
            <img src={lead.featuredImageUrl} alt={lead.title} className={styles.featureImage} />
          ) : (
            <p className={styles.credit}>{lead.credit}</p>
          )}
        </div>
        <article>
          <button type="button" onClick={() => setSelectedId(lead.id)} className={styles.leadTitle}>
            {lead.title}
          </button>
          <p className={styles.leadSubtitle}>{lead.subtitle}</p>
          <p className={styles.author}>{lead.author}</p>
          <button type="button" onClick={() => setSelectedId(lead.id)} className={styles.readMore}>
            Read more
          </button>
        </article>
      </section>

      <section className={styles.river}>
        {river.map((post) => (
          <article key={post.id} id={post.id} className={styles.card}>
            <p className={styles.credit}>{post.credit}</p>
            <button type="button" onClick={() => setSelectedId(post.id)} className={styles.cardTitle}>
              {post.title}
            </button>
            <p className={styles.cardSubtitle}>{post.subtitle}</p>
            {post.author ? <p className={styles.author}>{post.author}</p> : null}
            <button type="button" onClick={() => setSelectedId(post.id)} className={styles.readMore}>
              Read more
            </button>
          </article>
        ))}
      </section>

      <div className={`${styles.modalRoot} ${selected ? styles.modalOpen : ""}`} aria-hidden={!selected}>
        <div onClick={() => setSelectedId(null)} className={styles.backdrop} />
        <section role="dialog" aria-modal="true" className={styles.modal}>
          <button type="button" onClick={() => setSelectedId(null)} className={styles.close} aria-label="Close article">
            <X className={styles.closeIcon} />
          </button>

          {selected ? (
            <article className={styles.modalArticle}>
              <p className={styles.modalCredit}>{selected.credit}</p>
              <h2 className={styles.modalTitle}>{selected.title}</h2>
              <p className={styles.modalSubtitle}>{selected.subtitle}</p>
              <div className={styles.modalBody}>
                {selected.body.map((paragraph, idx) => (
                  <p key={`${selected.id}-p-${idx}`} className={styles.modalParagraph}>
                    {paragraph}
                  </p>
                ))}
              </div>
              {selected.author ? <p className={styles.modalAuthor}>{selected.author}</p> : null}
            </article>
          ) : null}
        </section>
      </div>
    </main>
  );
}
