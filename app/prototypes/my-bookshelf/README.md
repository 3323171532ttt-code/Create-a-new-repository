# My Bookshelf — Notion Reading Tracker

An interactive, responsive reading tracker prototype built for the **"Prototyping for Masters"** workshop. It turns any Notion database of books into a tactile digital bookshelf and gallery, powered by the latest **Notion API (version `2026-03-11`)**.

---

## Key Features

1. **Live Notion API Integration (`2026-03-11`)**:
   - Uses the official `@notionhq/client` SDK (v5.27.0+) with `notionVersion: "2026-03-11"`.
   - Implements the modern Notion **Data Sources** architecture where databases act as parent containers and data sources parent the pages.
   - Automatically resolves database IDs or data source IDs, with fallback resilience.
   - Server-side Next.js route handler (`/prototypes/my-bookshelf/api`) keeps your secret integration token secure.

2. **Full Property Support**:
   - 📖 **Title**: Notion `title` property.
   - ✍️ **Author**: Notion `rich_text`, `select`, `multi_select`, or `people` property.
   - 🏷️ **Genre (Single Select)**: Notion `select` property, automatically formatted with matching Notion tag colors.
   - 🖼️ **Cover Image**: Notion `files` property ("Cover Image", "Cover"), external URL property, or native Notion page cover. Includes procedural fallback styling when no image is uploaded.
   - ⭐ **Rating (Number)**: Notion `number` property, rendered as a 5-star graphical meter and score.
   - 📝 **Review**: Notion `rich_text` property, displaying the reader's personal summary and notes.

3. **Multiple Viewing Modes**:
   - **Gallery Grid View**: Beautiful 2:3 aspect ratio book covers with spine shadows, hover elevation, and review snippets.
   - **Tactile Bookshelf Mode**: Categorized books grouped by genre standing upright on wooden library shelves.
   - **Table View**: Compact spreadsheet-style view for quickly scanning your library.

4. **Dynamic Discovery**:
   - **Instant Search**: Debounced live search across title, author, genre, and review text.
   - **Genre Pills**: Filter chips dynamically generated from the genres present in your database.
   - **Rating Filter**: Quick filter by 5 Stars, 4+ Stars, or 3+ Stars.
   - **Sorting**: Sort by Highest Rating, Lowest Rating, Title (A-Z), Author (A-Z), or Recently Added.

5. **In-App Notion Connect Drawer**:
   - Connect your own Notion database right from the UI without editing code.
   - Test connections with live feedback and helpful troubleshooting tips.
   - Seamless fallback to a curated demo library if no Notion credentials are supplied.

6. **Educational Inspector**:
   - Click any book to open the detail modal and toggle **"Inspect Raw Notion Properties"** to see how Notion's raw JSON response maps directly into React components.

---

## Setting Up Your Notion Database

Follow these 4 simple steps to connect your Notion database:

### Step 1: Create an Internal Integration
1. Go to [notion.so/profile/integrations](https://www.notion.so/profile/integrations).
2. Click **+ New integration**.
3. Name it (e.g., `My Bookshelf Workshop`), select your workspace, and click **Save**.
4. Copy the **Internal Integration Secret** (`ntn_...` or `secret_...`).

### Step 2: Share Your Database with the Integration
1. Open your reading tracker database in Notion.
2. Click the `•••` icon in the top right corner.
3. Scroll down and click **Connections** (or **Add connections**).
4. Select the integration you created in Step 1 and confirm access.

### Step 3: Verify Your Database Properties
Make sure your Notion database includes the following properties (names are case-insensitive):

| Property Name | Notion Property Type | Example Value |
|---|---|---|
| **Title** | `Title` | *The Design of Everyday Things* |
| **Author** | `Text` (`rich_text`) or `Select` | *Don Norman* |
| **Genre** | `Select` (Single select) | *Design* |
| **Cover Image** | `Files & media` or page cover | Upload image or image URL |
| **Rating** | `Number` | `5` or `4.5` |
| **Review** | `Text` (`rich_text`) | Personal thoughts and notes |

### Step 4: Connect to the Prototype
You have two easy ways to supply your credentials:

#### Option A: In the Prototype UI (Recommended for Testing)
1. Open the prototype at `/prototypes/my-bookshelf`.
2. Click the **Notion: Demo Library** button in the top navigation bar.
3. Paste your **Notion Secret Token** and your **Database ID or URL**.
4. Click **Save & Connect Notion**.

#### Option B: In `.env.local` (For Permanent Local Development)
Add the following lines to `.env.local` in the root of the project:
```env
NOTION_API_KEY="secret_your_token_here"
NOTION_DATABASE_ID="your_database_id_here"
```
The prototype will automatically detect and query these environment variables on page load!

---

## File Structure

- `page.tsx`: Main interactive React component with Gallery, Bookshelf, and Table views, filters, and modal.
- `styles.module.css`: Scoped CSS Module styling following workshop guidelines (zero bare HTML selectors).
- `sampleData.ts`: Realistic curated library for instant demonstration and offline development.
- `api/route.ts`: Next.js server route communicating with Notion API version `2026-03-11`.
