"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleBoardPrivacyAction, deleteBoardAction } from "../actions";
import { AddItemModal } from "./AddItemModal";
import styles from "../styles.module.css";

interface BoardControlsProps {
  boardId: string;
  isPublic: boolean;
}

export function BoardControls({ boardId, isPublic }: BoardControlsProps) {
  const [currentIsPublic, setCurrentIsPublic] = useState(isPublic);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleTogglePrivacy = async () => {
    setIsToggling(true);
    const nextValue = !currentIsPublic;
    const res = await toggleBoardPrivacyAction(boardId, nextValue);
    setIsToggling(false);

    if (res.success) {
      setCurrentIsPublic(nextValue);
      router.refresh();
    } else {
      alert(res.error || "Failed to update privacy");
    }
  };

  const handleDeleteBoard = async () => {
    if (!window.confirm("Are you sure you want to delete this board and all its items?")) {
      return;
    }

    setIsDeleting(true);
    const res = await deleteBoardAction(boardId);
    setIsDeleting(false);

    if (res.success) {
      router.push("/prototypes/inspiration-library");
      router.refresh();
    } else {
      alert(res.error || "Failed to delete board");
    }
  };

  return (
    <div className={styles.boardHeaderActions}>
      <button
        type="button"
        onClick={handleTogglePrivacy}
        disabled={isToggling}
        className={`${styles.navButton} ${styles.navButtonOutline}`}
        title={currentIsPublic ? "Click to make board private" : "Click to make board public"}
      >
        <span>{currentIsPublic ? "🌐 Public" : "🔒 Private"}</span>
        <span style={{ fontSize: "11px", opacity: 0.7 }}>
          ({isToggling ? "Saving..." : "Change"})
        </span>
      </button>

      <AddItemModal boardId={boardId} />

      <button
        type="button"
        onClick={handleDeleteBoard}
        disabled={isDeleting}
        className={`${styles.navButton} ${styles.navButtonText}`}
        style={{ color: "#dc2626" }}
        title="Delete board and all items"
      >
        {isDeleting ? "Deleting..." : "Delete board"}
      </button>
    </div>
  );
}
