import Link from "next/link";
import styles from "../../styles.module.css";

export default function BoardNotFound() {
  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <Link href="/prototypes/inspiration-library" className={styles.brandGroup}>
            <div className={styles.brandLogo}>★</div>
            <div>
              <span className={styles.brandName}>Inspiration library</span>
            </div>
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.notFoundContainer}>
          <div className={styles.notFoundCode}>404 Not Found</div>
          <h2 className={styles.notFoundTitle}>Board Unavailable</h2>
          <p className={styles.notFoundDesc}>
            This board is private or does not exist. If this is your board, please sign in to
            access your collection.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link
              href="/prototypes/inspiration-library"
              className={`${styles.navButton} ${styles.navButtonOutline}`}
            >
              Back to Home
            </Link>
            <Link
              href="/prototypes/inspiration-library/sign-in"
              className={`${styles.navButton} ${styles.navButtonPrimary}`}
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
