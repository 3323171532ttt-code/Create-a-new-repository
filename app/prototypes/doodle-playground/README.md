# 3D Doodle Studio Prototype

An interactive 3D spatial drawing and sculptural prototype built with **Three.js** and **WebGL**. This prototype allows users to sketch fluid neon ribbons directly in 3D coordinate space, switch dynamic ribbon geometries, and freely orbit around the created sculptures.

## Features

- **3D Spatial Drawing**:
  - Continuous point tracking mapped into 3D world space using camera raycasting and depth planes.
  - Smooth curvature generated via **Catmull-Rom Spline** interpolation.
- **Dynamic Ribbon Geometries**:
  - **Flat Strip**: Planar camera-aligned parametric ribbon.
  - **Helix Twist**: Helical geometry twisting along the curve tangent.
  - **Crystal Prism**: Sharp faceted 3D polygonal extrusion.
  - **Glow Tube**: Volumetric tubular geometry with emissive core.
- **Interactive Modes**:
  - **Draw Mode**: Click and drag to create spatial ribbons.
  - **Inspect Mode**: 360° orbit, zoom, and pan controls.
- **Neon Color Palette**:
  - Cyber Cyan, Electric Magenta, Acid Lime, Solar Amber, Plasma Violet, and Prism Rainbow.

## How to Run

From the root of this repository:

```bash
npm run dev
```

Navigate to [http://localhost:3000/prototypes/doodle-playground](http://localhost:3000/prototypes/doodle-playground).

## How the 3D Drawing Math Works

1. **Raycasting into 3D Space**:
   When the pointer moves, screen coordinates $(x, y)$ are unprojected into the camera frustum at a fixed draw distance:
   ```javascript
   const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
   vector.unproject(camera);
   const dir = vector.sub(camera.position).normalize();
   const worldPoint = camera.position.clone().add(dir.multiplyScalar(drawDistance));
   ```
2. **Curve Interpolation**:
   Points are sampled into a `THREE.CatmullRomCurve3` to generate smooth, continuous trajectory segments without sharp angular kinks.
3. **Frenet-Serret Frame**:
   Normal and binormal vectors along the curve tangent dictate the spatial vertex displacement for strips, tubes, and prisms.
