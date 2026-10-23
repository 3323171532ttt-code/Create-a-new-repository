# Inspiration Library

A personal digital moodboard and bookmarking archive inspired by **Are.na** and **Pinterest**, built for saving visual references, design inspiration, screenshots, and links into curated boards.

---

## Features

- **Authentication via Better Auth**: Email and password sign-up and sign-in with secure server-side session management.
- **Personal Boards**: Create curated boards with custom titles, descriptions, and privacy settings.
- **Masonry Inspiration Grid**: Display inspiration items in an adaptive multi-column grid showing images, linked sources, and personal notes.
- **Granular Ownership & Privacy**:
  - **Private Boards**: Only visible to the board owner. If another user or visitor visits the URL, they see a clean 404 Not Found page.
  - **Public Boards**: Sharable with anyone via direct link (even when signed out), with edit and delete controls hidden.
  - **Server-Enforced Security**: User identities are always verified server-side from active session cookies. Client inputs for `user_id` are never trusted.
  - **Cascading Deletes**: Deleting a board cleanly cleans up all associated items via PostgreSQL foreign keys.

---

## Setup & Supabase PostgreSQL Connection

This prototype connects directly to your **Supabase PostgreSQL** database using the standard `pg` driver (without requiring Supabase Auth or the `@supabase/supabase-js` SDK).

### Step 1: Get your Supabase Connection String

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. In the left navigation, click on **Project Settings** (gear icon) -> **Database**.
3. Under the **Connection string** section, select **URI**.
4. Copy the connection URI (it looks like `postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres` or `postgresql://postgres:[PASSWORD]@db.[ref].supabase.co:5432/postgres`).

### Step 2: Configure `.env.local`

Open `.env.local` in the project root and paste your connection string into `DATABASE_URL`:

```env
BETTER_AUTH_SECRET="<already generated>"
BETTER_AUTH_URL="http://localhost:3000"
DATABASE_URL="your_copied_connection_string_here"
```

> **Note**: Replace `[YOUR-PASSWORD]` with your actual database password. Make sure there are no extra spaces or quotes around the password itself.

### Step 3: Run the Schema Migration

1. In your Supabase dashboard, open the **SQL Editor** from the left menu.
2. Click **New query**.
3. Open [`app/prototypes/inspiration-library/schema.sql`](./schema.sql), copy its entire contents, and paste them into the SQL Editor.
4. Click **Run**.
5. You should see `Success. No rows returned`. All authentication tables (`user`, `session`, `account`, `verification`) and application tables (`boards`, `items`) are now created!

---

## Using the Prototype

1. Start the development server if not already running:
   ```bash
   npm run dev
   ```
2. Navigate to: [http://localhost:3000/prototypes/inspiration-library](http://localhost:3000/prototypes/inspiration-library)
3. **Sign Up**: Click "Sign Up" to create your personal account.
4. **Create a Board**: Click **+ New Board**, choose a title, and decide whether it is public or private.
5. **Collect Items**: Open your board and paste any direct image URL (from Unsplash, Figma, Arena, Wikimedia, etc.) with a source link, title, and note.
