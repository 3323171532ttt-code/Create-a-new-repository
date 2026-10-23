import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession, getBoardWithItems } from "../../actions";
import { AuthNav } from "../../components/AuthNav";
import { BoardControls } from "../../components/BoardControls";
import { ItemCard } from "../../components/ItemCard";
import { AddItemModal } from "../../components/AddItemModal";
import styles from "../../styles.module.css";

export const dynamic = "force-dynamic";

interface BoardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BoardDetailPage({ params }: BoardPageProps) {
  const { id: boardId } = await params;

  // Retrieve authenticated session on the server
  const session = await getServerSession();
  const currentUserId = session?.user?.id;

  // Fetch board and items verifying ownership and public access rules
  const data = await getBoardWithItems(boardId, currentUserId);

  // If board does not exist OR if board is private and caller is not owner -> 404
  if (!data) {
    notFound();
  }

  const { board, items, isOwner } = data;

  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name || session.user.email,
        email: session.user.email,
      }
    : null;

  return (
    <div className={styles.container}>
      {/* Top Navigation */}
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

      {/* Main Board View */}
      <main className={styles.main}>
        {/* Board Header Details */}
        <div className={styles.boardHeader}>
          <div className={styles.boardHeaderTop}>
            <div className={styles.boardHeaderInfo}>
              <Link href="/prototypes/inspiration-library" className={styles.boardBreadcrumb}>
                ← Back to all boards
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h1 className={styles.boardHeaderTitle}>{board.title}</h1>
                <span
                  className={`${styles.boardPrivacyBadge} ${
                    board.is_public ? styles.badgePublic : styles.badgePrivate
                  }`}
                >
                  {board.is_public ? "Public Board" : "Private Board"}
                </span>
              </div>
              {board.description && (
                <p className={styles.boardHeaderDesc}>{board.description}</p>
              )}
            </div>

            {/* Owner controls: Privacy toggle, Add item, Delete board */}
            {isOwner && (
              <BoardControls boardId={board.id} isPublic={board.is_public} />
            )}
          </div>
        </div>

        {/* Masonry Items Grid */}
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🖼️</div>
            <h3 className={styles.emptyTitle}>This board is empty</h3>
            <p className={styles.emptyText}>
              {isOwner
                ? "Start collecting visual references, typography, links, and imagery."
                : "The curator hasn't added any items to this board yet."}
            </p>
            {isOwner && <AddItemModal boardId={board.id} />}
          </div>
        ) : (
          <div className={styles.masonryGrid}>
            {items.map((item) => (
              <ItemCard key={item.id} item={item} isOwner={isOwner} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
