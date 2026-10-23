"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBoardAction } from "../actions";
import styles from "../styles.module.css";

export function NewBoardModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createBoardAction(formData);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to create board.");
      return;
    }

    setIsOpen(false);
    if (result.boardId) {
      router.push(`/prototypes/inspiration-library/board/${result.boardId}`);
    } else {
      router.refresh();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${styles.navButton} ${styles.navButtonPrimary}`}
      >
        <span>+</span> New board
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
              <h3 className={styles.modalTitle}>Create New Board</h3>
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
                <label className={styles.formLabel} htmlFor="board-title">
                  Board Title
                </label>
                <input
                  id="board-title"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Architectural Sketches, Typography, UI Moods"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="board-desc">
                  Description (optional)
                </label>
                <textarea
                  id="board-desc"
                  name="description"
                  placeholder="What is this collection about?"
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_public"
                    value="true"
                    className={styles.checkboxInput}
                  />
                  <span>
                    <strong>Make public</strong> — anyone with the link can view this board
                  </span>
                </label>
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
                  {isSubmitting ? "Creating..." : "Create Board"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
