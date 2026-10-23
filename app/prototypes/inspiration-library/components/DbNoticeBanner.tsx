import styles from "../styles.module.css";

export function DbNoticeBanner() {
  return (
    <div className={styles.dbNotice}>
      <div className={styles.dbNoticeInner}>
        <span className={styles.dbNoticeIcon}>💡</span>
        <div>
          <h4 className={styles.dbNoticeTitle}>Supabase Database Not Connected Yet</h4>
          <p className={styles.dbNoticeText}>
            To start saving boards and items, add your Postgres connection string to{" "}
            <span className={styles.dbNoticeCode}>DATABASE_URL</span> in{" "}
            <span className={styles.dbNoticeCode}>.env.local</span>, then run{" "}
            <span className={styles.dbNoticeCode}>app/prototypes/inspiration-library/schema.sql</span>{" "}
            in your Supabase SQL Editor.
          </p>
        </div>
      </div>
    </div>
  );
}
