"use client";

/**
 * ==============================================================================
 * WorldGlobe - Interactive Three.js 3D Earth Meteorological Station
 * ------------------------------------------------------------------------------
 * Features:
 * 1. Hardware-accelerated 3D WebGL sphere with procedural dark landmass matrix.
 * 2. Real-time inertia drag rotation, zoom clamping, and smooth auto-rotation.
 * 3. 3D Spherical Coordinate mapping (lat/lon to 3D Cartesian vectors).
 * 4. Interactive raycasting on city beacons with hover glow & tooltips.
 * 5. Smooth camera refocus animation to selected cities.
 * 6. Instant real-time Open-Meteo weather fetch integration upon clicking a city.
 * ==============================================================================
 */

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import type { CityLocation } from "./page";
import styles from "./styles.module.css";

interface WorldGlobeProps {
  cities: CityLocation[];
  selectedCity: CityLocation;
  onSelectCity: (city: CityLocation) => void;
  tempUnit: "metric" | "imperial";
  activeWeather?: {
    conditionTitle: string;
    tempC: number;
    wmoCode: number;
    iconType: string;
  } | null;
}

// Convert GPS (latitude, longitude) to 3D Cartesian coordinates on sphere
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

// Generate an offline procedural dark world map texture with glowing dot grid
function createProceduralWorldTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Deep obsidian oceanic background
  ctx.fillStyle = "#12141a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle graticule grid lines (Latitude & Longitude)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += canvas.width / 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += canvas.height / 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw stylized continent landmasses using vector coordinates (equirectangular projection)
  ctx.fillStyle = "rgba(45, 52, 64, 0.65)";
  ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
  ctx.lineWidth = 2;

  const continents = [
    // North America
    [
      [150, 100], [250, 90], [380, 140], [420, 220], [370, 310], [320, 340], [280, 420],
      [240, 480], [210, 410], [170, 350], [130, 280], [100, 180]
    ],
    // South America
    [
      [280, 480], [350, 520], [410, 560], [400, 680], [360, 800], [320, 890],
      [280, 840], [260, 690], [240, 550]
    ],
    // Europe
    [
      [950, 140], [1080, 130], [1180, 180], [1150, 280], [1060, 320], [980, 310],
      [930, 250], [910, 180]
    ],
    // Africa
    [
      [960, 350], [1090, 340], [1190, 420], [1220, 540], [1180, 690], [1100, 800],
      [1040, 780], [980, 640], [920, 500], [910, 390]
    ],
    // Asia
    [
      [1180, 140], [1450, 120], [1700, 180], [1780, 290], [1650, 390], [1520, 450],
      [1410, 490], [1320, 430], [1260, 350], [1180, 280]
    ],
    // Australia
    [
      [1620, 640], [1740, 620], [1820, 680], [1800, 780], [1720, 830], [1610, 790], [1590, 700]
    ]
  ];

  continents.forEach((poly) => {
    ctx.beginPath();
    poly.forEach(([px, py], idx) => {
      // Scale from 2000x1000 domain
      const sx = (px / 2000) * canvas.width;
      const sy = (py / 1000) * canvas.height;
      if (idx === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // Luminous dot matrix across landmasses
  ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
  for (let x = 20; x < canvas.width; x += 16) {
    for (let y = 20; y < canvas.height; y += 16) {
      if (ctx.isPointInPath(x, y)) {
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function WorldGlobe({
  cities,
  selectedCity,
  onSelectCity,
  tempUnit,
  activeWeather,
}: WorldGlobeProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredCity, setHoveredCity] = useState<CityLocation | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [mapLayer, setMapLayer] = useState<"satellite" | "radar" | "temperature">("satellite");

  // References to preserve Three.js objects across renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const reqAnimRef = useRef<number | null>(null);

  // Drag & interaction state
  const isDraggingRef = useRef(false);
  const previousMousePosRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const autoRotateRef = useRef(true);

  // Raycasting for click & hover
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseCoordsRef = useRef(new THREE.Vector2());

  // Radius of the 3D Globe
  const GLOBE_RADIUS = 4.2;

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 11.5);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Globe Group (rotates on drag & animation)
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 4. Base Globe Sphere with Procedural Map Texture
    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const worldTexture = createProceduralWorldTexture();
    const globeMat = new THREE.MeshStandardMaterial({
      map: worldTexture,
      roughness: 0.8,
      metalness: 0.1,
      color: 0xffffff,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // 5. Atmospheric Outer Glow Sphere
    const atmosphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.05, 48, 48);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.22, 0.74, 0.97, 1.0) * intensity * 0.85;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    globeGroup.add(atmosphereMesh);

    // 6. Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
    dirLight.position.set(12, 10, 15);
    scene.add(dirLight);

    const blueRimLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
    blueRimLight.position.set(-15, -8, -10);
    scene.add(blueRimLight);

    // 7. City Markers Group
    const markersGroup = new THREE.Group();
    globeGroup.add(markersGroup);
    markersGroupRef.current = markersGroup;

    // Animation Loop
    let lastTime = performance.now();
    const animate = () => {
      reqAnimRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Inertia drag rotation
      if (!isDraggingRef.current && autoRotateRef.current) {
        targetRotationRef.current.y += 0.0018;
      }

      globeGroup.rotation.y += (targetRotationRef.current.y - globeGroup.rotation.y) * 0.08;
      globeGroup.rotation.x += (targetRotationRef.current.x - globeGroup.rotation.x) * 0.08;

      // Pulse city beacon rings & animate radar halos
      markersGroup.children.forEach((markerObj) => {
        const ring = markerObj.getObjectByName("pulseRing");
        if (ring) {
          ring.scale.x = 1 + Math.sin(now * 0.004) * 0.25;
          ring.scale.y = 1 + Math.sin(now * 0.004) * 0.25;
        }
        const radar = markerObj.getObjectByName("radarHalo");
        if (radar && radar instanceof THREE.Mesh) {
          const t = ((now * 0.0012) % 1);
          radar.scale.set(1 + t * 2.2, 1 + t * 2.2, 1);
          const mat = radar.material as THREE.MeshBasicMaterial;
          if (mat) {
            mat.opacity = (1 - t) * 0.7;
          }
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
      worldTexture.dispose();
    };
  }, []);

  // Populate Interactive City Beacons with dynamic layer styles
  useEffect(() => {
    const markersGroup = markersGroupRef.current;
    if (!markersGroup) return;

    // Clear old markers
    while (markersGroup.children.length > 0) {
      const child = markersGroup.children[0];
      markersGroup.remove(child);
    }

    cities.forEach((city) => {
      const isSelected = city.name.toLowerCase() === selectedCity.name.toLowerCase();
      const pos = latLonToVector3(city.lat, city.lon, GLOBE_RADIUS);

      const cityMarker = new THREE.Group();
      cityMarker.position.copy(pos);
      cityMarker.lookAt(new THREE.Vector3(0, 0, 0));
      cityMarker.userData = { city };

      // Determine color palette based on layer
      let baseColor = 0xf59e0b; // Amber default
      if (mapLayer === "radar") {
        baseColor = 0x06b6d4; // Cyan Doppler radar
      } else if (mapLayer === "temperature") {
        const absLat = Math.abs(city.lat);
        if (absLat < 25) {
          baseColor = 0xf97316; // Warm tropical coral
        } else if (absLat < 48) {
          baseColor = 0x10b981; // Temperate emerald
        } else {
          baseColor = 0x38bdf8; // Polar icy blue
        }
      }

      // Inner glowing core sphere
      const coreGeo = new THREE.SphereGeometry(isSelected ? 0.12 : 0.08, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xffffff : baseColor,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.userData = { city };
      cityMarker.add(coreMesh);

      // Outer glowing ring
      const ringGeo = new THREE.RingGeometry(0.12, 0.2, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: baseColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.95 : 0.65,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.name = "pulseRing";
      ringMesh.userData = { city };
      cityMarker.add(ringMesh);

      // Radar precipitation halo for radar layer
      if (mapLayer === "radar") {
        const radarGeo = new THREE.RingGeometry(0.22, 0.45, 24);
        const radarMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5,
        });
        const radarMesh = new THREE.Mesh(radarGeo, radarMat);
        radarMesh.name = "radarHalo";
        radarMesh.userData = { city };
        cityMarker.add(radarMesh);
      }

      // Light ray / beacon line projecting from the city
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -0.45),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0xffffff : baseColor,
        transparent: true,
        opacity: isSelected ? 0.95 : 0.55,
      });
      const lineMesh = new THREE.Line(lineGeo, lineMat);
      cityMarker.add(lineMesh);

      markersGroup.add(cityMarker);
    });
  }, [cities, selectedCity, mapLayer]);

  // Rotate Globe to center on a target city
  const rotateToCity = useCallback((city: CityLocation) => {
    autoRotateRef.current = false;
    const phi = (city.lat * Math.PI) / 180;
    const theta = ((city.lon + 90) * Math.PI) / 180;

    targetRotationRef.current = {
      x: phi * 0.6,
      y: -theta,
    };
  }, []);

  // Refocus when selected city changes
  useEffect(() => {
    rotateToCity(selectedCity);
  }, [selectedCity, rotateToCity]);

  // ---------------------------------------------------------------------------
  // Mouse & Touch Interaction Handlers (Drag, Zoom, Click)
  // ---------------------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    autoRotateRef.current = false;
    previousMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !markersGroupRef.current) return;

    // 1. Drag rotation
    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePosRef.current.x;
      const deltaY = e.clientY - previousMousePosRef.current.y;

      targetRotationRef.current.y += deltaX * 0.005;
      targetRotationRef.current.x += deltaY * 0.005;

      // Clamp vertical tilt
      targetRotationRef.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetRotationRef.current.x));

      previousMousePosRef.current = { x: e.clientX, y: e.clientY };
    }

    // 2. Raycast hover over city markers
    const rect = container.getBoundingClientRect();
    mouseCoordsRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseCoordsRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseCoordsRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(markersGroupRef.current.children, true);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      const city = hitObj.userData?.city as CityLocation | undefined;
      if (city) {
        setHoveredCity(city);
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        container.style.cursor = "pointer";
        return;
      }
    }

    setHoveredCity(null);
    container.style.cursor = isDraggingRef.current ? "grabbing" : "grab";
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !markersGroupRef.current) {
      isDraggingRef.current = false;
      return;
    }

    // Check if this was a click on a city (not a long drag)
    const rect = container.getBoundingClientRect();
    mouseCoordsRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseCoordsRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseCoordsRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(markersGroupRef.current.children, true);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      const clickedCity = hitObj.userData?.city as CityLocation | undefined;
      if (clickedCity) {
        onSelectCity(clickedCity);
        rotateToCity(clickedCity);
      }
    }

    isDraggingRef.current = false;
  };

  // Zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!cameraRef.current) return;
    const newZ = cameraRef.current.position.z + e.deltaY * 0.008;
    cameraRef.current.position.z = Math.max(7.5, Math.min(18.0, newZ));
  };

  return (
    <div className={styles.globeStageWrap}>
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className={styles.globeCanvasContainer}
      />

      {/* Interactive Map Layer Switcher */}
      <div className={styles.globeLayerSwitcher}>
        <button
          type="button"
          onClick={() => setMapLayer("satellite")}
          className={`${styles.globeLayerBtn} ${mapLayer === "satellite" ? styles.globeLayerBtnActive : ""}`}
          title="Satellite Obsidian View"
        >
          🛰️ Satellite
        </button>
        <button
          type="button"
          onClick={() => setMapLayer("radar")}
          className={`${styles.globeLayerBtn} ${mapLayer === "radar" ? styles.globeLayerBtnActive : ""}`}
          title="Precipitation Doppler Radar Halos"
        >
          🌧️ Radar
        </button>
        <button
          type="button"
          onClick={() => setMapLayer("temperature")}
          className={`${styles.globeLayerBtn} ${mapLayer === "temperature" ? styles.globeLayerBtnActive : ""}`}
          title="Thermal Climate Gradient"
        >
          🌡️ Thermal
        </button>
      </div>

      {/* Hover City Tooltip */}
      {hoveredCity && tooltipPos && (
        <div
          className={styles.globeTooltip}
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 15}px`,
          }}
        >
          <div className={styles.globeTooltipCity}>
            <span>{hoveredCity.name}</span>
            {hoveredCity.countryCode && <span className={styles.globeTooltipBadge}>{hoveredCity.countryCode}</span>}
          </div>
          <div className={styles.globeTooltipSub}>
            {hoveredCity.country}
            {hoveredCity.name.toLowerCase() === selectedCity.name.toLowerCase() && activeWeather
              ? ` • ${Math.round(tempUnit === "imperial" ? (activeWeather.tempC * 9) / 5 + 32 : activeWeather.tempC)}° ${activeWeather.conditionTitle}`
              : " • Click to fetch live weather"}
          </div>
        </div>
      )}

      {/* Atmospheric Controls Overlay Card */}
      <div className={styles.globeInstructionsBar}>
        <div className={styles.globeInstructionItem}>
          <span className={styles.instructionIcon}>🖱️</span>
          <span>Drag to spin Earth in 3D</span>
        </div>
        <div className={styles.globeInstructionItem}>
          <span className={styles.instructionIcon}>🔍</span>
          <span>Scroll to zoom</span>
        </div>
        <div className={styles.globeInstructionItem}>
          <span className={styles.instructionIcon}>📍</span>
          <span>Click any beacon to fetch real-time weather</span>
        </div>
      </div>
    </div>
  );
}
