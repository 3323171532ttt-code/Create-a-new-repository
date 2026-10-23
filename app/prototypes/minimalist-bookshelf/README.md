# Modern Minimalist Bookshelf - Reading Dashboard

A premium, minimalist reading dashboard and personal library archive built for the **"Prototyping for Masters"** workshop. Featuring a warm ivory aesthetic, structured left sidebar navigation, top search bar, and three horizontal floating shelves (**Currently Reading**, **Next Up**, and **Finished**) with realistic upright standing book displays, subtle shadows, and full interactivity.

---

## Key Features & Design Principles

1. **Warm Ivory Minimalist Canvas**:
   - Palette based on warm stone and ivory cream (`#FAF7F2`).
   - Clean floating shelves with subtle 3D depth, bevel highlights, and soft contact shadows.
   - Upright standing books with spine gradients and drop shadows that mimic real books on a floating wall shelf.

2. **Left Sidebar Navigation**:
   - **Branding**: Monogram badge and editorial title ("Bookshelf.").
   - **Tabs**:
     - **My Library**: The primary 3-shelf reading dashboard.
     - **Home**: Curated highlights, reading essays, and featured books.
     - **Shop**: Independent press recommendations and bookbinding accessories.
     - **News**: Literary dispatches, author reflections, and preservation guides.
   - **2026 Reading Goal**: Live progress bar tracking completed volumes.
   - **User Profile**: Active curator avatar and status indicator.

3. **Three Horizontal Floating Bookshelves**:
   - **Currently Reading**: Active books with dynamic reading progress bars and page numbers.
   - **Next Up**: Queued titles with format badges.
   - **Finished**: Completed library archive with star ratings.
   - **Controls**: Section count badges, "See all" links, and horizontal carousel scroll buttons (`‹` `›`).

4. **Live Search & Category Filters**:
   - Real-time search matching title, author, curator notes, and tags.
   - Category filter chips (*All, Books, Design, Art, Cinema, Music, Photography, Pinned*).
   - "✧ Surprise Me" random discovery button.

5. **Interactive Monograph Dialog**:
   - Click any upright book to view its detailed monograph.
   - Displays cover, title, author, year, curator note, and memorable quote.
   - **Live Shelf Mover**: Instantly move books between *Currently Reading*, *Next Up*, and *Finished*.
   - **Pin Favorites**: Toggle favorite status with instantaneous updates.
   - Keyboard navigation (`Esc` to close, `ArrowLeft` / `ArrowRight` to browse books).

6. **100% Reliable Local Covers**:
   - All 18 reference books use high-resolution local images in `/prototypes/minimalist-bookshelf/covers/`.
   - Automatic typographic fallback ensures zero broken image placeholders.

---

## File Architecture

- [`page.tsx`](./page.tsx): Main interactive React dashboard component.
- [`styles.module.css`](./styles.module.css): Scoped CSS Module styling adhering strictly to `AGENTS.md` rules (no bare HTML element selectors, scoped classes only).
- [`data.ts`](./data.ts): Typed dataset with reading statuses, progress metrics, and curated book metadata.
