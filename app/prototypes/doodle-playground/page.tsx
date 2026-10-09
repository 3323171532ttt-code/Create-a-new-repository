"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./styles.module.css";

export default function DoodlePlaygroundPrototype() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div className={styles.wrapper}>
      {/* Top Studio Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.backLink}>
            <span>←</span> Back to Prototypes
          </Link>
          <div className={styles.divider} />
          <div className={styles.titleGroup}>
            <span className={styles.badge}>3D &amp; WebGL</span>
            <h1 className={styles.title}>3D Doodle Studio</h1>
            <span className={styles.versionTag}>v1.0 • Three.js</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <a
            href="/doodle-playground/standalone.html"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionBtn}
            title="Open standalone version in a new browser tab"
          >
            Open in New Window ↗
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
          src="/doodle-playground/standalone.html"
          title="3D Doodle Studio Neon Ribbons"
          className={styles.doodleFrame}
          allow="accelerometer; camera; gyroscope"
        />
      </main>

      {/* Educational Walkthrough & Controls Reference */}
      {!isFullscreen && (
        <section className={styles.guideSection}>
          <div className={styles.guideGrid}>
            <div className={styles.guideCard}>
              <h2 className={styles.cardHeading}>🎨 How to Draw in 3D</h2>
              <ul className={styles.stepList}>
                <li className={styles.stepItem}>
                  <strong className={styles.stepTitle}>Draw Mode:</strong> Click and drag anywhere on the canvas to generate 3D ribbons in spatial depth.
                </li>
                <li className={styles.stepItem}>
                  <strong className={styles.stepTitle}>Inspect Mode:</strong> Orbit, pan, and rotate your sculpture in 360° space around the camera target.
                </li>
                <li className={styles.stepItem}>
                  <strong className={styles.stepTitle}>Ribbon Geometries:</strong> Switch between <em>Flat Strip</em>, <em>Helix Twist</em>, <em>Crystal Prism</em>, and <em>Glow Tube</em>.
                </li>
              </ul>
            </div>

            <div className={styles.guideCard}>
              <h2 className={styles.cardHeading}>⚙️ Technical Architecture</h2>
              <div className={styles.specTable}>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Rendering Core</span>
                  <span className={styles.specValue}>Three.js (WebGL 2.0)</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Curve Math</span>
                  <span className={styles.specValue}>Catmull-Rom Spline Interpolation</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Geometry Generation</span>
                  <span className={styles.specValue}>Dynamic Frenet-Serret BufferGeometries</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Lighting &amp; Shaders</span>
                  <span className={styles.specValue}>Point Lights &amp; Luminescent MeshStandardMaterials</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
