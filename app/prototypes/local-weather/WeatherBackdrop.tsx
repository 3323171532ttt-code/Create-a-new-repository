"use client";

/**
 * ==============================================================================
 * WeatherBackdrop - Dynamic Ambient Weather Canvas Animations
 * ------------------------------------------------------------------------------
 * Renders atmospheric visual effects based on live weather condition:
 * - Rain / Drizzle: Smooth falling angled rain streaks with ripple splash rings.
 * - Thunderstorm: Dark atmospheric haze, rain streaks, and dynamic lightning flashes.
 * - Clear / Sunny: Soft radiant sunbeams and gentle floating golden dust motes.
 * - Snow: Tumbling crystalline snowflakes with subtle depth and drift.
 * - Clouds / Fog: Layered horizontal drifting volumetric mist bands.
 * ==============================================================================
 */

import { useEffect, useRef } from "react";
import styles from "./styles.module.css";

interface WeatherBackdropProps {
  iconType: "storm" | "sun" | "rain" | "snow" | "cloud";
  isDay: boolean;
  enabled: boolean;
}

export function WeatherBackdrop({ iconType, isDay, enabled }: WeatherBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle pools
    const rainDrops: { x: number; y: number; length: number; speed: number; opacity: number }[] = [];
    const splashes: { x: number; y: number; r: number; maxR: number; opacity: number }[] = [];
    const snowFlakes: { x: number; y: number; radius: number; speedY: number; speedX: number; opacity: number }[] = [];
    const sunRays: { angle: number; speed: number; width: number; opacity: number }[] = [];
    const sunMotes: { x: number; y: number; radius: number; speedY: number; speedX: number; opacity: number }[] = [];
    const mistClouds: { x: number; y: number; r: number; speedX: number; opacity: number }[] = [];

    // Initialize Rain
    for (let i = 0; i < 90; i++) {
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 12 + Math.random() * 18,
        speed: 14 + Math.random() * 10,
        opacity: 0.15 + Math.random() * 0.35,
      });
    }

    // Initialize Snow
    for (let i = 0; i < 65; i++) {
      snowFlakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1.2 + Math.random() * 2.8,
        speedY: 0.6 + Math.random() * 1.4,
        speedX: (Math.random() - 0.5) * 0.8,
        opacity: 0.2 + Math.random() * 0.55,
      });
    }

    // Initialize Sunbeams & motes
    for (let i = 0; i < 6; i++) {
      sunRays.push({
        angle: (i * Math.PI) / 3,
        speed: 0.0008 + (i % 2 === 0 ? 0.0004 : -0.0004),
        width: 0.18 + Math.random() * 0.12,
        opacity: 0.08 + Math.random() * 0.08,
      });
    }
    for (let i = 0; i < 35; i++) {
      sunMotes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.8 + Math.random() * 1.8,
        speedY: -0.2 - Math.random() * 0.5,
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: 0.15 + Math.random() * 0.45,
      });
    }

    // Initialize Mist
    for (let i = 0; i < 18; i++) {
      mistClouds.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.8,
        r: 120 + Math.random() * 180,
        speedX: 0.15 + Math.random() * 0.3,
        opacity: 0.04 + Math.random() * 0.06,
      });
    }

    // Lightning Flash state
    let lightningOpacity = 0;
    let nextLightningTime = performance.now() + 2500 + Math.random() * 4000;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // 1. Thunderstorm / Lightning
      if (iconType === "storm") {
        if (time > nextLightningTime) {
          lightningOpacity = 0.55 + Math.random() * 0.35;
          nextLightningTime = time + 3500 + Math.random() * 6500;
        }
        if (lightningOpacity > 0.01) {
          ctx.fillStyle = `rgba(245, 158, 11, ${lightningOpacity * 0.12})`;
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = `rgba(255, 255, 255, ${lightningOpacity * 0.08})`;
          ctx.fillRect(0, 0, width, height);
          lightningOpacity *= 0.84;
        }
      }

      // 2. Rain / Storm Precipitation Streaks
      if (iconType === "rain" || iconType === "storm") {
        ctx.strokeStyle = iconType === "storm" ? "rgba(245, 158, 11, 0.45)" : "rgba(56, 189, 248, 0.45)";
        ctx.lineWidth = 1.2;

        for (const drop of rainDrops) {
          drop.y += drop.speed;
          drop.x -= drop.speed * 0.18; // wind slant

          if (drop.y > height) {
            drop.y = -drop.length;
            drop.x = Math.random() * (width + 100);
            if (Math.random() > 0.7) {
              splashes.push({
                x: drop.x,
                y: height - 10 + Math.random() * 8,
                r: 1,
                maxR: 4 + Math.random() * 5,
                opacity: 0.4,
              });
            }
          }

          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - drop.length * 0.18, drop.y + drop.length);
          ctx.stroke();
        }

        // Render Splashes
        for (let i = splashes.length - 1; i >= 0; i--) {
          const sp = splashes[i];
          sp.r += 0.4;
          sp.opacity *= 0.88;
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, sp.r * 1.8, sp.r * 0.6, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(186, 230, 253, ${sp.opacity})`;
          ctx.stroke();
          if (sp.opacity <= 0.03 || sp.r >= sp.maxR) {
            splashes.splice(i, 1);
          }
        }
      }

      // 3. Snowflakes
      if (iconType === "snow") {
        ctx.fillStyle = "rgba(224, 242, 254, 0.85)";
        for (const flake of snowFlakes) {
          flake.y += flake.speedY;
          flake.x += flake.speedX + Math.sin(time * 0.0015 + flake.y * 0.01) * 0.4;

          if (flake.y > height) {
            flake.y = -flake.radius * 2;
            flake.x = Math.random() * width;
          }
          if (flake.x > width) flake.x = 0;
          else if (flake.x < 0) flake.x = width;

          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(224, 242, 254, ${flake.opacity})`;
          ctx.fill();
        }
      }

      // 4. Sunbeams & Golden Solar Motes
      if (iconType === "sun") {
        const sunCenterX = width * 0.5;
        const sunCenterY = height * 0.35;

        // Radiating soft atmospheric cones
        for (const ray of sunRays) {
          ray.angle += ray.speed;
          ctx.save();
          ctx.translate(sunCenterX, sunCenterY);
          ctx.rotate(ray.angle);
          const grad = ctx.createLinearGradient(0, 0, width * 0.8, 0);
          grad.addColorStop(0, `rgba(245, 158, 11, ${ray.opacity * (isDay ? 1 : 0.4)})`);
          grad.addColorStop(1, "rgba(245, 158, 11, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, width * 0.8, -ray.width, ray.width);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Drifting golden motes
        for (const mote of sunMotes) {
          mote.y += mote.speedY;
          mote.x += mote.speedX;
          if (mote.y < -10) {
            mote.y = height + 10;
            mote.x = Math.random() * width;
          }
          ctx.beginPath();
          ctx.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(253, 224, 71, ${mote.opacity * (isDay ? 1 : 0.5)})`;
          ctx.fill();
        }
      }

      // 5. Drifting Mist & Clouds
      if (iconType === "cloud") {
        for (const mist of mistClouds) {
          mist.x += mist.speedX;
          if (mist.x - mist.r > width) {
            mist.x = -mist.r;
            mist.y = Math.random() * height * 0.8;
          }
          const grad = ctx.createRadialGradient(mist.x, mist.y, 0, mist.x, mist.y, mist.r);
          grad.addColorStop(0, `rgba(148, 163, 184, ${mist.opacity})`);
          grad.addColorStop(1, "rgba(148, 163, 184, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(mist.x, mist.y, mist.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [iconType, isDay, enabled]);

  if (!enabled) return null;

  return <canvas ref={canvasRef} className={styles.ambientCanvasBackdrop} />;
}
