"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import styles from "./styles.module.css";
import { CATEGORIES, SHELF_ITEMS, Category, ShelfItem } from "./data";

export default function MinimalistBookshelf() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [selectedItem, setSelectedItem] = useState<ShelfItem | null>(null);

  // Filter items according to the active category
  const displayedItems: ShelfItem[] = useMemo(() => {
    if (activeCategory === "All") {
      return SHELF_ITEMS;
    }
    if (activeCategory === "Pinned") {
      const pinned = SHELF_ITEMS.filter((item) => item.isPinned);
      const skel: ShelfItem = {
        id: "skel-pinned",
        isSkeleton: true,
        title: "Reserved Slot",
        creator: "",
        category: "Design",
      };
      return [...pinned, skel];
    }
    // Specific category (e.g., Books, Music, Movies, etc.)
    const categoryMatches = SHELF_ITEMS.filter(
      (item) => !item.isSkeleton && item.category === activeCategory
    );
    const skel: ShelfItem = {
      id: `skel-${activeCategory.toLowerCase()}`,
      isSkeleton: true,
      title: "Reserved Slot",
      creator: "",
      category: activeCategory as Exclude<Category, "All" | "Pinned">,
    };
    return [...categoryMatches, skel];
  }, [activeCategory]);

  const realItemCount = useMemo(() => {
    return displayedItems.filter((i) => !i.isSkeleton).length;
  }, [displayedItems]);

  return (
    <div className={styles.pageWrapper}>
      {/* Top Breadcrumb Bar */}
      <div className={styles.topBar}>
        <Link href="/" className={styles.backLink}>
          <span>←</span>
          <span>Workshop Prototypes</span>
        </Link>
        <span className={styles.headerMeta}>
          CURATED ARCHIVE &bull; {realItemCount} {realItemCount === 1 ? "OBJECT" : "OBJECTS"}
        </span>
      </div>

      {/* Main Centered White Card Container */}
      <main className={styles.cardContainer}>
        {/* Top Centered Category Filter Bar */}
        <nav className={styles.filterBar} aria-label="Category Filter">
          {CATEGORIES.map((category, index) => {
            const isActive = activeCategory === category;
            const isLast = index === CATEGORIES.length - 1;

            return (
              <span key={category} className={styles.filterItemWrapper}>
                <button
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`${styles.filterButton} ${isActive ? styles.filterButtonActive : ""}`}
                >
                  {category}
                </button>
                {!isLast && <span className={styles.filterSeparator}>,</span>}
              </span>
            );
          })}
        </nav>

        {/* 6-Column Main Gallery Grid */}
        <section className={styles.grid}>
          {displayedItems.map((item) => {
            // Skeleton Placeholder Block
            if (item.isSkeleton) {
              return (
                <div
                  key={item.id}
                  className={styles.skeletonCard}
                  title="Curator's Reserved Shelf Space"
                >
                  <span className={styles.skeletonPlus}>+</span>
                </div>
              );
            }

            // Real Media Item Card
            return (
              <button
                key={item.id}
                type="button"
                className={styles.itemCard}
                onClick={() => setSelectedItem(item)}
                title={`${item.title} — ${item.creator}`}
              >
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className={styles.coverImage}
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={styles.coverFallback}
                    style={{ backgroundColor: item.accentColor || "#E8E8E8" }}
                  >
                    <p className={styles.fallbackTitle}>{item.title}</p>
                    <p className={styles.fallbackCreator}>{item.creator}</p>
                  </div>
                )}

                {/* Subtle Hover Gradient & Information */}
                <div className={styles.cardOverlay}>
                  <span className={styles.overlayText}>{item.title}</span>
                </div>

                {/* Subtle indicator for Pinned / Staff Pick items */}
                {item.isPinned && (
                  <span
                    className={styles.pinnedIndicator}
                    title="Pinned Favorite"
                  />
                )}
              </button>
            );
          })}
        </section>

        {/* Minimalist Shelf Summary Footer */}
        <footer className={styles.shelfFooter}>
          <div className={styles.footerLeft}>
            <span>
              Category: <strong className={styles.footerCounter}>{activeCategory}</strong>
            </span>
            <span>
              Showing: <strong className={styles.footerCounter}>{realItemCount} items</strong>
            </span>
          </div>
          <div>
            <span>Format: 2:3 Cover Standard &bull; 6-Col Grid</span>
          </div>
        </footer>
      </main>

      {/* Detail Inspection Modal Dialog */}
      {selectedItem && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setSelectedItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Cover Image */}
            <div className={styles.modalCoverSection}>
              {selectedItem.coverImage ? (
                <img
                  src={selectedItem.coverImage}
                  alt={selectedItem.title}
                  className={styles.modalCoverImg}
                />
              ) : (
                <div
                  className={styles.coverFallback}
                  style={{ backgroundColor: selectedItem.accentColor || "#E8E8E8" }}
                >
                  <p className={styles.fallbackTitle}>{selectedItem.title}</p>
                  <p className={styles.fallbackCreator}>{selectedItem.creator}</p>
                </div>
              )}
            </div>

            {/* Modal Metadata & Narrative */}
            <div className={styles.modalInfoSection}>
              <div>
                <span className={styles.modalTag}>
                  {selectedItem.category} {selectedItem.year && `• ${selectedItem.year}`}
                </span>
                <h2 className={styles.modalTitle}>{selectedItem.title}</h2>
                <p className={styles.modalCreator}>{selectedItem.creator}</p>
                {selectedItem.description && (
                  <p className={styles.modalDescription}>
                    {selectedItem.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSelectedItem(null)}
              >
                Close Object
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}