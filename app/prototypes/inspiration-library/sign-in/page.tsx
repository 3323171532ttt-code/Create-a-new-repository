"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import styles from "../styles.module.css";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authClient.signIn.email({
        email,
        password,
      });

      if (response.error) {
        setError(response.error.message || "Invalid email or password.");
        setIsLoading(false);
        return;
      }

      router.push("/prototypes/inspiration-library");
      router.refresh();
    } catch (err: unknown) {
      console.error("Sign in failed:", err);
      setError("An unexpected error occurred during sign in.");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <Link href="/prototypes/inspiration-library" className={styles.brandGroup} style={{ justifyContent: "center", marginBottom: "16px" }}>
            <div className={styles.brandLogo}>★</div>
            <span className={styles.brandName}>Inspiration library</span>
          </Link>
          <h2 className={styles.authTitle}>Sign in to your archive</h2>
          <p className={styles.authSubtitle}>
            Access your personal moodboards and saved collections.
          </p>
        </div>

        {error && <div className={styles.formError}>{error}</div>}

        <form onSubmit={handleSignIn}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="signin-email">
              Email
            </label>
            <input
              id="signin-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="signin-password">
              Password
            </label>
            <input
              id="signin-password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.formInput}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={styles.authSubmitBtn}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className={styles.authFooterText}>
          Don&apos;t have an account yet?{" "}
          <Link href="/prototypes/inspiration-library/sign-up" className={styles.authLink}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
