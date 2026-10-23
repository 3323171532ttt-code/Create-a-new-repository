"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteItemAction } from "../actions";
import type { Item } from "../types";
import styles from "../styles.module.css";

interface ItemCardProps {
  item: Item;
  isOwner: boolean;
}

export function ItemCard({ item, isOwner }: ItemCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${item.title}"?`)) {
      return;
    }

    setIsDeleting(true);
    const res = await deleteItemAction(item.id, item.board_id);
    setIsDeleting(false);

    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Failed to delete item");
    }
  };

  return (
    <article className={styles.itemCard}>
      <div className={styles.itemImageWrapper}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url}
          alt={item.title}
          className={styles.itemImage}
          loading="lazy"
        />
      </div>

      <div className={styles.itemContent}>
        <h4 className={styles.itemTitle}>{item.title}</h4>

        {item.note && <p className={styles.itemNote}>{item.note}</p>}

        <div className={styles.itemFooter}>
          {item.link_url ? (
            <a
              href={item.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.itemLink}
              title={item.link_url}
            >
              <span>🔗</span>
              <span>
                {(() => {
                  try {
                    return new URL(item.link_url).hostname.replace("www.", "");
                  } catch {
                    return "Source link";
                  }
                })()}
              </span>
            </a>
          ) : (
            <span style={{ color: "#a3a3a3", fontSize: "11px" }}>
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          )}

          {isOwner && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className={styles.itemDeleteButton}
              title="Delete item"
            >
              {isDeleting ? "..." : "Delete"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
