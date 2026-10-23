"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import styles from "./styles.module.css";
import {
  CATEGORIES,
  SHELF_SECTIONS,
  INITIAL_ITEMS,
  Category,
  ReadingStatus,
  ShelfItem,
} from "./data";

type TabView = "library" | "home" | "shop" | "news";

export default function MinimalistBookshelf() {
  const [activeTab, setActiveTab] = useState<TabView>("library");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<ShelfItem[]>(INITIAL_ITEMS);
  const [selectedItem, setSelectedItem] = useState<ShelfItem | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    return new Set(INITIAL_ITEMS.filter((i) => i.isPinned).map((i) => i.id));
  });
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleImageError = useCallback((id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  }, []);

  const togglePin = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPinnedIds((prev) => {
      const next = new Set(prev);
      const isNowPinned = !next.has(id);
      if (isNowPinned) {
        next.add(id);
        setToastMessage("Added to Pinned Favorites");
      } else {
        next.delete(id);
        setToastMessage("Removed from Pinned Favorites");
      }
      return next;
    });
  }, []);

  const changeReadingStatus = useCallback((itemId: string, newStatus: ReadingStatus) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updated = {
            ...item,
            readingStatus: newStatus,
            progressPercent:
              newStatus === "finished" ? 100 : newStatus === "next-up" ? 0 : (item.progressPercent || 35),
          };
          setSelectedItem(updated);
          return updated;
        }
        return item;
      })
    );
    const statusLabel =
      newStatus === "currently-reading"
        ? "Currently Reading"
        : newStatus === "next-up"
        ? "Next Up"
        : "Finished";
    setToastMessage(`Moved to “${statusLabel}”`);
  }, []);

  const handleRandomDiscovery = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * items.length);
    const picked = items[randomIndex];
    setSelectedItem(picked);
    setToastMessage(`Discovered: “${picked.title}”`);
  }, [items]);

  const scrollShelf = useCallback((shelfId: string, direction: "left" | "right") => {
    const el = scrollRefs.current[shelfId];
    if (el) {
      const amount = direction === "left" ? -340 : 340;
      el.scrollBy({ left: amount, behavior: "smooth" });
    }
  }, []);

  // Filter items according to search and category
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Category filter
    if (activeCategory === "Pinned") {
      result = result.filter((item) => pinnedIds.has(item.id));
    } else if (activeCategory !== "All") {
      result = result.filter((item) => item.category === activeCategory);
    }

    // Search query filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((item) => {
        const inTitle = item.title.toLowerCase().includes(q);
        const inCreator = item.creator.toLowerCase().includes(q);
        const inNote = item.curatorNote?.toLowerCase().includes(q) || false;
        const inTags = item.tags?.some((t) => t.toLowerCase().includes(q)) || false;
        return inTitle || inCreator || inNote || inTags;
      });
    }

    return result;
  }, [items, activeCategory, searchQuery, pinnedIds]);

  // Modal navigation indices
  const currentModalIndex = useMemo(() => {
    if (!selectedItem) return -1;
    return filteredItems.findIndex((i) => i.id === selectedItem.id);
  }, [selectedItem, filteredItems]);

  const goToPrevModalItem = useCallback(() => {
    if (filteredItems.length === 0) return;
    const prevIndex =
      currentModalIndex <= 0 ? filteredItems.length - 1 : currentModalIndex - 1;
    setSelectedItem(filteredItems[prevIndex]);
  }, [filteredItems, currentModalIndex]);

  const goToNextModalItem = useCallback(() => {
    if (filteredItems.length === 0) return;
    const nextIndex =
      currentModalIndex >= filteredItems.length - 1 ? 0 : currentModalIndex + 1;
    setSelectedItem(filteredItems[nextIndex]);
  }, [filteredItems, currentModalIndex]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedItem(null);
      } else if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (selectedItem) {
        if (e.key === "ArrowLeft") {
          goToPrevModalItem();
        } else if (e.key === "ArrowRight") {
          goToNextModalItem();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, goToPrevModalItem, goToNextModalItem]);

  const finishedCount = useMemo(() => {
    return items.filter((i) => i.readingStatus === "finished").length;
  }, [items]);

  return (
    <div className={styles.pageLayout}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toastPill} role="status">
          <span className={styles.toastDot} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= LEFT SIDEBAR ================= */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          {/* Logo Branding */}
          <div className={styles.logoRow}>
            <div className={styles.logoBrand}>
              <div className={styles.logoIconBadge}>B</div>
              <div className={styles.logoTextCol}>
                <h2 className={styles.logoTitle}>Bookshelf.</h2>
                <span className={styles.logoSubtitle}>Curated Archive</span>
              </div>
            </div>
            <Link href="/" className={styles.backHomeLink} title="Back to Workshop Hub">
              Exit
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav aria-label="Sidebar Navigation">
            <ul className={styles.navMenu}>
              <li>
                <button
                  type="button"
                  className={activeTab === "library" ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab("library")}
                >
                  <div className={styles.navLeft}>
                    <span className={styles.navIcon}>📚</span>
                    <span>My Library</span>
                  </div>
                  <span className={styles.navBadge}>{items.length}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={activeTab === "home" ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab("home")}
                >
                  <div className={styles.navLeft}>
                    <span className={styles.navIcon}>✦</span>
                    <span>Home</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={activeTab === "shop" ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab("shop")}
                >
                  <div className={styles.navLeft}>
                    <span className={styles.navIcon}>🛍️</span>
                    <span>Shop</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={activeTab === "news" ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab("news")}
                >
                  <div className={styles.navLeft}>
                    <span className={styles.navIcon}>📰</span>
                    <span>News</span>
                  </div>
                </button>
              </li>
            </ul>
          </nav>

          {/* 2026 Reading Goal Card */}
          <div className={styles.goalCard}>
            <div className={styles.goalCardHeader}>
              <span className={styles.goalCardTitle}>2026 Reading Goal</span>
              <span className={styles.goalCardBadge}>On Track</span>
            </div>
            <div className={styles.goalProgressTrack}>
              <div
                className={styles.goalProgressFill}
                style={{ width: `${Math.min(100, (finishedCount / 25) * 100)}%` }}
              />
            </div>
            <div className={styles.goalCardMeta}>
              <span>
                <strong className={styles.goalStatsStrong}>{finishedCount}</strong> of 25 Books
              </span>
              <span>{Math.round((finishedCount / 25) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Sidebar Bottom Profile */}
        <div className={styles.sidebarBottom}>
          <div className={styles.userProfileCard}>
            <div className={styles.userProfileLeft}>
              <div className={styles.userAvatar}>SH</div>
              <div className={styles.userNameCol}>
                <span className={styles.userName}>Shuotong Huang</span>
                <span className={styles.userRole}>Curator &bull; Member</span>
              </div>
            </div>
            <span className={styles.statusIndicator} title="Active" />
          </div>
        </div>
      </aside>

      {/* ================= MAIN DASHBOARD AREA ================= */}
      <main className={styles.mainContent}>
        {/* Top Header Bar */}
        <div className={styles.dashboardTopBar}>
          {/* Live Search Bar */}
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Search books, authors, or genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search bookshelf"
            />
            {searchQuery ? (
              <button
                type="button"
                className={styles.searchClearButton}
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                ✕
              </button>
            ) : (
              <span className={styles.searchShortcutHint}>/</span>
            )}
          </div>

          {/* Right Top Bar Actions */}
          <div className={styles.topBarRightActions}>
            <button
              type="button"
              className={styles.surpriseButton}
              onClick={handleRandomDiscovery}
              title="Pick a random book from the collection"
            >
              <span className={styles.surpriseIcon}>✧</span>
              <span>Surprise Me</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className={styles.filterChipsRow} role="toolbar" aria-label="Category Filters">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const count =
              cat === "All"
                ? items.length
                : cat === "Pinned"
                ? pinnedIds.size
                : items.filter((i) => i.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                className={isActive ? styles.filterChipActive : styles.filterChip}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === "Pinned" ? "★ Pinned" : cat} ({count})
              </button>
            );
          })}
        </div>

        {/* TAB 1: MY LIBRARY (DEFAULT DASHBOARD VIEW) */}
        {activeTab === "library" && (
          <div>
            {SHELF_SECTIONS.map((section) => {
              const shelfBooks = filteredItems.filter(
                (item) => item.readingStatus === section.id
              );

              return (
                <section key={section.id} className={styles.shelfSection}>
                  {/* Shelf Section Header */}
                  <div className={styles.shelfSectionHeader}>
                    <div className={styles.shelfTitleCol}>
                      <div className={styles.shelfTitleRow}>
                        <h2 className={styles.shelfTitleText}>{section.title}</h2>
                        <span className={styles.shelfBadge}>
                          {shelfBooks.length} {shelfBooks.length === 1 ? "book" : "books"}
                        </span>
                      </div>
                      <p className={styles.shelfSubtitleText}>{section.subtitle}</p>
                    </div>

                    <div className={styles.shelfActionsRow}>
                      <button
                        type="button"
                        className={styles.shelfSeeAllLink}
                        onClick={() => {
                          setToastMessage(`Viewing all ${section.title}`);
                        }}
                      >
                        See all ({shelfBooks.length}) &rarr;
                      </button>

                      <div className={styles.shelfCarouselControls}>
                        <button
                          type="button"
                          className={styles.shelfArrowButton}
                          onClick={() => scrollShelf(section.id, "left")}
                          aria-label="Scroll left"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className={styles.shelfArrowButton}
                          onClick={() => scrollShelf(section.id, "right")}
                          aria-label="Scroll right"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Floating Bookshelf Wrapper */}
                  <div className={styles.floatingShelfContainer}>
                    {shelfBooks.length > 0 ? (
                      <div
                        ref={(el) => {
                          scrollRefs.current[section.id] = el;
                        }}
                        className={styles.booksScrollTrack}
                      >
                        {shelfBooks.map((book) => {
                          const isPinned = pinnedIds.has(book.id);
                          const hasFailed = failedImages[book.id];

                          return (
                            <div
                              key={book.id}
                              className={styles.bookStandCard}
                              onClick={() => setSelectedItem(book)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedItem(book);
                                }
                              }}
                            >
                              {/* Pin Toggle Button */}
                              <button
                                type="button"
                                className={isPinned ? styles.bookPinToggleActive : styles.bookPinToggle}
                                onClick={(e) => togglePin(book.id, e)}
                                title={isPinned ? "Remove from Pinned" : "Add to Pinned"}
                                aria-label="Toggle pin"
                              >
                                {isPinned ? "★" : "☆"}
                              </button>

                              {/* Upright Standing Book Cover Box */}
                              <div className={styles.bookCoverBox}>
                                {book.coverImage && !hasFailed ? (
                                  <img
                                    src={book.coverImage}
                                    alt={book.title}
                                    className={styles.bookCoverImg}
                                    onError={() => handleImageError(book.id)}
                                    loading="lazy"
                                  />
                                ) : (
                                  <div
                                    className={styles.fallbackCoverBox}
                                    style={{
                                      backgroundColor: book.accentColor || "#EAE6DF",
                                    }}
                                  >
                                    <h4 className={styles.fallbackTitle}>{book.title}</h4>
                                    <p className={styles.fallbackAuthor}>{book.creator}</p>
                                  </div>
                                )}

                                {/* Realistic book depth hinge & edge highlights */}
                                <div className={styles.bookSpineHighlight} />
                                <div className={styles.bookPageEdgeGlow} />
                              </div>

                              {/* Physical Floating Shelf Ledge */}
                              <div className={styles.physicalShelfLedge} />

                              {/* Book Details Beneath Shelf Ledge */}
                              <div className={styles.bookCardDetails}>
                                <h3 className={styles.bookCardTitle} title={book.title}>
                                  {book.title}
                                </h3>
                                <p className={styles.bookCardAuthor} title={book.creator}>
                                  {book.creator}
                                </p>

                                {/* Progress bar if Currently Reading */}
                                {section.id === "currently-reading" && (
                                  <div className={styles.bookProgressRow}>
                                    <div className={styles.bookProgressBarTrack}>
                                      <div
                                        className={styles.bookProgressBarFill}
                                        style={{ width: `${book.progressPercent || 50}%` }}
                                      />
                                    </div>
                                    <div className={styles.bookProgressLabel}>
                                      <span>p. {book.currentPage || 120}</span>
                                      <span>{book.progressPercent || 50}%</span>
                                    </div>
                                  </div>
                                )}

                                {/* Star Rating if Finished */}
                                {section.id === "finished" && (
                                  <div className={styles.bookStarRatingRow}>
                                    {"★".repeat(book.rating || 5)}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={styles.emptyShelfBox}>
                        <p>No books currently in this shelf matching your filters.</p>
                        <button
                          type="button"
                          className={styles.emptyShelfResetBtn}
                          onClick={() => {
                            setActiveCategory("All");
                            setSearchQuery("");
                          }}
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* TAB 2: HOME VIEW (READING HIGHLIGHTS & ESSAYS) */}
        {activeTab === "home" && (
          <div className={styles.viewContainer}>
            <div className={styles.viewHeroCard}>
              <div className={styles.viewHeroTextCol}>
                <h1 className={styles.viewHeroTitle}>Curated Literary Sanctuary</h1>
                <p className={styles.viewHeroDesc}>
                  A quiet digital retreat for the devoted bibliophile. Reflect on timeless thoughts, track daily reading contemplation, and curate your physical shelves.
                </p>
                <button
                  type="button"
                  className={styles.viewHeroCta}
                  onClick={() => setActiveTab("library")}
                >
                  <span>Explore My Library</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>

            <div className={styles.viewGrid}>
              <article className={styles.articleCard}>
                <span className={styles.articleDate}>OCTOBER 2026 &bull; ESSAY</span>
                <h3 className={styles.articleTitle}>The Art of Unfinished Books</h3>
                <p className={styles.articleExcerpt}>
                  Why setting aside a book that fails to resonate is not a defeat, but an essential act of reader autonomy.
                </p>
              </article>
              <article className={styles.articleCard}>
                <span className={styles.articleDate}>CURATOR NOTE</span>
                <h3 className={styles.articleTitle}>Tokyo Bookstore Wandering</h3>
                <p className={styles.articleExcerpt}>
                  Exploring Jimbocho’s second-hand art monograph dens and the tactile beauty of Japanese paper bindings.
                </p>
              </article>
              <article className={styles.articleCard}>
                <span className={styles.articleDate}>DESIGN SPOTLIGHT</span>
                <h3 className={styles.articleTitle}>Dieter Rams on Restraint</h3>
                <p className={styles.articleExcerpt}>
                  How the ten principles of functional simplicity translate seamlessly from physical radios to digital archives.
                </p>
              </article>
            </div>
          </div>
        )}

        {/* TAB 3: SHOP VIEW (BOOKSTORE & WISHLIST) */}
        {activeTab === "shop" && (
          <div className={styles.viewContainer}>
            <div className={styles.viewHeroCard}>
              <div className={styles.viewHeroTextCol}>
                <h1 className={styles.viewHeroTitle}>The Reader’s Bookstore</h1>
                <p className={styles.viewHeroDesc}>
                  Discover limited run monographs, independent press editions, and bespoke bookbinding tools sourced globally.
                </p>
                <button
                  type="button"
                  className={styles.viewHeroCta}
                  onClick={() => setToastMessage("Bookstore orders opening soon")}
                >
                  <span>Browse Editions</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>

            <div className={styles.viewGrid}>
              <div className={styles.articleCard}>
                <span className={styles.articleDate}>LIMITED EDITION &bull; $65</span>
                <h3 className={styles.articleTitle}>Swiss Typography Handbook</h3>
                <p className={styles.articleExcerpt}>
                  Clothbound hardcover with two-color letterpress dust jacket. Printed in Basel.
                </p>
              </div>
              <div className={styles.articleCard}>
                <span className={styles.articleDate}>INDIE PRESS &bull; $28</span>
                <h3 className={styles.articleTitle}>The Architecture of Solitude</h3>
                <p className={styles.articleExcerpt}>
                  Reflections on reading nooks, quiet desks, and the space between pages.
                </p>
              </div>
              <div className={styles.articleCard}>
                <span className={styles.articleDate}>ACCESSORY &bull; $34</span>
                <h3 className={styles.articleTitle}>Solid Brass Page Anchor</h3>
                <p className={styles.articleExcerpt}>
                  Hand-milled reading weight designed to hold heavy art monographs open effortlessly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: NEWS VIEW */}
        {activeTab === "news" && (
          <div className={styles.viewContainer}>
            <div className={styles.viewHeroCard}>
              <div className={styles.viewHeroTextCol}>
                <h1 className={styles.viewHeroTitle}>Literary Dispatches</h1>
                <p className={styles.viewHeroDesc}>
                  Seasonal reading guides, author dialogues, and announcements from our central studio archive.
                </p>
              </div>
            </div>

            <div className={styles.viewGrid}>
              <article className={styles.articleCard}>
                <span className={styles.articleDate}>ANNOUNCEMENT &bull; AUTUMN</span>
                <h3 className={styles.articleTitle}>Autumn 2026 Reading List Revealed</h3>
                <p className={styles.articleExcerpt}>
                  Eighteen essential volumes spanning post-modern fiction, culinary anthropology, and graphic architecture.
                </p>
              </article>
              <article className={styles.articleCard}>
                <span className={styles.articleDate}>INTERVIEW</span>
                <h3 className={styles.articleTitle}>In Conversation with Sigrid Nunez</h3>
                <p className={styles.articleExcerpt}>
                  On mourning, companionship, and the unspoken language between writers and animals.
                </p>
              </article>
              <article className={styles.articleCard}>
                <span className={styles.articleDate}>STUDIO ARCHIVE</span>
                <h3 className={styles.articleTitle}>Preserving Mid-Century Paperbacks</h3>
                <p className={styles.articleExcerpt}>
                  A beginner’s guide to archival paper preservation, humidity control, and shelf lighting.
                </p>
              </article>
            </div>
          </div>
        )}
      </main>

      {/* ================= DETAILED MONOGRAPH MODAL ================= */}
      {selectedItem && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setSelectedItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={() => setSelectedItem(null)}
              aria-label="Close dialog"
            >
              ✕
            </button>

            {/* Left Cover Column */}
            <div className={styles.modalCoverCol}>
              <div className={styles.modalCoverWrapper}>
                {selectedItem.coverImage && !failedImages[selectedItem.id] ? (
                  <img
                    src={selectedItem.coverImage}
                    alt={selectedItem.title}
                    className={styles.modalCoverImg}
                    onError={() => handleImageError(selectedItem.id)}
                  />
                ) : (
                  <div
                    className={styles.fallbackCoverBox}
                    style={{
                      backgroundColor: selectedItem.accentColor || "#EAE6DF",
                    }}
                  >
                    <h4 className={styles.fallbackTitle}>{selectedItem.title}</h4>
                    <p className={styles.fallbackAuthor}>{selectedItem.creator}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Information Column */}
            <div className={styles.modalInfoCol}>
              <div>
                <span className={styles.modalCategoryPill}>
                  {selectedItem.category} &bull; {selectedItem.year || "2024"}
                </span>
                <h2 className={styles.modalBookTitle}>{selectedItem.title}</h2>
                <p className={styles.modalBookAuthor}>by {selectedItem.creator}</p>

                {selectedItem.quote && (
                  <blockquote className={styles.modalQuoteBox}>
                    &ldquo;{selectedItem.quote}&rdquo;
                  </blockquote>
                )}

                {selectedItem.curatorNote && (
                  <div className={styles.modalCuratorNote}>
                    <h4 className={styles.modalNoteHeading}>Curator’s Note</h4>
                    <p style={{ margin: 0 }}>{selectedItem.curatorNote}</p>
                  </div>
                )}
              </div>

              {/* Shelf Status Reassignment Controls */}
              <div className={styles.modalShelfControlBox}>
                <span className={styles.modalShelfLabel}>Shelf Location</span>
                <div className={styles.modalShelfButtonsRow}>
                  <button
                    type="button"
                    className={
                      selectedItem.readingStatus === "currently-reading"
                        ? styles.modalShelfButtonActive
                        : styles.modalShelfButton
                    }
                    onClick={() => changeReadingStatus(selectedItem.id, "currently-reading")}
                  >
                    Currently Reading
                  </button>
                  <button
                    type="button"
                    className={
                      selectedItem.readingStatus === "next-up"
                        ? styles.modalShelfButtonActive
                        : styles.modalShelfButton
                    }
                    onClick={() => changeReadingStatus(selectedItem.id, "next-up")}
                  >
                    Next Up
                  </button>
                  <button
                    type="button"
                    className={
                      selectedItem.readingStatus === "finished"
                        ? styles.modalShelfButtonActive
                        : styles.modalShelfButton
                    }
                    onClick={() => changeReadingStatus(selectedItem.id, "finished")}
                  >
                    Finished
                  </button>
                </div>
              </div>

              {/* Modal Footer (Pin + Prev/Next Controls) */}
              <div className={styles.modalFooterActions}>
                <button
                  type="button"
                  className={
                    pinnedIds.has(selectedItem.id)
                      ? styles.modalPinButtonActive
                      : styles.modalPinButton
                  }
                  onClick={() => togglePin(selectedItem.id)}
                >
                  <span>{pinnedIds.has(selectedItem.id) ? "★" : "☆"}</span>
                  <span>
                    {pinnedIds.has(selectedItem.id) ? "Pinned to Favorites" : "Pin Book"}
                  </span>
                </button>

                <div className={styles.modalNavArrows}>
                  <button
                    type="button"
                    className={styles.modalArrowButton}
                    onClick={goToPrevModalItem}
                    title="Previous book (Left arrow key)"
                    aria-label="Previous book"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className={styles.modalArrowButton}
                    onClick={goToNextModalItem}
                    title="Next book (Right arrow key)"
                    aria-label="Next book"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
