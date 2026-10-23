-- Boards table
CREATE TABLE IF NOT EXISTS "boards" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "is_public" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Items table
CREATE TABLE IF NOT EXISTS "items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "board_id" UUID NOT NULL REFERENCES "boards"("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "image_url" TEXT NOT NULL,
  "link_url" TEXT,
  "title" TEXT NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS "boards_user_id_idx" ON "boards" ("user_id");
CREATE INDEX IF NOT EXISTS "items_board_id_idx" ON "items" ("board_id");
CREATE INDEX IF NOT EXISTS "items_user_id_idx" ON "items" ("user_id");
