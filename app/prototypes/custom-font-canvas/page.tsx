"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import styles from "./styles.module.css";

// Preset color themes for quick styling & random generation
const PRESET_PALETTES = [
  { name: "Cyberpunk", text: "#00ffcc", bg: "#0d1117", accent: "#ff007f" },
  { name: "Matrix", text: "#00ff66", bg: "#050d08", accent: "#00aa44" },
  { name: "Synthwave", text: "#ff71ce", bg: "#1a0b2e", accent: "#01cdfe" },
  { name: "Bauhaus", text: "#facc15", bg: "#1e293b", accent: "#ef4444" },
  { name: "Solar Glow", text: "#fb923c", bg: "#18181b", accent: "#f43f5e" },
  { name: "Monochrome", text: "#f8fafc", bg: "#0f172a", accent: "#64748b" },
];

const PRESET_PHRASES = [
  "SYSTEM 2084",
  "FUTURE FONT",
  "CREATIVE CODE",
  "NEO TYPOGRAPHY",
  "DESIGN X AI",
];

type FontStyleMode = "pixel" | "neon" | "bauhaus" | "glitch" | "parametric";

export default function CustomFontCanvasPrototype() {
  // User input content
  const [content, setContent] = useState("SYSTEM 2084");

  // Custom font parameters
  const [styleMode, setStyleMode] = useState<FontStyleMode>("pixel");
  const [fontSize, setFontSize] = useState(64);
  const [letterSpacing, setLetterSpacing] = useState(8);
  const [slantAngle, setSlantAngle] = useState(0); // in degrees
  const [textColor, setTextColor] = useState("#00ffcc");
  const [bgColor, setBgColor] = useState("#0d1117");
  const [accentColor, setAccentColor] = useState("#ff007f");
  const [pixelSize, setPixelSize] = useState(6);
  const [pixelShape, setPixelShape] = useState<"square" | "circle">("square");
  const [fontFamily, setFontFamily] = useState<string>("Space Grotesk, sans-serif");
  const [showCenterGuides, setShowCenterGuides] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /**
   * Main rendering function: renders the custom font centered on the canvas.
   * Uses requestAnimationFrame or runs on state changes.
   */
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Logical canvas dimensions (CSS pixels)
    const logicalWidth = 800;
    const logicalHeight = 500;

    // HiDPI / Retina display scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;

    // Scale context so drawing commands use logical coordinates
    ctx.scale(dpr, dpr);

    // 1. Draw Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    // Optional background grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < logicalWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, logicalHeight);
      ctx.stroke();
    }
    for (let y = 0; y < logicalHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(logicalWidth, y);
      ctx.stroke();
    }

    // 2. Optical Center
    const centerX = logicalWidth / 2;
    const centerY = logicalHeight / 2;

    // Prepare text lines (supports multi-line input)
    const rawLines = content.split("\n");
    const lines = rawLines.length > 0 ? rawLines : [""];
    const lineHeight = fontSize * 1.25;
    const totalBlockHeight = lines.length * lineHeight;

    // Helper: draw subtle centering guides if enabled
    if (showCenterGuides) {
      ctx.save();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.18)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Vertical center guide
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, logicalHeight);
      ctx.stroke();

      // Horizontal center guide
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(logicalWidth, centerY);
      ctx.stroke();

      // Center crosshair marker
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // =========================================================================
    // STYLE MODE 1: Generative Pixel Matrix / 8-Bit Font
    // =========================================================================
    if (styleMode === "pixel") {
      // Offscreen canvas to sample text pixel raster
      const offscreen = document.createElement("canvas");
      const scaleDown = 1 / pixelSize;
      const offWidth = Math.ceil(logicalWidth * scaleDown);
      const offHeight = Math.ceil(logicalHeight * scaleDown);
      offscreen.width = offWidth;
      offscreen.height = offHeight;

      const offCtx = offscreen.getContext("2d");
      if (offCtx) {
        offCtx.fillStyle = "#ffffff";
        offCtx.textAlign = "center";
        offCtx.textBaseline = "middle";
        const offFontSize = Math.max(12, Math.round(fontSize * scaleDown));
        offCtx.font = `bold ${offFontSize}px ${fontFamily}`;

        // Slant transformation on offscreen if requested
        if (slantAngle !== 0) {
          const rad = (slantAngle * Math.PI) / 180;
          offCtx.setTransform(1, 0, Math.tan(rad), 1, 0, 0);
        }

        // Draw each line centered on the offscreen canvas
        const offLineHeight = offFontSize * 1.2;
        const offTotalHeight = lines.length * offLineHeight;
        const offStartY = (offHeight - offTotalHeight) / 2 + offLineHeight / 2;

        lines.forEach((line, index) => {
          const y = offStartY + index * offLineHeight;
          offCtx.fillText(line, offWidth / 2, y);
        });

        // Read pixels and map to stylized blocks on the main canvas
        const imgData = offCtx.getImageData(0, 0, offWidth, offHeight);
        const data = imgData.data;

        ctx.fillStyle = textColor;
        ctx.shadowColor = textColor;
        ctx.shadowBlur = 8;

        const dotSize = Math.max(2, pixelSize - 1.5);
        const xOffset = (logicalWidth - offWidth * pixelSize) / 2;
        const yOffset = (logicalHeight - offHeight * pixelSize) / 2;

        for (let py = 0; py < offHeight; py++) {
          for (let px = 0; px < offWidth; px++) {
            const idx = (py * offWidth + px) * 4;
            const alpha = data[idx + 3];

            if (alpha > 80) {
              const drawX = xOffset + px * pixelSize;
              const drawY = yOffset + py * pixelSize;

              if (pixelShape === "circle") {
                ctx.beginPath();
                ctx.arc(
                  drawX + dotSize / 2,
                  drawY + dotSize / 2,
                  dotSize / 2,
                  0,
                  Math.PI * 2
                );
                ctx.fill();
              } else {
                ctx.fillRect(drawX, drawY, dotSize, dotSize);
              }
            }
          }
        }
        ctx.shadowBlur = 0;
      }
      return;
    }

    // =========================================================================
    // SHARED SETUP FOR VECTOR MODES (Neon, Bauhaus, Glitch, Parametric)
    // =========================================================================
    ctx.save();

    // Apply shear/slant transformation around center if slantAngle is non-zero
    if (slantAngle !== 0) {
      const rad = (slantAngle * Math.PI) / 180;
      ctx.translate(centerX, centerY);
      ctx.transform(1, 0, Math.tan(rad), 1, 0, 0);
      ctx.translate(-centerX, -centerY);
    }

    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "middle";

    // Helper: draw text with custom letter-spacing centered horizontally
    const drawCenteredSpacedText = (
      text: string,
      y: number,
      drawFn: (char: string, charX: number, charY: number) => void
    ) => {
      if (text.length === 0) return;
      const chars = Array.from(text);

      // Measure character widths to calculate total spaced width
      const charWidths = chars.map((ch) => ctx.measureText(ch).width);
      const totalWidth =
        charWidths.reduce((sum, w) => sum + w, 0) +
        (chars.length - 1) * letterSpacing;

      let currentX = centerX - totalWidth / 2;

      chars.forEach((ch, idx) => {
        const w = charWidths[idx];
        const charCenterX = currentX + w / 2;
        drawFn(ch, charCenterX, y);
        currentX += w + letterSpacing;
      });
    };

    const startY = (logicalHeight - totalBlockHeight) / 2 + lineHeight / 2;

    // =========================================================================
    // STYLE MODE 2: Neon Glow & Wireframe
    // =========================================================================
    if (styleMode === "neon") {
      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;

        drawCenteredSpacedText(line, y, (ch, x, cy) => {
          ctx.textAlign = "center";

          // Pass 1: Diffuse soft glow
          ctx.save();
          ctx.shadowColor = textColor;
          ctx.shadowBlur = 24;
          ctx.strokeStyle = textColor;
          ctx.lineWidth = 8;
          ctx.globalAlpha = 0.5;
          ctx.strokeText(ch, x, cy);
          ctx.restore();

          // Pass 2: Vivid outer neon stroke
          ctx.save();
          ctx.shadowColor = textColor;
          ctx.shadowBlur = 12;
          ctx.strokeStyle = textColor;
          ctx.lineWidth = 4;
          ctx.strokeText(ch, x, cy);
          ctx.restore();

          // Pass 3: Bright white core line
          ctx.save();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.strokeText(ch, x, cy);
          ctx.restore();
        });
      });
    }

    // =========================================================================
    // STYLE MODE 3: Bauhaus Geometric Block Extrusion
    // =========================================================================
    else if (styleMode === "bauhaus") {
      const shadowSteps = 10;
      const stepOffset = 1.4;

      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;

        drawCenteredSpacedText(line, y, (ch, x, cy) => {
          ctx.textAlign = "center";

          // 3D Isometric Extrusion block in accent color
          ctx.fillStyle = accentColor;
          for (let step = shadowSteps; step >= 1; step--) {
            const offsetX = step * stepOffset;
            const offsetY = step * stepOffset;
            ctx.fillText(ch, x + offsetX, cy + offsetY);
          }

          // Sharp border outline on the extrusion
          ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
          ctx.lineWidth = 2;
          ctx.strokeText(
            ch,
            x + shadowSteps * stepOffset,
            cy + shadowSteps * stepOffset
          );

          // Top face: High-contrast primary fill
          ctx.fillStyle = textColor;
          ctx.fillText(ch, x, cy);

          // Top face outline
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2.5;
          ctx.strokeText(ch, x, cy);
        });
      });

      // Geometric accent underline
      ctx.fillStyle = accentColor;
      ctx.fillRect(centerX - 90, centerY + totalBlockHeight / 2 + 15, 180, 4);
    }

    // =========================================================================
    // STYLE MODE 4: Cyber Glitch / Chromatic Aberration
    // =========================================================================
    else if (styleMode === "glitch") {
      const glitchOffset = 4;

      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;

        drawCenteredSpacedText(line, y, (ch, x, cy) => {
          ctx.textAlign = "center";

          // Red channel split (shifted left)
          ctx.save();
          ctx.fillStyle = accentColor; // red/pink
          ctx.globalAlpha = 0.85;
          ctx.fillText(ch, x - glitchOffset, cy);
          ctx.restore();

          // Cyan channel split (shifted right)
          ctx.save();
          ctx.fillStyle = textColor; // cyan/mint
          ctx.globalAlpha = 0.85;
          ctx.fillText(ch, x + glitchOffset, cy);
          ctx.restore();

          // Core crisp white text
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.fillText(ch, x, cy);
          ctx.restore();
        });
      });

      // Procedural scanline slices
      ctx.fillStyle = bgColor;
      const numSlices = 4;
      for (let i = 0; i < numSlices; i++) {
        const sliceY =
          centerY -
          totalBlockHeight / 2 +
          Math.sin(i * 1.5 + Date.now() * 0.001) * (totalBlockHeight / 2);
        ctx.fillRect(0, sliceY, logicalWidth, 2);
      }
    }

    // =========================================================================
    // STYLE MODE 5: Parametric Typographic Customizer
    // =========================================================================
    else if (styleMode === "parametric") {
      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;

        drawCenteredSpacedText(line, y, (ch, x, cy) => {
          ctx.textAlign = "center";

          // Drop shadow
          ctx.save();
          ctx.fillStyle = accentColor;
          ctx.fillText(ch, x + 4, cy + 4);
          ctx.restore();

          // Main fill
          ctx.save();
          ctx.fillStyle = textColor;
          ctx.fillText(ch, x, cy);
          ctx.restore();

          // Contrast contour stroke
          ctx.save();
          ctx.strokeStyle = bgColor;
          ctx.lineWidth = 2;
          ctx.strokeText(ch, x, cy);
          ctx.restore();
        });
      });
    }

    ctx.restore();
  }, [
    content,
    styleMode,
    fontSize,
    letterSpacing,
    slantAngle,
    textColor,
    bgColor,
    accentColor,
    pixelSize,
    pixelShape,
    fontFamily,
    showCenterGuides,
  ]);

  // Re-render when any dependency changes
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  /**
   * Randomize font style, parameters, and color palette
   */
  const handleRandomize = () => {
    const modes: FontStyleMode[] = [
      "pixel",
      "neon",
      "bauhaus",
      "glitch",
      "parametric",
    ];
    const newMode = modes[Math.floor(Math.random() * modes.length)];

    const randomPalette =
      PRESET_PALETTES[Math.floor(Math.random() * PRESET_PALETTES.length)];

    const randomSizes = [48, 56, 64, 72, 84, 96];
    const newSize =
      randomSizes[Math.floor(Math.random() * randomSizes.length)];

    const randomSpacing = Math.floor(Math.random() * 18);
    const randomSlant = (Math.floor(Math.random() * 5) - 2) * 6; // -12, -6, 0, 6, 12

    setStyleMode(newMode);
    setTextColor(randomPalette.text);
    setBgColor(randomPalette.bg);
    setAccentColor(randomPalette.accent);
    setFontSize(newSize);
    setLetterSpacing(randomSpacing);
    setSlantAngle(randomSlant);
    setPixelShape(Math.random() > 0.5 ? "circle" : "square");
    setPixelSize(Math.floor(4 + Math.random() * 4));
  };

  /**
   * Download the rendered canvas as high-resolution PNG
   */
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    const sanitizedName = content
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase()
      .slice(0, 16);
    link.download = `custom-font-${sanitizedName || "canvas"}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className={styles.container}>
      {/* Top Header Navigation */}
      <header className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.backButton}>
            ← Back to prototypes
          </Link>
          <div className={styles.titleArea}>
            <h1 className={styles.prototypeTitle}>Custom Font Canvas</h1>
            <p className={styles.prototypeSubtitle}>
              Interactive Centered Typography & Generative Font Studio
            </p>
          </div>
        </div>

        <div className={styles.headerStats}>
          <span className={styles.statusBadge}>CANVAS 2D • 800×500</span>
          <span className={styles.statusBadge}>MODE: {styleMode.toUpperCase()}</span>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className={styles.mainWorkspace}>
        {/* Left: Interactive Canvas Card */}
        <section className={styles.canvasCard}>
          <div className={styles.canvasToolbar}>
            <div className={styles.canvasInfo}>
              <span className={styles.centerIndicatorDot} />
              <span>Center Alignment: Exact (cx: 400, cy: 250)</span>
            </div>

            <div className={styles.canvasActions}>
              <button
                type="button"
                className={styles.iconActionButton}
                onClick={() => setShowCenterGuides((prev) => !prev)}
                title="Toggle centering guide crosshairs"
              >
                {showCenterGuides ? "Hide Guides" : "Show Guides"}
              </button>
            </div>
          </div>

          <div className={styles.canvasWrapper}>
            <canvas ref={canvasRef} className={styles.canvasElement} />
          </div>
        </section>

        {/* Right: Controls Panel */}
        <aside className={styles.controlsPanel}>
          <h2 className={styles.controlsHeading}>
            <span>Font Generator</span>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>v1.0</span>
          </h2>

          {/* Content Input */}
          <div className={styles.controlField}>
            <label className={styles.fieldLabel} htmlFor="contentInput">
              <span>Text Content</span>
              <span className={styles.fieldValue}>{content.length} chars</span>
            </label>
            <input
              id="contentInput"
              type="text"
              className={styles.textInput}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type any content here..."
            />
            {/* Quick preset chips */}
            <div className={styles.presetChipsRow}>
              {PRESET_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  className={styles.chipButton}
                  onClick={() => setContent(phrase)}
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

          {/* Font Style Mode */}
          <div className={styles.controlField}>
            <label className={styles.fieldLabel} htmlFor="styleSelect">
              <span>Font Generation Style</span>
            </label>
            <select
              id="styleSelect"
              className={styles.selectInput}
              value={styleMode}
              onChange={(e) => setStyleMode(e.target.value as FontStyleMode)}
            >
              <option value="pixel">Pixel Matrix / 8-Bit</option>
              <option value="neon">Neon Wireframe & Glow</option>
              <option value="bauhaus">Bauhaus Geometric 3D</option>
              <option value="glitch">Cyber Glitch & Aberration</option>
              <option value="parametric">Parametric Typographic</option>
            </select>
          </div>

          {/* Font Family (for vector & parametric) */}
          <div className={styles.controlField}>
            <label className={styles.fieldLabel} htmlFor="fontFamilySelect">
              <span>Base Letterform</span>
            </label>
            <select
              id="fontFamilySelect"
              className={styles.selectInput}
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
            >
              <option value="Space Grotesk, sans-serif">Space Grotesk (Modern)</option>
              <option value="JetBrains Mono, monospace">JetBrains Mono (Code)</option>
              <option value="Impact, sans-serif">Impact (Heavy Block)</option>
              <option value="Georgia, serif">Georgia (Classic Serif)</option>
              <option value="Courier New, monospace">Courier (Typewriter)</option>
            </select>
          </div>

          {/* Pixel specific options */}
          {styleMode === "pixel" && (
            <div className={styles.controlField}>
              <label className={styles.fieldLabel}>
                <span>Pixel Density & Shape</span>
                <span className={styles.fieldValue}>{pixelSize}px ({pixelShape})</span>
              </label>
              <input
                type="range"
                className={styles.rangeSlider}
                min="3"
                max="10"
                step="1"
                value={pixelSize}
                onChange={(e) => setPixelSize(Number(e.target.value))}
              />
              <div className={styles.presetChipsRow}>
                <button
                  type="button"
                  className={styles.chipButton}
                  onClick={() => setPixelShape("square")}
                  style={{
                    borderColor: pixelShape === "square" ? "#38bdf8" : undefined,
                  }}
                >
                  Square Pixels
                </button>
                <button
                  type="button"
                  className={styles.chipButton}
                  onClick={() => setPixelShape("circle")}
                  style={{
                    borderColor: pixelShape === "circle" ? "#38bdf8" : undefined,
                  }}
                >
                  Dot Matrix
                </button>
              </div>
            </div>
          )}

          {/* Font Size Slider */}
          <div className={styles.controlField}>
            <label className={styles.fieldLabel}>
              <span>Font Size</span>
              <span className={styles.fieldValue}>{fontSize}px</span>
            </label>
            <input
              type="range"
              className={styles.rangeSlider}
              min="24"
              max="110"
              step="2"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </div>

          {/* Letter Spacing Slider */}
          <div className={styles.controlField}>
            <label className={styles.fieldLabel}>
              <span>Letter Spacing</span>
              <span className={styles.fieldValue}>{letterSpacing}px</span>
            </label>
            <input
              type="range"
              className={styles.rangeSlider}
              min="-2"
              max="32"
              step="1"
              value={letterSpacing}
              onChange={(e) => setLetterSpacing(Number(e.target.value))}
            />
          </div>

          {/* Slant Angle Slider */}
          <div className={styles.controlField}>
            <label className={styles.fieldLabel}>
              <span>Slant / Shear</span>
              <span className={styles.fieldValue}>{slantAngle}°</span>
            </label>
            <input
              type="range"
              className={styles.rangeSlider}
              min="-24"
              max="24"
              step="2"
              value={slantAngle}
              onChange={(e) => setSlantAngle(Number(e.target.value))}
            />
          </div>

          {/* Colors */}
          <div className={styles.colorPickerRow}>
            <div className={styles.colorPickerBox}>
              <label className={styles.fieldLabel}>Text Color</label>
              <div className={styles.colorPickerControl}>
                <input
                  type="color"
                  className={styles.nativeColorInput}
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
                <span className={styles.colorHexText}>{textColor}</span>
              </div>
            </div>

            <div className={styles.colorPickerBox}>
              <label className={styles.fieldLabel}>Background</label>
              <div className={styles.colorPickerControl}>
                <input
                  type="color"
                  className={styles.nativeColorInput}
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                />
                <span className={styles.colorHexText}>{bgColor}</span>
              </div>
            </div>
          </div>

          {/* Palette presets */}
          <div className={styles.controlField}>
            <label className={styles.fieldLabel}>Palette Presets</label>
            <div className={styles.paletteRow}>
              {PRESET_PALETTES.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className={styles.paletteSwatch}
                  style={{
                    background: `linear-gradient(135deg, ${p.text} 50%, ${p.bg} 50%)`,
                  }}
                  title={p.name}
                  onClick={() => {
                    setTextColor(p.text);
                    setBgColor(p.bg);
                    setAccentColor(p.accent);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.buttonStack}>
            <button
              type="button"
              className={styles.randomizeButton}
              onClick={handleRandomize}
            >
              <span>🎲</span>
              <span>Generate Random Font Style</span>
            </button>

            <button
              type="button"
              className={styles.exportButton}
              onClick={handleDownload}
            >
              <span>💾</span>
              <span>Download PNG Image</span>
            </button>
          </div>

          {/* Educational Note */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>
              <span>💡</span>
              <span>How Centering Works</span>
            </div>
            <p className={styles.infoCardText}>
              The text bounding box is measured in real-time. The center
              origin `(400, 250)` anchors multi-line spans, tracking offsets,
              and raster matrix coordinates so any length of text remains
              optically centered on the canvas.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
