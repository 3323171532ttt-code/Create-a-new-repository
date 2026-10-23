"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import styles from "../styles.module.css";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (response.error) {
        setError(response.error.message || "Failed to create account.");
        setIsLoading(false);
        return;
      }

      router.push("/prototypes/inspiration-library");
      router.refresh();
    } catch (err: unknown) {
      console.error("Sign up failed:", err);
      setError("An unexpected error occurred during account creation.");
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
          <h2 className={styles.authTitle}>Create your archive</h2>
          <p className={styles.authSubtitle}>
            Save images, visual ideas, and web references in personal boards.
          </p>
        </div>

        {error && <div className={styles.formError}>{error}</div>}

        <form onSubmit={handleSignUp}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="signup-name">
              Your name
            </label>
            <input
              id="signup-name"
              type="text"
              required
              autoComplete="name"
              placeholder="e.g. Shuotong"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="signup-email">
              Email
            </label>
            <input
              id="signup-email"
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
            <label className={styles.formLabel} htmlFor="signup-password">
              Password (min. 8 characters)
            </label>
            <input
              id="signup-password"
              type="password"
              required
              autoComplete="new-password"
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
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className={styles.authFooterText}>
          Already have an account?{" "}
          <Link href="/prototypes/inspiration-library/sign-in" className={styles.authLink}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
