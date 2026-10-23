"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createItemAction } from "../actions";
import styles from "../styles.module.css";

interface AddItemModalProps {
  boardId: string;
}

export function AddItemModal({ boardId }: AddItemModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("board_id", boardId);

    const result = await createItemAction(formData);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to add item.");
      return;
    }

    setIsOpen(false);
    setPreviewUrl("");
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${styles.navButton} ${styles.navButtonPrimary}`}
      >
        <span>+</span> Add item
      </button>

      {isOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsOpen(false)}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Inspiration Item</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {error && <div className={styles.formError}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="item-title">
                  Title
                </label>
                <input
                  id="item-title"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Modernist Chair, Swiss Poster, Grid Layout"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="item-image">
                  Image URL
                </label>
                <input
                  id="item-image"
                  name="image_url"
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              {previewUrl && (
                <div className={styles.formGroup}>
                  <span className={styles.formLabel}>Image Preview</span>
                  <div
                    style={{
                      maxHeight: "160px",
                      overflow: "hidden",
                      borderRadius: "6px",
                      border: "1px solid #e5e5e5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f5f5f5",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{ maxHeight: "160px", width: "auto", objectFit: "contain" }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="item-link">
                  Source / Reference Link (optional)
                </label>
                <input
                  id="item-link"
                  name="link_url"
                  type="url"
                  placeholder="https://arena.net/... or https://pinterest.com/..."
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="item-note">
                  Personal Note (optional)
                </label>
                <textarea
                  id="item-note"
                  name="note"
                  placeholder="Why did this catch your eye? Design thoughts or notes..."
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.formButtonRow}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={`${styles.navButton} ${styles.navButtonOutline}`}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.navButton} ${styles.navButtonPrimary}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
