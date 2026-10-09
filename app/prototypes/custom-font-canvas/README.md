# Custom Font Canvas Prototype

An interactive generative typography prototype built for the "Prototyping for Masters" workshop. Users can enter any content, customize typography and algorithmic rendering parameters, and view the generated custom font centered on an HTML5 `<canvas>`.

## Features

- **Any Content Input**: Supports arbitrary text, alphanumeric characters, symbols, uppercase, lowercase, and multi-line breaks.
- **True Optical & Geometric Centering**:
  - Horizontal centering: calculates total width including custom letter-spacing (`startX = centerX - totalWidth / 2`).
  - Vertical centering: computes total block height across all line breaks (`startY = centerY - totalBlockHeight / 2 + lineHeight / 2`).
  - Retina / HiDPI crispness using `window.devicePixelRatio`.
- **5 Custom Font Generation Modes**:
  1. **Pixel Matrix / 8-Bit**: Procedural block/dot rasterization sampled via offscreen canvas.
  2. **Neon Wireframe & Glow**: Multi-pass glowing outline with diffuse luminescence and white core.
  3. **Bauhaus Geometric 3D**: Isometric extrusion drop-shadows with sharp contrast borders.
  4. **Cyber Glitch / Chromatic Aberration**: RGB channel splitting (cyan/red) and scanline slicing.
  5. **Parametric Typographic**: Live slant/shear transform, adjustable tracking, and drop shadows.
- **Randomize / Font Generator**: 1-click generator to explore unique combinations of styles, sizes, and color palettes.
- **PNG Export**: 1-click download of the canvas artwork.

## How to Run

From the root of the repository:

```bash
npm run dev
```

Navigate to [http://localhost:3000/prototypes/custom-font-canvas](http://localhost:3000/prototypes/custom-font-canvas) in your browser.

## Code Structure

- `page.tsx`: Contains the React client component with canvas lifecycle, offscreen raster sampling, centering mathematics, and interactive controls.
- `styles.module.css`: Scoped CSS Module providing a dark-mode studio interface adhering to workshop guidelines (no bare element selectors).
- `README.md`: This setup and educational guide.

## How Centering Math Works on HTML5 Canvas

When drawing text on a canvas, the default anchor is the top-left baseline. To center arbitrary text:

1. **Calculate the canvas center**:
   ```javascript
   const centerX = canvasWidth / 2;
   const centerY = canvasHeight / 2;
   ```
2. **Handle Multi-Line Height**:
   ```javascript
   const totalBlockHeight = lines.length * lineHeight;
   const startY = (canvasHeight - totalBlockHeight) / 2 + lineHeight / 2;
   ```
3. **Handle Custom Letter Spacing**:
   ```javascript
   const totalWidth = charWidths.reduce((sum, w) => sum + w, 0) + (chars.length - 1) * letterSpacing;
   const startX = centerX - totalWidth / 2;
   ```
