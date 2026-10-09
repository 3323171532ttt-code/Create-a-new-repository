"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./styles/home.module.css";
import { instrumentSans } from "./fonts";

interface PrototypeItem {
  title: string;
  description: string;
  path: string;
  icon?: string;
  badge?: string;
  category?: string;
}

const CATEGORIES = ["ALL", "3D & WEBGL", "TYPOGRAPHY", "INTERACTIVE", "API & TOOLS"] as const;

export default function Home() {
  // All combined prototypes organized by domain
  const rawPrototypes: PrototypeItem[] = [
    {
      title: "3D Doodle Studio",
      description: "Draw spatial neon ribbons in 3D coordinate space with multiple brush geometries and 360° orbit inspection",
      path: "/prototypes/doodle-playground",
      icon: "🎨",
      badge: "3D & WEBGL",
      category: "3D & WEBGL",
    },
    {
      title: "Typography Playground",
      description: "Handmade textile & woven letters with living character animations, variable fonts, and audio synthesis",
      path: "/prototypes/typography-playground",
      icon: "🧶",
      badge: "VARIABLE FONTS",
      category: "TYPOGRAPHY",
    },
    {
      title: "Custom font canvas",
      description: "Enter any content and generate custom algorithmic fonts centered on an interactive canvas",
      path: "/prototypes/custom-font-canvas",
      icon: "🔤",
      badge: "CANVAS",
      category: "TYPOGRAPHY",
    },
    {
      title: "Confetti button",
      description: "An interactive button that creates a colorful confetti particle explosion",
      path: "/prototypes/confetti-button",
      icon: "🎉",
      badge: "INTERACTIVE",
      category: "INTERACTIVE",
    },
    {
      title: "Local weather",
      description: "Live local weather dashboard powered by OpenWeatherMap and geolocation",
      path: "/prototypes/weather-display",
      icon: "🌦️",
      badge: "API",
      category: "API & TOOLS",
    },
    {
      title: "Getting started",
      description: "How to create a prototype with component guidelines and best practices",
      path: "/prototypes/example",
      icon: "🚀",
      badge: "GUIDE",
      category: "INTERACTIVE",
    },
  ];

  // UI state
  const [theme, setTheme] = useState<"platinum" | "cyber">("platinum");
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [windowMinimized, setWindowMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [timeStr, setTimeStr] = useState("12:00:00 PM");
  const [loadPct, setLoadPct] = useState(48);

  // Hydration & clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-US", { hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    // Minor fluctuating core load for futuristic telemetry
    const loadTimer = setInterval(() => {
      setLoadPct(Math.floor(40 + Math.random() * 25));
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(loadTimer);
    };
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.menuBar}`)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // Filtered prototypes based on search query & active category tab
  const filteredPrototypes = useMemo(() => {
    return rawPrototypes.filter((p) => {
      const matchesCategory =
        selectedCategory === "ALL" || p.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.badge && p.badge.toLowerCase().includes(q))
      );
    });
  }, [rawPrototypes, searchQuery, selectedCategory]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "platinum" ? "cyber" : "platinum"));
  };

  return (
    <div
      className={`${styles.themeContainer} ${instrumentSans.className}`}
      data-theme={theme}
    >
      {/* Optional CRT Scanline / Vignette Layer */}
      {crtEnabled && <div className={styles.crtOverlay} />}

      {/* =================================================================== */}
      {/* Top Classic Mac Menu Bar                                           */}
      {/* =================================================================== */}
      <nav className={styles.menuBar}>
        <div className={styles.menuLeft}>
          {/* Apple / System Menu */}
          <div
            className={`${styles.appleLogo} ${activeMenu === "apple" ? styles.active : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === "apple" ? null : "apple");
            }}
          >
            <span className={styles.appleGlyph}></span>
            <span>System</span>
            {activeMenu === "apple" && (
              <ul className={styles.dropdownMenu}>
                <li
                  className={styles.dropdownItem}
                  onClick={() => {
                    setIsAboutOpen(true);
                    setActiveMenu(null);
                  }}
                >
                  <span>About System 2084...</span>
                  <span>⌘I</span>
                </li>
                <li className={styles.dropdownDivider} />
                <li className={styles.dropdownItem}>
                  <span>Neural Core: Nominal</span>
                  <span>⚡</span>
                </li>
                <li className={styles.dropdownItem}>
                  <span>Bus Frequency: 4.8 GHz</span>
                  <span>OK</span>
                </li>
                <li className={styles.dropdownDivider} />
                <li
                  className={styles.dropdownItem}
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  <span>Restart Finder</span>
                  <span>⌘R</span>
                </li>
              </ul>
            )}
          </div>

          {/* Menus: File, Edit, View, Special */}
          <ul className={styles.menuItems}>
            {/* File Menu */}
            <li
              className={`${styles.menuItem} ${activeMenu === "file" ? styles.active : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === "file" ? null : "file");
              }}
            >
              File
              {activeMenu === "file" && (
                <ul className={styles.dropdownMenu}>
                  <li
                    className={styles.dropdownItem}
                    onClick={() => {
                      setWindowMinimized(false);
                      setActiveMenu(null);
                    }}
                  >
                    <span>Open Finder Window</span>
                    <span>⌘O</span>
                  </li>
                  <li
                    className={styles.dropdownItem}
                    onClick={() => {
                      setWindowMinimized(true);
                      setActiveMenu(null);
                    }}
                  >
                    <span>Close Window</span>
                    <span>⌘W</span>
                  </li>
                  <li className={styles.dropdownDivider} />
                  <li
                    className={styles.dropdownItem}
                    onClick={() => {
                      alert("Tip: Press ⌘-I or ask your Assistant to generate a new prototype folder!");
                      setActiveMenu(null);
                    }}
                  >
                    <span>New Prototype...</span>
                    <span>⌘N</span>
                  </li>
                </ul>
              )}
            </li>

            {/* View Menu */}
            <li
              className={`${styles.menuItem} ${activeMenu === "view" ? styles.active : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === "view" ? null : "view");
              }}
            >
              View
              {activeMenu === "view" && (
                <ul className={styles.dropdownMenu}>
                  <li className={styles.dropdownItem} onClick={() => setActiveMenu(null)}>
                    <span>✓ by Interactive Cards</span>
                  </li>
                  <li
                    className={styles.dropdownItem}
                    onClick={() => {
                      setSearchQuery("");
                      setActiveMenu(null);
                    }}
                  >
                    <span>Reset Filter</span>
                  </li>
                  <li className={styles.dropdownDivider} />
                  <li
                    className={styles.dropdownItem}
                    onClick={() => {
                      setWindowMinimized(false);
                      setActiveMenu(null);
                    }}
                  >
                    <span>Bring All to Front</span>
                  </li>
                </ul>
              )}
            </li>

            {/* Special Menu */}
            <li
              className={`${styles.menuItem} ${activeMenu === "special" ? styles.active : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === "special" ? null : "special");
              }}
            >
              Special
              {activeMenu === "special" && (
                <ul className={styles.dropdownMenu}>
                  <li
                    className={styles.dropdownItem}
                    onClick={() => {
                      toggleTheme();
                      setActiveMenu(null);
                    }}
                  >
                    <span>Toggle Theme ({theme === "platinum" ? "Cyber" : "Platinum"})</span>
                    <span>⌘T</span>
                  </li>
                  <li
                    className={styles.dropdownItem}
                    onClick={() => {
                      setCrtEnabled(!crtEnabled);
                      setActiveMenu(null);
                    }}
                  >
                    <span>Toggle CRT Beam ({crtEnabled ? "ON" : "OFF"})</span>
                  </li>
                  <li className={styles.dropdownDivider} />
                  <li
                    className={styles.dropdownItem}
                    onClick={() => {
                      alert("Trash is empty. All storage nodes intact.");
                      setActiveMenu(null);
                    }}
                  >
                    <span>Empty Trash</span>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </div>

        {/* Right Status Tray */}
        <div className={styles.menuRight}>
          <div className={styles.statusPill}>
            <span className={styles.statusLed} />
            <span>CORE ONLINE</span>
          </div>

          <button
            type="button"
            className={styles.controlBtn}
            onClick={() => setCrtEnabled(!crtEnabled)}
            title="Toggle Retro CRT Scanlines"
          >
            CRT: {crtEnabled ? "ON" : "OFF"}
          </button>

          <button
            type="button"
            className={styles.controlBtn}
            onClick={toggleTheme}
            title="Switch between Neo-Platinum & Cyber-Dark mode"
          >
            {theme === "platinum" ? "⚡ CYBER" : "💿 MAC"}
          </button>

          <span className={styles.clockDisplay}>{timeStr}</span>
        </div>
      </nav>

      {/* =================================================================== */}
      {/* Desktop Workspace                                                  */}
      {/* =================================================================== */}
      <div className={styles.desktop}>
        {/* Main Classic Mac Window */}
        {!windowMinimized ? (
          <section className={styles.macWindow}>
            {/* Title Bar with Pinstripes */}
            <header className={styles.titleBar}>
              <div
                className={styles.goAwayBox}
                onClick={() => setWindowMinimized(true)}
                title="Minimize Window"
              />
              <div className={styles.pinstripes} />
              <h2 className={styles.windowTitle}>
                <span>Elizabeth's prototypes</span>
                <span className={styles.titleTag}>SYS-2084</span>
              </h2>
              <div className={styles.pinstripes} />
              <div className={styles.windowRightControls}>
                <div
                  className={styles.zoomBox}
                  onClick={() => setSearchQuery("")}
                  title="Reset Filter"
                />
              </div>
            </header>

            {/* Info / Filter Ribbon */}
            <div className={styles.infoRibbon}>
              <div className={styles.infoStats}>
                <span>
                  <strong className={styles.statHighlight}>{rawPrototypes.length}</strong> items
                </span>
                <span>
                  <strong className={styles.statHighlight}>512 KB</strong> in disk
                </span>
                <span>
                  <strong className={styles.statHighlight}>3.8 TB</strong> quantum free
                </span>
              </div>

              <div className={styles.filterControls}>
                <div className={styles.categoryTabs}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`${styles.categoryTab} ${selectedCategory === cat ? styles.categoryTabActive : ""}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Search prototypes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.filterInput}
                />
              </div>
            </div>

            {/* Window Body: Prototypes Grid */}
            <main className={styles.windowBody}>
              <div className={styles.grid}>
                {filteredPrototypes.map((prototype, index) => (
                  <Link
                    key={index}
                    href={prototype.path}
                    className={styles.card}
                  >
                    <div className={styles.cardTop}>
                      <div className={styles.cardIcon}>
                        {prototype.icon || "💾"}
                      </div>
                      <span className={styles.cardBadge}>
                        {prototype.badge || "PROTOTYPE"}
                      </span>
                    </div>

                    <div>
                      <h3 className={styles.cardTitle}>{prototype.title}</h3>
                      <p className={styles.cardDesc}>{prototype.description}</p>
                    </div>

                    <div className={styles.cardFooter}>
                      <span style={{ opacity: 0.6 }}>{prototype.path}</span>
                      <span className={styles.launchLink}>
                        EXECUTE <span>→</span>
                      </span>
                    </div>
                  </Link>
                ))}

                {/* Helper Card for adding new prototypes */}
                <div className={styles.newPrototypeCard}>
                  <div className={styles.newIcon}>📁+</div>
                  <div className={styles.newText}>
                    <strong>Ready to expand?</strong>
                    <div>Create a new folder in <code>app/prototypes/</code></div>
                    <span className={styles.newKbd}>⌘-I Composer Agent</span>
                  </div>
                </div>
              </div>
            </main>

            {/* Telemetry Footer */}
            <footer className={styles.windowFooter}>
              <div className={styles.footerLeft}>
                <span>PROTOCOL: NEURAL-NET</span>
                <span>SECURITY: QUANTUM-VERIFIED</span>
              </div>
              <div className={styles.footerRight}>
                <span>CORE LOAD:</span>
                <div className={styles.coreLoadBar}>
                  <div
                    className={styles.coreLoadFill}
                    style={{ width: `${loadPct}%` }}
                  />
                </div>
                <span>{loadPct}%</span>
              </div>
            </footer>
          </section>
        ) : (
          /* Minimized Window Placeholder Bar */
          <div
            className={styles.macWindow}
            style={{ cursor: "pointer", padding: "12px 20px" }}
            onClick={() => setWindowMinimized(false)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span>📁</span>
              <strong>Elizabeth's prototypes (Minimized) — Click to restore window</strong>
            </div>
          </div>
        )}

        {/* Right Desktop Icons */}
        <aside className={styles.desktopIcons}>
          <div
            className={`${styles.desktopIcon} ${!windowMinimized ? styles.active : ""}`}
            onClick={() => setWindowMinimized(false)}
            title="Open Prototypes Window"
          >
            <div className={styles.iconGraphic}>💾</div>
            <span className={styles.iconLabel}>Mac HD 2084</span>
          </div>

          <div
            className={styles.desktopIcon}
            onClick={() => setWindowMinimized(!windowMinimized)}
            title="Toggle Prototypes Window"
          >
            <div className={styles.iconGraphic}>📂</div>
            <span className={styles.iconLabel}>Prototypes</span>
          </div>

          <div
            className={styles.desktopIcon}
            onClick={() => setIsAboutOpen(true)}
            title="About System 2084"
          >
            <div className={styles.iconGraphic}>🖥️</div>
            <span className={styles.iconLabel}>System Info</span>
          </div>

          <div
            className={styles.desktopIcon}
            onClick={() => alert("Trash Can: 0 items pending purge.")}
            title="Trash"
          >
            <div className={styles.iconGraphic}>🗑️</div>
            <span className={styles.iconLabel}>Trash</span>
          </div>
        </aside>
      </div>

      {/* =================================================================== */}
      {/* "About System 2084" Modal Dialog                                   */}
      {/* =================================================================== */}
      {isAboutOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsAboutOpen(false)}>
          <div
            className={styles.aboutModal}
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.titleBar}>
              <div
                className={styles.goAwayBox}
                onClick={() => setIsAboutOpen(false)}
              />
              <div className={styles.pinstripes} />
              <span className={styles.windowTitle}>About This System</span>
              <div className={styles.pinstripes} />
            </header>

            <div className={styles.aboutContent}>
              <div className={styles.aboutHeader}>
                <div className={styles.aboutMacGraphic}>🖥️</div>
                <div>
                  <h3 className={styles.aboutTitleH1}>System 2084</h3>
                  <p className={styles.aboutSubtitle}>
                    Elizabeth Edition • Release v7.84-NEO
                  </p>
                </div>
              </div>

              <div className={styles.specList}>
                <div className={styles.specRow}>
                  <span>Framework</span>
                  <strong>Next.js 15.5.25 (React 19)</strong>
                </div>
                <div className={styles.specRow}>
                  <span>Neural Core</span>
                  <strong>Node.js 26.9.0</strong>
                </div>
                <div className={styles.specRow}>
                  <span>Display Protocol</span>
                  <strong>Phosphor CRT + Cyber-Luminesce</strong>
                </div>
                <div className={styles.specRow}>
                  <span>Architecture</span>
                  <strong>Classic Mac OS x Futurism</strong>
                </div>
                <div className={styles.specRow}>
                  <span>Active Theme</span>
                  <strong style={{ textTransform: "capitalize" }}>{theme} Mode</strong>
                </div>
              </div>

              <div className={styles.modalButtonRow}>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setIsAboutOpen(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

