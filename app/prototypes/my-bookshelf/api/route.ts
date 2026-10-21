import { NextRequest, NextResponse } from "next/server";
import { Client, isNotionClientError } from "@notionhq/client";

export const runtime = "nodejs";

/**
 * Normalized Book Interface representing the user's reading tracker schema
 */
export interface BookItem {
  id: string;
  title: string;
  author: string;
  genre: string;
  genreColor?: string;
  coverImage: string;
  rating: number; // 0 to 5 (or user scale)
  review: string;
  notionUrl?: string;
  createdTime?: string;
  lastEditedTime?: string;
  icon?: string;
  rawProperties?: Record<string, unknown>;
}

/**
 * Helper to clean and format Notion IDs (UUID with hyphens or 32-char hex)
 */
function cleanNotionId(input: string): string {
  if (!input) return "";
  const match =
    input.match(/([a-f0-9]{32})/i) ||
    input.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (match) {
    const raw = match[1].replace(/-/g, "");
    return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
  }
  return input.trim();
}

/**
 * Extract plain text from Notion Rich Text Array
 */
function extractRichText(richTextArray: Array<{ plain_text?: string }> | undefined): string {
  if (!Array.isArray(richTextArray) || richTextArray.length === 0) return "";
  return richTextArray.map((t) => t.plain_text || "").join("").trim();
}

/**
 * Extract cover image from page properties or page.cover
 */
function extractCover(page: Record<string, any>, properties: Record<string, any>): string {
  // 1. Look for explicit property matching "Cover Image", "Cover", "Image", "Book Cover"
  const coverPropKey = Object.keys(properties).find((k) =>
    /^(cover\s*image|cover|image|book\s*cover)$/i.test(k.trim())
  );

  if (coverPropKey) {
    const prop = properties[coverPropKey];
    if (prop.type === "files" && Array.isArray(prop.files) && prop.files.length > 0) {
      const fileObj = prop.files[0];
      const url = fileObj.file?.url || fileObj.external?.url || "";
      if (url) return url;
    }
    if (prop.type === "url" && prop.url) {
      return prop.url;
    }
    if (prop.type === "rich_text") {
      const text = extractRichText(prop.rich_text);
      if (text.startsWith("http")) return text;
    }
  }

  // 2. Look for page-level cover
  if (page.cover) {
    const url = page.cover.file?.url || page.cover.external?.url;
    if (url) return url;
  }

  return "";
}

/**
 * Normalize Notion page response to BookItem
 */
function parseNotionPage(page: Record<string, any>): BookItem {
  const properties = page.properties || {};

  // 1. Title
  let title = "Untitled Book";
  const titlePropKey = Object.keys(properties).find(
    (k) => properties[k]?.type === "title" || /^(title|name|book\s*title)$/i.test(k.trim())
  );
  if (titlePropKey && properties[titlePropKey]?.title) {
    title = extractRichText(properties[titlePropKey].title) || "Untitled Book";
  }

  // 2. Author
  let author = "Unknown Author";
  const authorPropKey = Object.keys(properties).find((k) =>
    /^(author|authors|writer)$/i.test(k.trim())
  );
  if (authorPropKey) {
    const prop = properties[authorPropKey];
    if (prop.type === "rich_text") {
      author = extractRichText(prop.rich_text) || author;
    } else if (prop.type === "select" && prop.select?.name) {
      author = prop.select.name;
    } else if (prop.type === "multi_select" && Array.isArray(prop.multi_select)) {
      author = prop.multi_select.map((s: any) => s.name).join(", ") || author;
    } else if (prop.type === "people" && Array.isArray(prop.people)) {
      author = prop.people.map((p: any) => p.name).join(", ") || author;
    }
  }

  // 3. Genre (Single select)
  let genre = "General";
  let genreColor: string | undefined;
  const genrePropKey = Object.keys(properties).find((k) =>
    /^(genre|category|genres)$/i.test(k.trim())
  );
  if (genrePropKey) {
    const prop = properties[genrePropKey];
    if (prop.type === "select" && prop.select) {
      genre = prop.select.name || genre;
      genreColor = prop.select.color;
    } else if (prop.type === "multi_select" && prop.multi_select?.[0]) {
      genre = prop.multi_select[0].name || genre;
      genreColor = prop.multi_select[0].color;
    }
  }

  // 4. Cover Image
  const coverImage = extractCover(page, properties);

  // 5. Rating (Number)
  let rating = 0;
  const ratingPropKey = Object.keys(properties).find((k) =>
    /^(rating|score|stars)$/i.test(k.trim())
  );
  if (ratingPropKey) {
    const prop = properties[ratingPropKey];
    if (prop.type === "number" && typeof prop.number === "number") {
      rating = prop.number;
    } else if (prop.type === "select" && prop.select?.name) {
      const numMatch = prop.select.name.match(/\d+(\.\d+)?/);
      if (numMatch) {
        rating = parseFloat(numMatch[0]);
      } else {
        const starCount = (prop.select.name.match(/★/g) || []).length;
        if (starCount > 0) rating = starCount;
      }
    }
  }

  // 6. Review
  let review = "";
  const reviewPropKey = Object.keys(properties).find((k) =>
    /^(review|notes|summary|thoughts)$/i.test(k.trim())
  );
  if (reviewPropKey) {
    const prop = properties[reviewPropKey];
    if (prop.type === "rich_text") {
      review = extractRichText(prop.rich_text);
    }
  }

  // Icon
  let icon: string | undefined;
  if (page.icon) {
    if (page.icon.type === "emoji") {
      icon = page.icon.emoji;
    } else if (page.icon.type === "external") {
      icon = page.icon.external?.url;
    } else if (page.icon.type === "file") {
      icon = page.icon.file?.url;
    }
  }

  return {
    id: page.id,
    title,
    author,
    genre,
    genreColor,
    coverImage,
    rating,
    review,
    notionUrl: page.url,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
    icon,
    rawProperties: properties,
  };
}

