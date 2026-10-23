import Link from "next/link";
import { isDatabaseConfigured } from "@/lib/db";
import { getServerSession, getUserBoards } from "./actions";
import { AuthNav } from "./components/AuthNav";
import { NewBoardModal } from "./components/NewBoardModal";
import { DbNoticeBanner } from "./components/DbNoticeBanner";
import styles from "./styles.module.css";

export const dynamic = "force-dynamic";

export default async function InspirationLibraryHome() {
  const isDbReady = isDatabaseConfigured();
  const session = await getServerSession();

  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name || session.user.email,
        email: session.user.email,
      }
    : null;

  // Server-side fetch of boards owned by the authenticated user
  const boards = user ? await getUserBoards(user.id) : [];

  return (
    <div className={styles.container}>
      {/* Top Header Bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <Link href="/prototypes/inspiration-library" className={styles.brandGroup}>
            <div className={styles.brandLogo}>★</div>
            <div>
              <span className={styles.brandName}>Inspiration library</span>
              <span className={styles.brandSubtitle}>archive</span>
            </div>
          </Link>

          <AuthNav user={user} />
        </div>
      </header>

      {/* Helpful banner if DATABASE_URL is not yet filled in */}
      {!isDbReady && <DbNoticeBanner />}

      {/* Main Content Area */}
      <main className={styles.main}>
        {user ? (
          /* =============================================================== */
          /* Signed In View: User's Boards Grid                              */
          /* =============================================================== */
          <div>
            <div className={styles.sectionHeader}>
              <div>
                <h1 className={styles.sectionTitle}>Your Boards</h1>
                <p className={styles.sectionSubtitle}>
                  Curated visual archives and bookmarks for {user.name}
                </p>
              </div>

              {isDbReady && <NewBoardModal />}
            </div>

            {boards.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📁</div>
                <h3 className={styles.emptyTitle}>No boards yet</h3>
                <p className={styles.emptyText}>
                  Create your first board to start collecting images, typography, and web bookmarks.
                </p>
                {isDbReady && <NewBoardModal />}
              </div>
            ) : (
              <div className={styles.boardsGrid}>
                {boards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/prototypes/inspiration-library/board/${board.id}`}
                    className={styles.boardCard}
                  >
                    <div>
                      <div className={styles.boardCardTop}>
                        <h3 className={styles.boardTitle}>{board.title}</h3>
                        <span
                          className={`${styles.boardPrivacyBadge} ${
                            board.is_public ? styles.badgePublic : styles.badgePrivate
                          }`}
                        >
                          {board.is_public ? "Public" : "Private"}
                        </span>
                      </div>

                      {board.description && (
                        <p className={styles.boardDesc}>{board.description}</p>
                      )}
                    </div>

                    <div className={styles.boardCardFooter}>
                      <span className={styles.boardCount}>
                        {board.item_count || 0} {board.item_count === 1 ? "item" : "items"}
                      </span>
                      <span>
                        Created {new Date(board.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* =============================================================== */
          /* Signed Out View: Landing Hero & Information                    */
          /* =============================================================== */
          <div>
            <div className={styles.landingHero}>
              <span className={styles.landingPill}>Personal Visual Index</span>
              <h1 className={styles.landingTitle}>
                Save images and links into curated inspiration boards.
              </h1>
              <p className={styles.landingSubtitle}>
                A private, distraction-free moodboard space inspired by Are.na and Pinterest.
                Organize typography, architecture, UI patterns, and design references with
                instant masonry previews.
              </p>

              <div className={styles.landingActions}>
                <Link
                  href="/prototypes/inspiration-library/sign-up"
                  className={`${styles.navButton} ${styles.navButtonPrimary}`}
                  style={{ padding: "10px 22px", fontSize: "15px" }}
                >
                  Create free archive
                </Link>
                <Link
                  href="/prototypes/inspiration-library/sign-in"
                  className={`${styles.navButton} ${styles.navButtonOutline}`}
                  style={{ padding: "10px 22px", fontSize: "15px" }}
                >
                  Sign in
                </Link>
              </div>
            </div>

            <div className={styles.landingFeatureGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🔒</div>
                <h3 className={styles.featureCardTitle}>Private by default</h3>
                <p className={styles.featureCardText}>
                  Your boards stay strictly private to your account. Switch any board to public
                  whenever you want to share a direct link with peers or collaborators.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🧱</div>
                <h3 className={styles.featureCardTitle}>Dynamic masonry layout</h3>
                <p className={styles.featureCardText}>
                  Paste any direct image URL with external reference links and personal design
                  notes. Items automatically fit in an editorial grid.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>⚡</div>
                <h3 className={styles.featureCardTitle}>Better Auth + Postgres</h3>
                <p className={styles.featureCardText}>
                  Powered by modern Better Auth credential authentication connected to Supabase
                  PostgreSQL with strict server-side session authorization.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}