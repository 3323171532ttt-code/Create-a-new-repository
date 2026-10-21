# Modern Minimalist Bookshelf & Personal Library

An editorial, minimalist personal collection and bookshelf interface built for the **"Prototyping for Masters"** workshop. Inspired by the quiet, typography-first aesthetic of curated design portfolios (such as Paco Coursey's curated grids and contemporary design studios).

---

## Key Design Principles

1. **Quiet Container & Negative Space**:
   - Page backdrop in soft, light neutral gray (`#F6F6F6`).
   - Centered pure-white card container (`border-radius: 22px`) with soft atmospheric elevation (`box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.05)`).
   - Zero distracting borders or ornamentation: the primary visual color and emphasis comes entirely from the curated book and media cover art.

2. **Editorial Comma-Delimited Navigation**:
   - Filter bar centered at the top of the card container.
   - Tags: **All, Books, Music, Movies, Art, Design, Recipes, Photography, Random, Pinned**.
   - Inactive tags rendered in quiet muted gray (`#AAAAAA`), active tag highlighted in crisp black (`#000000`, font-weight `700`).
   - Clean typographic separation using subtle commas.

3. **6-Column Staggered Grid**:
   - Desktop: strict 6-column CSS Grid (`grid-template-columns: repeat(6, 1fr)`).
   - Standard 2:3 aspect ratio (`aspect-ratio: 2 / 3`) with subtle 6px corner radii.
   - Intersperse real media covers with light-gray skeleton placeholder blocks (`#F1F1F1`) to create an authentic staggered shelf rhythm.

4. **Responsive Scaling**:
   - **Desktop (>1024px)**: 6 columns.
   - **Tablet (640px – 1024px)**: 4 columns.
   - **Mobile (<640px)**: 2 columns with reduced padding and compact typography.

5. **Modal Inspection**:
   - Click any item card to open a balanced two-column modal showing enlarged artwork, category, release year, creator, and notes.

---

## File Architecture

- [`page.tsx`](./page.tsx): Main interactive React component managing active category filters, skeleton rendering, and modal inspection state.
- [`styles.module.css`](./styles.module.css): Scoped CSS Module styling adhering strictly to `AGENTS.md` rules (no bare HTML element selectors).
- [`data.ts`](./data.ts): Typed dataset of curated books, albums, films, and art objects with placeholder slots.

---

## How to Customize

- **Add New Items**: Open [`data.ts`](./data.ts) and add a new entry to `SHELF_ITEMS` with your own title, creator, category, and cover image path.
- **Adjust Columns**: Edit the `.grid` selector in [`styles.module.css`](./styles.module.css) to modify `grid-template-columns` or gap spacing.
- **Change Default Category**: In [`page.tsx`](./page.tsx), adjust `useState<Category>("All")` to `"Books"` or any desired initial tag.
