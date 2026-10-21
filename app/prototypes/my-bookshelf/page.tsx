"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import styles from "./styles.module.css";
import { BookItem } from "./api/route";
import { SAMPLE_BOOKS } from "./sampleData";

type ViewMode = "gallery" | "bookshelf" | "table";
type SortOption = "rating-desc" | "rating-asc" | "title-asc" | "author-asc" | "date-desc";

// Helper to map Notion color names to CSS colors
function getGenreBadgeStyle(color?: string) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: "rgba(56, 139, 253, 0.15)", text: "#58a6ff", border: "rgba(56, 139, 253, 0.3)" },
    purple: { bg: "rgba(187, 128, 255, 0.15)", text: "#d2a8ff", border: "rgba(187, 128, 255, 0.3)" },
    green: { bg: "rgba(46, 160, 67, 0.15)", text: "#56d364", border: "rgba(46, 160, 67, 0.3)" },
    orange: { bg: "rgba(240, 136, 62, 0.15)", text: "#ffa657", border: "rgba(240, 136, 62, 0.3)" },
    pink: { bg: "rgba(219, 97, 162, 0.15)", text: "#f778ba", border: "rgba(219, 97, 162, 0.3)" },
    red: { bg: "rgba(248, 81, 73, 0.15)", text: "#ff7b72", border: "rgba(248, 81, 73, 0.3)" },
    yellow: { bg: "rgba(227, 179, 65, 0.15)", text: "#f0b429", border: "rgba(227, 179, 65, 0.3)" },
    gray: { bg: "rgba(139, 148, 158, 0.15)", text: "#8b949e", border: "rgba(139, 148, 158, 0.3)" },
  };

  if (color && colorMap[color.toLowerCase()]) {
    const c = colorMap[color.toLowerCase()];
    return {
      backgroundColor: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
    };
  }

  // Default pleasant teal/blue
  return {
    backgroundColor: "rgba(56, 139, 253, 0.15)",
    color: "#58a6ff",
    border: "1px solid rgba(56, 139, 253, 0.3)",
  };
}

// Render 5-star graphical indicator
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3 && rating - fullStars <= 0.7;
  const totalStars = 5;

  return (
    <div className={styles.starsRow} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: totalStars }).map((_, index) => {
        if (index < fullStars) {
          return <span key={index}>★</span>;
        } else if (index === fullStars && hasHalf) {
          return <span key={index}>★</span>;
        } else {
          return (
            <span key={index} style={{ opacity: 0.25 }}>
              ★
            </span>
          );
        }
      })}
    </div>
  );
}

