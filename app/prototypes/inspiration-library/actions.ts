"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { pool, isDatabaseConfigured } from "@/lib/db";
import type { Board, Item } from "./types";

/**
 * Validates the caller's session on the server.
 * Never trusts any client-provided user id.
 */
export async function getServerSession() {
  if (!isDatabaseConfigured()) {
    return null;
  }
  try {
    const reqHeaders = await headers();
    return await auth.api.getSession({
      headers: reqHeaders,
    });
  } catch (error) {
    console.error("Error retrieving server session:", error);
    return null;
  }
}

/**
 * Fetches all boards owned by the authenticated user.
 */
export async function getUserBoards(userId: string): Promise<Board[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const result = await pool.query<Board & { item_count: string | number }>(
    `SELECT b.id, b.user_id, b.title, b.description, b.is_public, b.created_at,
            COUNT(i.id)::int AS item_count
     FROM boards b
     LEFT JOIN items i ON i.board_id = b.id
     WHERE b.user_id = $1
     GROUP BY b.id
     ORDER BY b.created_at DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    ...row,
    item_count: Number(row.item_count) || 0,
  }));
}

/**
 * Fetches a board and its items, verifying privacy & ownership rules:
 * - If board doesn't exist -> null
 * - If board is private and user is not owner -> null
 * - If board is public -> anyone can view
 */
export async function getBoardWithItems(
  boardId: string,
  currentUserId?: string
): Promise<{ board: Board; items: Item[]; isOwner: boolean } | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const boardResult = await pool.query<Board>(
    `SELECT id, user_id, title, description, is_public, created_at
     FROM boards
     WHERE id = $1`,
    [boardId]
  );

  if (boardResult.rows.length === 0) {
    return null;
  }

  const board = boardResult.rows[0];
  const isOwner = Boolean(currentUserId && board.user_id === currentUserId);

  // Private boards are only visible to their owner
  if (!board.is_public && !isOwner) {
    return null;
  }

  const itemsResult = await pool.query<Item>(
    `SELECT id, board_id, user_id, image_url, link_url, title, note, created_at
     FROM items
     WHERE board_id = $1
     ORDER BY created_at DESC`,
    [boardId]
  );

  return {
    board,
    items: itemsResult.rows,
    isOwner,
  };
}

/**
 * Server action: Create a new board for the authenticated user.
 */
export async function createBoardAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    return { success: false, error: "Database not configured yet in .env.local" };
  }

  const session = await getServerSession();
  if (!session?.user) {
    return { success: false, error: "You must be signed in to create a board." };
  }

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const isPublic = formData.get("is_public") === "true" || formData.get("is_public") === "on";

  if (!title) {
    return { success: false, error: "Board title is required." };
  }

  try {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO boards (user_id, title, description, is_public)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [session.user.id, title, description, isPublic]
    );

    revalidatePath("/prototypes/inspiration-library");
    return { success: true, boardId: result.rows[0].id };
  } catch (error) {
    console.error("Error creating board:", error);
    return { success: false, error: "Failed to create board in database." };
  }
}

/**
 * Server action: Delete a board (only if caller is the verified owner).
 */
export async function deleteBoardAction(boardId: string) {
  if (!isDatabaseConfigured()) {
    return { success: false, error: "Database not configured yet in .env.local" };
  }

  const session = await getServerSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized: Sign in required." };
  }

  try {
    const result = await pool.query(
      `DELETE FROM boards
       WHERE id = $1 AND user_id = $2`,
      [boardId, session.user.id]
    );

    if (result.rowCount === 0) {
      return { success: false, error: "Board not found or you are not the owner." };
    }

    revalidatePath("/prototypes/inspiration-library");
    return { success: true };
  } catch (error) {
    console.error("Error deleting board:", error);
    return { success: false, error: "Failed to delete board." };
  }
}

/**
 * Server action: Toggle board privacy between public and private.
 */
export async function toggleBoardPrivacyAction(boardId: string, isPublic: boolean) {
  if (!isDatabaseConfigured()) {
    return { success: false, error: "Database not configured yet in .env.local" };
  }

  const session = await getServerSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized: Sign in required." };
  }

  try {
    const result = await pool.query(
      `UPDATE boards
       SET is_public = $1
       WHERE id = $2 AND user_id = $3`,
      [isPublic, boardId, session.user.id]
    );

    if (result.rowCount === 0) {
      return { success: false, error: "Board not found or unauthorized." };
    }

    revalidatePath(`/prototypes/inspiration-library/board/${boardId}`);
    revalidatePath("/prototypes/inspiration-library");
    return { success: true };
  } catch (error) {
    console.error("Error updating board privacy:", error);
    return { success: false, error: "Failed to update board privacy." };
  }
}

/**
 * Server action: Add an inspiration item to a board.
 * Verifies that the authenticated user owns the target board.
 */
export async function createItemAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    return { success: false, error: "Database not configured yet in .env.local" };
  }

  const session = await getServerSession();
  if (!session?.user) {
    return { success: false, error: "You must be signed in to add items." };
  }

  const boardId = (formData.get("board_id") as string)?.trim();
  const imageUrl = (formData.get("image_url") as string)?.trim();
  const linkUrl = (formData.get("link_url") as string)?.trim() || null;
  const title = (formData.get("title") as string)?.trim();
  const note = (formData.get("note") as string)?.trim() || null;

  if (!boardId || !imageUrl || !title) {
    return { success: false, error: "Title, image URL, and board ID are required." };
  }

  try {
    // Verify user owns the board before inserting item
    const checkOwner = await pool.query(
      `SELECT id FROM boards WHERE id = $1 AND user_id = $2`,
      [boardId, session.user.id]
    );

    if (checkOwner.rows.length === 0) {
      return { success: false, error: "Unauthorized: You do not own this board." };
    }

    await pool.query(
      `INSERT INTO items (board_id, user_id, image_url, link_url, title, note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [boardId, session.user.id, imageUrl, linkUrl, title, note]
    );

    revalidatePath(`/prototypes/inspiration-library/board/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding item:", error);
    return { success: false, error: "Failed to add item to database." };
  }
}

/**
 * Server action: Delete an inspiration item (only if caller is the verified owner).
 */
export async function deleteItemAction(itemId: string, boardId: string) {
  if (!isDatabaseConfigured()) {
    return { success: false, error: "Database not configured yet in .env.local" };
  }

  const session = await getServerSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized: Sign in required." };
  }

  try {
    const result = await pool.query(
      `DELETE FROM items
       WHERE id = $1 AND user_id = $2`,
      [itemId, session.user.id]
    );

    if (result.rowCount === 0) {
      return { success: false, error: "Item not found or you are not the owner." };
    }

    revalidatePath(`/prototypes/inspiration-library/board/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting item:", error);
    return { success: false, error: "Failed to delete item." };
  }
}