/**
 * POST /prototypes/my-bookshelf/api
 * Fetch books from Notion using official @notionhq/client SDK (version 2026-03-11 Data Sources API)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const apiKey = body.apiKey || process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
    const rawContainerId =
      body.databaseId ||
      body.dataSourceId ||
      process.env.NOTION_DATABASE_ID ||
      process.env.NOTION_DATA_SOURCE_ID;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Missing Notion API Key",
          message:
            "Please configure your Notion API key in the connection panel or set NOTION_API_KEY in .env.local",
          isConfigured: false,
        },
        { status: 400 }
      );
    }

    if (!rawContainerId) {
      return NextResponse.json(
        {
          error: "Missing Notion Database ID",
          message:
            "Please provide your Notion Database ID or Data Source ID in the connection panel or set NOTION_DATABASE_ID in .env.local",
          isConfigured: false,
        },
        { status: 400 }
      );
    }

    const containerId = cleanNotionId(rawContainerId);

    // Initialize official Notion SDK Client with latest Notion-Version: 2026-03-11
    const notion = new Client({
      auth: apiKey.trim(),
      notionVersion: "2026-03-11",
    });

    let targetDataSourceId = containerId;
    let databaseTitle = "My Bookshelf";

    // Step 1: Retrieve database metadata to resolve parent container to primary data source
    try {
      const db = (await notion.databases.retrieve({ database_id: containerId })) as any;
      if (db.title && Array.isArray(db.title)) {
        databaseTitle = extractRichText(db.title) || databaseTitle;
      }
      if (Array.isArray(db.data_sources) && db.data_sources.length > 0) {
        targetDataSourceId = db.data_sources[0].id;
      }
    } catch {
      // If retrieval as database fails, containerId may already be a direct data source ID
    }

    let rawPages: any[] = [];

    // Step 2: Query the modern Data Source endpoint (POST /v1/data_sources/{id}/query)
    try {
      const queryResult = (await (notion as any).dataSources.query({
        data_source_id: targetDataSourceId,
        page_size: 100,
      })) as any;
      rawPages = queryResult.results || [];
    } catch (err: any) {
      // Resilient fallback: If dataSources query fails, try legacy database query endpoint
      try {
        const legacyHeaders = {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        };
        const legacyRes = await fetch(
          `https://api.notion.com/v1/databases/${containerId}/query`,
          {
            method: "POST",
            headers: legacyHeaders,
            body: JSON.stringify({ page_size: 100 }),
          }
        );
        if (legacyRes.ok) {
          const legacyData = await legacyRes.json();
          rawPages = legacyData.results || [];
        } else {
          throw err;
        }
      } catch {
        let friendlyMessage = err?.message || "Failed to query Notion database";
        let status = 400;

        if (isNotionClientError(err)) {
          if (err.code === "unauthorized") {
            status = 401;
            friendlyMessage =
              "Invalid Notion API Token. Make sure your integration secret is active and copied correctly.";
          } else if (err.code === "object_not_found") {
            status = 404;
            friendlyMessage =
              "Database not found. Ensure you have invited/shared your integration with this database in Notion (Database menu → Add connections).";
          }
        }

        return NextResponse.json(
          {
            error: err?.code || "NotionQueryError",
            message: friendlyMessage,
            status,
            isConfigured: true,
          },
          { status }
        );
      }
    }

    // Filter out items in trash
    const activePages = rawPages.filter((p: any) => !p.in_trash && !p.archived);

    // Parse into standard BookItem models
    const books = activePages.map(parseNotionPage);

    return NextResponse.json({
      success: true,
      databaseTitle,
      count: books.length,
      books,
      isConfigured: true,
      dataSourceId: targetDataSourceId,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "InternalServerError",
        message:
          err?.message || "An unexpected error occurred while communicating with Notion.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler to check if environment variables are pre-configured
 */
export async function GET() {
  const hasApiKey = Boolean(process.env.NOTION_API_KEY || process.env.NOTION_TOKEN);
  const hasDbId = Boolean(process.env.NOTION_DATABASE_ID || process.env.NOTION_DATA_SOURCE_ID);

  return NextResponse.json({
    hasEnvCredentials: hasApiKey && hasDbId,
    configuredDatabaseId: hasDbId
      ? process.env.NOTION_DATABASE_ID
        ? "configured"
        : undefined
      : undefined,
  });
}