export default function MyBookshelfPrototype() {
  // Books list & loading state
  const [books, setBooks] = useState<BookItem[]>(SAMPLE_BOOKS);
  const [databaseTitle, setDatabaseTitle] = useState<string>("My Bookshelf");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUsingCustomNotion, setIsUsingCustomNotion] = useState<boolean>(false);

  // Filters & Controls
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [sortOption, setSortOption] = useState<SortOption>("rating-desc");

  // Modals & Panels
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [isConnectOpen, setIsConnectOpen] = useState<boolean>(false);
  const [showRawInspector, setShowRawInspector] = useState<boolean>(false);

  // Connection Form State
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [dbIdInput, setDbIdInput] = useState<string>("");
  const [showToken, setShowToken] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [connectionMessage, setConnectionMessage] = useState<{
    type: "success" | "error";
    text: string;
    details?: string;
  } | null>(null);

  /**
   * Fetch books from the Notion API route
   */
  const fetchNotionBooks = useCallback(
    async (credentials?: { apiKey?: string; databaseId?: string }) => {
      setIsLoading(true);
      setConnectionMessage(null);

      try {
        const res = await fetch("/prototypes/my-bookshelf/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials || {}),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setBooks(data.books || []);
          if (data.databaseTitle) setDatabaseTitle(data.databaseTitle);
          setIsUsingCustomNotion(true);
          setConnectionMessage({
            type: "success",
            text: `Connected! Successfully loaded ${data.count} books from Notion.`,
          });
          return true;
        } else {
          setConnectionMessage({
            type: "error",
            text: data.message || "Failed to load books from Notion.",
            details: data.error,
          });
          return false;
        }
      } catch (err: any) {
        setConnectionMessage({
          type: "error",
          text: err.message || "Network error while connecting to Notion.",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Auto-detect pre-configured server environment variables or stored credentials on mount
   */
  useEffect(() => {
    async function initCheck() {
      // 1. Check if user saved custom credentials in browser storage
      const savedKey = localStorage.getItem("notion_bookshelf_key");
      const savedDb = localStorage.getItem("notion_bookshelf_db");

      if (savedKey && savedDb) {
        setApiKeyInput(savedKey);
        setDbIdInput(savedDb);
        await fetchNotionBooks({ apiKey: savedKey, databaseId: savedDb });
        return;
      }

      // 2. Check if server .env.local has credentials
      try {
        const checkRes = await fetch("/prototypes/my-bookshelf/api");
        const status = await checkRes.json();
        if (status.hasEnvCredentials) {
          await fetchNotionBooks();
        }
      } catch {
        // Fallback to sample data
      }
    }

    initCheck();
  }, [fetchNotionBooks]);

  /**
   * Handle connecting Notion credentials from modal
   */
  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim() || !dbIdInput.trim()) {
      setConnectionMessage({
        type: "error",
        text: "Please provide both your Notion Secret Token and Database ID.",
      });
      return;
    }

    setIsTesting(true);
    const success = await fetchNotionBooks({
      apiKey: apiKeyInput.trim(),
      databaseId: dbIdInput.trim(),
    });
    setIsTesting(false);

    if (success) {
      localStorage.setItem("notion_bookshelf_key", apiKeyInput.trim());
      localStorage.setItem("notion_bookshelf_db", dbIdInput.trim());
      setTimeout(() => {
        setIsConnectOpen(false);
      }, 1200);
    }
  };

  /**
   * Reset to Curated Sample Library
   */
  const handleResetToDemo = () => {
    localStorage.removeItem("notion_bookshelf_key");
    localStorage.removeItem("notion_bookshelf_db");
    setApiKeyInput("");
    setDbIdInput("");
    setBooks(SAMPLE_BOOKS);
    setDatabaseTitle("My Bookshelf");
    setIsUsingCustomNotion(false);
    setConnectionMessage(null);
    setIsConnectOpen(false);
  };

  /**
   * Derive all unique genres dynamically from the active book list
   */
  const uniqueGenres = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.genre) set.add(b.genre);
    });
    return ["All", ...Array.from(set).sort()];
  }, [books]);

  /**
   * Summary Statistics
   */
  const stats = useMemo(() => {
    const total = books.length;
    const avgRating = total > 0 ? (books.reduce((acc, b) => acc + (b.rating || 0), 0) / total).toFixed(1) : "0.0";

    // Most frequent genre
    const genreCounts: Record<string, number> = {};
    books.forEach((b) => {
      if (b.genre) genreCounts[b.genre] = (genreCounts[b.genre] || 0) + 1;
    });
    let topGenre = "None";
    let maxCount = 0;
    Object.entries(genreCounts).forEach(([genre, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topGenre = genre;
      }
    });

    const perfectRatings = books.filter((b) => b.rating >= 4.8).length;

    return { total, avgRating, topGenre, perfectRatings };
  }, [books]);

  /**
   * Filtered & Sorted Book Collection
   */
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        // Genre filter
        if (selectedGenre !== "All" && book.genre !== selectedGenre) {
          return false;
        }

        // Rating filter
        if (ratingFilter > 0 && book.rating < ratingFilter) {
          return false;
        }

        // Text search (Title, Author, Review)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = book.title.toLowerCase().includes(q);
          const matchAuthor = book.author.toLowerCase().includes(q);
          const matchReview = book.review.toLowerCase().includes(q);
          const matchGenre = book.genre.toLowerCase().includes(q);
          return matchTitle || matchAuthor || matchReview || matchGenre;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === "rating-desc") return (b.rating || 0) - (a.rating || 0);
        if (sortOption === "rating-asc") return (a.rating || 0) - (b.rating || 0);
        if (sortOption === "title-asc") return a.title.localeCompare(b.title);
        if (sortOption === "author-asc") return a.author.localeCompare(b.author);
        if (sortOption === "date-desc") {
          const timeA = a.createdTime ? new Date(a.createdTime).getTime() : 0;
          const timeB = b.createdTime ? new Date(b.createdTime).getTime() : 0;
          return timeB - timeA;
        }
        return 0;
      });
  }, [books, selectedGenre, ratingFilter, searchQuery, sortOption]);

  /**
   * Group books by Genre for the tactile Bookshelf view
   */
  const booksByGenre = useMemo(() => {
    const groups: Record<string, BookItem[]> = {};
    filteredBooks.forEach((b) => {
      const g = b.genre || "General";
      if (!groups[g]) groups[g] = [];
      groups[g].push(b);
    });
    return groups;
  }, [filteredBooks]);

  return (
    <div className={styles.container}>
      {/* Top Sticky Navigation */}
      <nav className={styles.topNav}>
        <div className={styles.topNavInner}>
          <Link href="/" className={styles.backLink}>
            ← Workshop Prototypes
          </Link>
          <div className={styles.navActions}>
            <button
              type="button"
              className={styles.connectButton}
              onClick={() => setIsConnectOpen(true)}
              aria-label="Notion Connection Settings"
            >
              <span
                className={isUsingCustomNotion ? styles.connectedStatusDot : styles.demoStatusDot}
              />
              {isUsingCustomNotion ? "Notion Database: Live" : "Notion: Demo Library"}
            </button>
          </div>
        </div>
      </nav>

      <main className={styles.mainContent}>
        {/* Hero Section */}
        <header className={styles.heroSection}>
          <div className={styles.heroHeaderRow}>
            <div className={styles.titleArea}>
              <h1 className={styles.mainTitle}>
                <span>📚</span> {databaseTitle}
              </h1>
              <p className={styles.titleSubtext}>
                Reading log powered by the latest Notion API (version 2026-03-11 Data Sources).
              </p>
            </div>
            <div>
              <span className={styles.notionBadge}>
                <span>⚡</span> Notion API 2026-03-11
              </span>
            </div>
          </div>

          {/* Reading Statistics Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIconBox}>📖</div>
              <div>
                <p className={styles.statLabel}>Books Read</p>
                <p className={styles.statValue}>{stats.total}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconBox}>⭐</div>
              <div>
                <p className={styles.statLabel}>Average Rating</p>
                <p className={styles.statValue}>{stats.avgRating} / 5</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconBox}>🏷️</div>
              <div>
                <p className={styles.statLabel}>Top Genre</p>
                <p className={styles.statValue}>{stats.topGenre}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconBox}>🏆</div>
              <div>
                <p className={styles.statLabel}>5-Star Favorites</p>
                <p className={styles.statValue}>{stats.perfectRatings}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Toolbar: Search, Filters, Sorting, and View Modes */}
        <section className={styles.toolbarCard} aria-label="Bookshelf Controls">
          <div className={styles.toolbarTopRow}>
            {/* Search Input */}
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by title, author, review, or genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Right Controls: Sort & View Mode Switcher */}
            <div className={styles.controlsRight}>
              <select
                className={styles.sortSelect}
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                aria-label="Sort books by"
              >
                <option value="rating-desc">Rating: Highest First</option>
                <option value="rating-asc">Rating: Lowest First</option>
                <option value="title-asc">Title: A to Z</option>
                <option value="author-asc">Author: A to Z</option>
                <option value="date-desc">Recently Added</option>
              </select>

              {/* View Mode Toggle */}
              <div className={styles.viewModeGroup}>
                <button
                  type="button"
                  className={`${styles.viewModeBtn} ${
                    viewMode === "gallery" ? styles.viewModeBtnActive : ""
                  }`}
                  onClick={() => setViewMode("gallery")}
                >
                  <span>🖼️</span> Gallery
                </button>
                <button
                  type="button"
                  className={`${styles.viewModeBtn} ${
                    viewMode === "bookshelf" ? styles.viewModeBtnActive : ""
                  }`}
                  onClick={() => setViewMode("bookshelf")}
                >
                  <span>🪜</span> Bookshelf
                </button>
                <button
                  type="button"
                  className={`${styles.viewModeBtn} ${
                    viewMode === "table" ? styles.viewModeBtnActive : ""
                  }`}
                  onClick={() => setViewMode("table")}
                >
                  <span>📋</span> Table
                </button>
              </div>
            </div>
          </div>

          {/* Genre Filter Pills */}
          <div className={styles.filterPillsRow}>
            {uniqueGenres.map((genre) => (
              <button
                key={genre}
                type="button"
                className={`${styles.genrePill} ${
                  selectedGenre === genre ? styles.genrePillActive : ""
                }`}
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Rating Filter Chips */}
          <div className={styles.ratingFilterRow}>
            <span>Filter Rating:</span>
            <button
              type="button"
              className={`${styles.ratingChip} ${ratingFilter === 0 ? styles.ratingChipActive : ""}`}
              onClick={() => setRatingFilter(0)}
            >
              All Ratings
            </button>
            <button
              type="button"
              className={`${styles.ratingChip} ${ratingFilter === 5 ? styles.ratingChipActive : ""}`}
              onClick={() => setRatingFilter(5)}
            >
              ★ 5 Stars Only
            </button>
            <button
              type="button"
              className={`${styles.ratingChip} ${ratingFilter === 4 ? styles.ratingChipActive : ""}`}
              onClick={() => setRatingFilter(4)}
            >
              ★ 4+ Stars
            </button>
            <button
              type="button"
              className={`${styles.ratingChip} ${ratingFilter === 3 ? styles.ratingChipActive : ""}`}
              onClick={() => setRatingFilter(3)}
            >
              ★ 3+ Stars
            </button>
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className={styles.emptyState}>
            <div className={styles.spinner} style={{ margin: "0 auto 1rem auto" }} />
            <p className={styles.emptyTitle}>Synchronizing with Notion...</p>
            <p className={styles.emptySubtitle}>
              Querying database schema and book pages using Notion API 2026-03-11.
            </p>
          </div>
        )}

        {/* Empty Search / Filter State */}
        {!isLoading && filteredBooks.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h2 className={styles.emptyTitle}>No matching books found</h2>
            <p className={styles.emptySubtitle}>
              Try clearing your search query or selecting a different genre or rating filter.
            </p>
            <button
              type="button"
              className={styles.emptyResetBtn}
              onClick={() => {
                setSearchQuery("");
                setSelectedGenre("All");
                setRatingFilter(0);
              }}
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* View 1: Gallery Grid View (Default) */}
        {!isLoading && viewMode === "gallery" && filteredBooks.length > 0 && (
          <div className={styles.galleryGrid}>
            {filteredBooks.map((book) => (
              <article
                key={book.id}
                className={styles.bookCard}
                onClick={() => {
                  setSelectedBook(book);
                  setShowRawInspector(false);
                }}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedBook(book);
                    setShowRawInspector(false);
                  }
                }}
              >
                {/* 2:3 Aspect Ratio Book Cover */}
                <div className={styles.coverContainer}>
                  {book.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.coverImage}
                      alt={`Cover of ${book.title}`}
                      className={styles.coverImage}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.proceduralCover}>
                      <span className={styles.proceduralIcon}>{book.icon || "📖"}</span>
                      <p className={styles.proceduralTitle}>{book.title}</p>
                      <p className={styles.proceduralAuthor}>{book.author}</p>
                    </div>
                  )}

                  {/* Realistic Book Spine Shadow effect */}
                  <div className={styles.spineShadow} />

                  {/* Floating Rating Pill on top-right */}
                  <div className={styles.cardRatingOverlay}>
                    <span>★</span> {book.rating.toFixed(1)}
                  </div>
                </div>

                {/* Card Body Information */}
                <div className={styles.cardBody}>
                  {/* Genre Single-Select Pill */}
                  <span
                    className={styles.cardGenreTag}
                    style={getGenreBadgeStyle(book.genreColor)}
                  >
                    {book.genre}
                  </span>

                  {/* Book Title */}
                  <h2 className={styles.cardTitle}>{book.title}</h2>

                  {/* Author */}
                  <p className={styles.cardAuthor}>by {book.author}</p>

                  {/* Review Snippet */}
                  {book.review && (
                    <p className={styles.cardReviewSnippet}>&ldquo;{book.review}&rdquo;</p>
                  )}

                  {/* Footer with Star Indicator */}
                  <div className={styles.cardFooter}>
                    <StarRating rating={book.rating} />
                    <span>View details →</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* View 2: Physical Bookshelf Mode */}
        {!isLoading && viewMode === "bookshelf" && filteredBooks.length > 0 && (
          <div className={styles.bookshelfContainer}>
            {Object.entries(booksByGenre).map(([genre, shelfBooks]) => (
              <div key={genre} className={styles.shelfRow}>
                <h2 className={styles.shelfLabel}>
                  {genre} Shelf ({shelfBooks.length})
                </h2>
                <div className={styles.shelfBooksGroup}>
                  {shelfBooks.map((book) => (
                    <div
                      key={book.id}
                      className={styles.shelfBookItem}
                      onClick={() => {
                        setSelectedBook(book);
                        setShowRawInspector(false);
                      }}
                      title={`${book.title} by ${book.author} (★ ${book.rating})`}
                    >
                      {book.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className={styles.coverImage}
                        />
                      ) : (
                        <div className={styles.proceduralCover}>
                          <span style={{ fontSize: "1.5rem" }}>{book.icon || "📖"}</span>
                          <p
                            className={styles.proceduralTitle}
                            style={{ fontSize: "0.8rem" }}
                          >
                            {book.title}
                          </p>
                        </div>
                      )}
                      <div className={styles.spineShadow} />
                    </div>
                  ))}
                </div>
                {/* Wooden Shelf Ledge */}
                <div className={styles.shelfLedge} />
              </div>
            ))}
          </div>
        )}

        {/* View 3: Table / List Mode */}
        {!isLoading && viewMode === "table" && filteredBooks.length > 0 && (
          <div className={styles.tableContainer}>
            <table className={styles.booksTable}>
              <thead>
                <tr>
                  <th className={styles.tableHeaderCell}>Cover</th>
                  <th className={styles.tableHeaderCell}>Title</th>
                  <th className={styles.tableHeaderCell}>Author</th>
                  <th className={styles.tableHeaderCell}>Genre</th>
                  <th className={styles.tableHeaderCell}>Rating</th>
                  <th className={styles.tableHeaderCell}>Review</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr
                    key={book.id}
                    className={styles.tableRow}
                    onClick={() => {
                      setSelectedBook(book);
                      setShowRawInspector(false);
                    }}
                  >
                    <td className={styles.tableCell}>
                      {book.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.coverImage}
                          alt=""
                          className={styles.tableCellCover}
                        />
                      ) : (
                        <span style={{ fontSize: "1.5rem" }}>{book.icon || "📖"}</span>
                      )}
                    </td>
                    <td className={styles.tableCell} style={{ fontWeight: 600 }}>
                      {book.title}
                    </td>
                    <td className={styles.tableCell}>{book.author}</td>
                    <td className={styles.tableCell}>
                      <span
                        className={styles.cardGenreTag}
                        style={getGenreBadgeStyle(book.genreColor)}
                      >
                        {book.genre}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ color: "#f0b429", fontWeight: 700 }}>
                          ★ {book.rating}
                        </span>
                      </div>
                    </td>
                    <td
                      className={styles.tableCell}
                      style={{
                        maxWidth: 320,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "#8b949e",
                      }}
                    >
                      {book.review || "No review written yet"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Book Detail Modal */}
      {selectedBook && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setSelectedBook(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setSelectedBook(null)}
              aria-label="Close dialog"
            >
              ✕
            </button>

            <div className={styles.modalInner}>
              {/* Left Column: Book Cover & Notion Action */}
              <div className={styles.modalCoverWrapper}>
                {selectedBook.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedBook.coverImage}
                    alt={selectedBook.title}
                    className={styles.modalCoverImg}
                  />
                ) : (
                  <div
                    className={styles.proceduralCover}
                    style={{ aspectRatio: "2/3", borderRadius: 12 }}
                  >
                    <span style={{ fontSize: "3rem" }}>{selectedBook.icon || "📖"}</span>
                    <p className={styles.proceduralTitle}>{selectedBook.title}</p>
                    <p className={styles.proceduralAuthor}>{selectedBook.author}</p>
                  </div>
                )}

                {selectedBook.notionUrl && (
                  <a
                    href={selectedBook.notionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.modalNotionLink}
                  >
                    <span>↗</span> Open in Notion
                  </a>
                )}
              </div>

              {/* Right Column: Properties Details */}
              <div className={styles.modalDetails}>
                <div>
                  <div className={styles.modalHeaderRow}>
                    <span
                      className={styles.cardGenreTag}
                      style={getGenreBadgeStyle(selectedBook.genreColor)}
                    >
                      {selectedBook.genre}
                    </span>
                  </div>
                  <h2 className={styles.modalBookTitle}>{selectedBook.title}</h2>
                  <p className={styles.modalBookAuthor}>by {selectedBook.author}</p>
                </div>

                {/* Rating Card */}
                <div className={styles.modalRatingSection}>
                  <div className={styles.modalRatingScore}>
                    ★ {selectedBook.rating.toFixed(1)} / 5.0
                  </div>
                  <StarRating rating={selectedBook.rating} />
                </div>

                {/* Review Section */}
                <div>
                  <h3 className={styles.modalReviewHeading}>Personal Review</h3>
                  <p className={styles.modalReviewText}>
                    {selectedBook.review
                      ? selectedBook.review
                      : "No written review recorded in Notion for this book yet."}
                  </p>
                </div>

                {/* Raw Notion Properties Inspector for Learning */}
                {selectedBook.rawProperties && (
                  <div>
                    <button
                      type="button"
                      className={styles.inspectorToggleBtn}
                      onClick={() => setShowRawInspector(!showRawInspector)}
                    >
                      {showRawInspector ? "Hide Raw Notion JSON" : "Inspect Raw Notion Properties"}
                    </button>
                    {showRawInspector && (
                      <pre className={styles.rawInspectorBlock}>
                        {JSON.stringify(selectedBook.rawProperties, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notion Connection Settings Modal */}
      {isConnectOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsConnectOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.connectDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setIsConnectOpen(false)}
              aria-label="Close dialog"
            >
              ✕
            </button>

            <h2 className={styles.connectHeading}>
              <span>⚡</span> Connect Your Notion Database
            </h2>
            <p className={styles.connectSubhead}>
              Link your live Notion reading tracker using Notion API 2026-03-11.
            </p>

            {connectionMessage && (
              <div
                className={
                  connectionMessage.type === "success"
                    ? styles.connectionBannerSuccess
                    : styles.connectionBannerError
                }
              >
                <strong>{connectionMessage.text}</strong>
                {connectionMessage.details && <span>{connectionMessage.details}</span>}
              </div>
            )}

            <form onSubmit={handleConnectSubmit} className={styles.connectForm}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel} htmlFor="notion-token">
                  Notion Integration Secret
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="notion-token"
                    type={showToken ? "text" : "password"}
                    className={styles.fieldInput}
                    style={{ width: "100%", boxSizing: "border-box" }}
                    placeholder="secret_... or ntn_..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                  />
                  <button
                    type="button"
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#8b949e",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? "Hide" : "Show"}
                  </button>
                </div>
                <span className={styles.fieldHelper}>
                  Created in your Notion workspace at notion.so/profile/integrations
                </span>
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel} htmlFor="notion-db-id">
                  Database ID or URL
                </label>
                <input
                  id="notion-db-id"
                  type="text"
                  className={styles.fieldInput}
                  placeholder="Paste database URL or 32-character ID"
                  value={dbIdInput}
                  onChange={(e) => setDbIdInput(e.target.value)}
                />
                <span className={styles.fieldHelper}>
                  Copy link to your Notion database view or copy the 32-character ID.
                </span>
              </div>

              <div className={styles.connectActions}>
                <button
                  type="submit"
                  className={styles.primarySubmitBtn}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <>
                      <span className={styles.spinner} /> Connecting...
                    </>
                  ) : (
                    "Save & Connect Notion"
                  )}
                </button>
                <button
                  type="button"
                  className={styles.resetDemoBtn}
                  onClick={handleResetToDemo}
                >
                  Use Demo Library
                </button>
              </div>
            </form>

            {/* Beginner Guide Accordion */}
            <div className={styles.guideAccordion}>
              <h3 className={styles.guideTitle}>📖 How to prepare your Notion database</h3>
              <ol className={styles.guideList}>
                <li className={styles.guideListItem}>
                  Create an integration at <strong>notion.so/profile/integrations</strong> and copy the Internal Secret.
                </li>
                <li className={styles.guideListItem}>
                  Open your Notion Reading Tracker database, click <strong>•••</strong> (top right) → <strong>Add connections</strong> → select your integration.
                </li>
                <li className={styles.guideListItem}>
                  Ensure your database has properties: <strong>Title</strong> (Title), <strong>Author</strong> (Text), <strong>Genre</strong> (Single select), <strong>Cover Image</strong> (Files & media or page cover), <strong>Rating</strong> (Number), and <strong>Review</strong> (Text).
                </li>
                <li className={styles.guideListItem}>
                  Copy the link to the database and paste it into the field above!
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
