"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import styles from "../styles.module.css";

interface AuthNavProps {
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export function AuthNav({ user }: AuthNavProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/prototypes/inspiration-library");
            router.refresh();
          },
        },
      });
    } catch (err) {
      console.error("Sign out error:", err);
      // Fallback reload
      window.location.href = "/prototypes/inspiration-library";
    }
  };

  if (user) {
    return (
      <div className={styles.navControls}>
        <span className={styles.userBadge} title={user.email}>
          👤 {user.name || user.email}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className={`${styles.navButton} ${styles.navButtonOutline}`}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className={styles.navControls}>
      <Link
        href="/prototypes/inspiration-library/sign-in"
        className={`${styles.navButton} ${styles.navButtonOutline}`}
      >
        Sign in
      </Link>
      <Link
        href="/prototypes/inspiration-library/sign-up"
        className={`${styles.navButton} ${styles.navButtonPrimary}`}
      >
        Sign up
      </Link>
    </div>
  );
}
