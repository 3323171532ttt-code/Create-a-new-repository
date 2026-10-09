"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./styles.module.css";

export default function TypographyPlaygroundPrototype() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div className={styles.wrapper}>
      {/* Top Archival Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.backLink}>
            <span>←</span> Back to Prototypes
          </Link>
          <div className={styles.divider} />
          <div className={styles.titleGroup}>
            <span className={styles.badge}>Variable Fonts</span>
            <h1 className={styles.title}>Typography Playground</h1>
            <span className={styles.subtitle}>Handmade Textile &amp; Woven Letters</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <a
            href="/typography-playground/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionBtn}
            title="Open pure standalone HTML in a new tab"
          >
            Open Standalone ↗
          </a>
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`${styles.actionBtn} ${isFullscreen ? styles.activeBtn : ""}`}
            title="Toggle fullscreen view"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className={`${styles.stageContainer} ${isFullscreen ? styles.stageFullscreen : ""}`}>
        <iframe
          src="/typography-playground/index.html"
          title="Typography Playground Textile Letters"
          className={styles.typoFrame}
          allow="autoplay"
        />
      </main>

      {/* Educational Walkthrough & Parameter Specs */}
      {!isFullscreen && (
        <section className={styles.guideSection}>
          <div className={styles.guideGrid}>
            <div className={styles.guideCard}>
              <h2 className={styles.cardHeading}>🧶 Tactile Textile Typography</h2>
              <ul className={styles.stepList}>
                <li className={styles.stepItem}>
                  <strong className={styles.stepTitle}>Interactive Letters:</strong> Click, hover, or shake any letter to hear synthesized woolly audio and trigger spring-physics dynamics.
                </li>
                <li className={styles.stepItem}>
                  <strong className={styles.stepTitle}>Loom Fonts:</strong> Switch between <em>Jacquard 12</em>, <em>Jacquard 24</em>, and <em>Fraunces</em> variable font.
                </li>
                <li className={styles.stepItem}>
                  <strong className={styles.stepTitle}>&ldquo;Make It Weird!&rdquo;:</strong> Randomizes the variable font axes (`WONK`, `SOFT`, `wght`) and yarn color arrangements.
                </li>
              </ul>
            </div>

            <div className={styles.guideCard}>
              <h2 className={styles.cardHeading}>🔬 Technical Details</h2>
              <div className={styles.specTable}>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Typography Engine</span>
                  <span className={styles.specValue}>Google Variable Fonts (`font-variation-settings`)</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Fiber Edge Distortion</span>
                  <span className={styles.specValue}>SVG `feTurbulence` &amp; `feDisplacementMap`</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Audio Synthesis</span>
                  <span className={styles.specValue}>Web Audio API (`OscillatorNode` + `GainNode`)</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Dependencies</span>
                  <span className={styles.specValue}>Zero external libraries (Pure Vanilla)</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
