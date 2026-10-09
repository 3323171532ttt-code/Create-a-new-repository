# Typography Playground Prototype

An interactive craft and textile typography prototype that explores **"Words can have personalities too."** Built using authentic loom-woven fonts, Google Variable Fonts, procedural SVG turbulence filters, and real-time Web Audio API sound synthesis.

## Features

- **Living Woven Typography**:
  - Render custom sentences as living, reactive tactile objects.
  - Interactive hover and bounce dynamics on individual characters.
- **Variable Font & Loom Typographic Engines**:
  - **Jacquard 12 & 24**: Pixelated digital loom-woven letterforms.
  - **Fraunces Variable Font**: Parametric sliders for `WONK` (organic irregularity) and `SOFT` (rounded corner fluffiness).
- **Tactile Sound Synthesizer**:
  - Pure Web Audio API procedural synthesis playing soft woolly yarn plops, cartoon spring boings, and thread rustles.
- **SVG Micro-Texture Filters**:
  - `feTurbulence` & `feDisplacementMap` simulating the organic edge roughness of raw yarn fibers.
- **Pure Vanilla Implementation**:
  - Zero external libraries or heavy dependencies.

## How to Run

From the root of this repository:

```bash
npm run dev
```

Navigate to [http://localhost:3000/prototypes/typography-playground](http://localhost:3000/prototypes/typography-playground).

## How Variable Fonts Work

CSS Variable fonts allow continuous interpolation across custom design axes using `font-variation-settings`:

```css
.letter {
  font-family: 'Fraunces', serif;
  font-variation-settings: 'WONK' 1, 'SOFT' 100, 'wght' 700;
}
```

By adjusting these axes in real time via JavaScript, characters dynamically warp between sharp formal geometry and soft, tactile playful yarn objects.
