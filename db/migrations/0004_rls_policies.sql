-- 1. Read policies for public boards and items (allowing public sharing)
CREATE POLICY "Public boards are viewable by everyone" ON "boards"
  FOR SELECT USING ("is_public" = true);

CREATE POLICY "Items of public boards are viewable by everyone" ON "items"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "boards"
      WHERE "boards"."id" = "items"."board_id" AND "boards"."is_public" = true
    )
  );

-- 2. Explicit deny policies for Better Auth internal tables
-- Better Auth interacts with these tables via direct server Postgres connections (pg Pool)
-- which bypass RLS. These policies ensure the PostgREST public Data API denies access.
CREATE POLICY "No direct client access to user" ON "user" FOR ALL USING (false);
CREATE POLICY "No direct client access to session" ON "session" FOR ALL USING (false);
CREATE POLICY "No direct client access to account" ON "account" FOR ALL USING (false);
CREATE POLICY "No direct client access to verification" ON "verification" FOR ALL USING (false);
