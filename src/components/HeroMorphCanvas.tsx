"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import styles from "./HeroMorphCanvas.module.css";

interface HeroMorphCanvasProps {
  className?: string;
  priority?: boolean;
}

interface TargetPoint {
  x: number;
  y: number;
  tone: number;
  scatter: number;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  seed: number;
  shimmer: number;
  size: number;
  logo: TargetPoint;
  portraits: TargetPoint[];
}

type Mode = "idle" | "explode" | "morph" | "hold" | "return";

interface SequenceState {
  mode: Mode;
  modeStartedAt: number;
  portraitIndex: number;
  cooldownUntil: number;
}

const LOGO_SRC = "/brand/logo-anecoica.png";
const PORTRAITS = [
  "/brand/portraits/lenin.png",
  "/brand/portraits/isabel.png",
  "/brand/portraits/aristoteles.png",
  "/brand/portraits/confucio.png",
] as const;

const PARTICLE_COUNT = 1900;
const LOGO_THRESHOLD = 15;
const PORTRAIT_THRESHOLD = 28;
const EXPLODE_MS = 820;
const MORPH_MS = 1150;
const HOLD_MS = 1200;
const RETURN_MS = 1100;
const MIN_PARTICLES = 1500;
const MAX_PARTICLES = 2600;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutSine(t: number) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function getPaletteColor(seed: number, glow = 0) {
  const hues = [209, 228, 268, 322, 22];
  const hue = hues[Math.floor(seed * hues.length) % hues.length] + glow * 12;
  const sat = 68 + glow * 14;
  const light = 53 + glow * 10;

  return `hsl(${hue} ${sat}% ${light}%)`;
}

function getAdaptiveParticleCount(width: number, height: number) {
  const estimated = Math.floor((width * height) / 115);
  return Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, estimated || PARTICLE_COUNT));
}

function fitContain(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  if (sourceRatio > targetRatio) {
    const width = targetWidth;
    const height = width / sourceRatio;
    return { width, height, x: 0, y: (targetHeight - height) / 2 };
  }

  const height = targetHeight;
  const width = height * sourceRatio;
  return { width, height, x: (targetWidth - width) / 2, y: 0 };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
  });
}

function sampleTargetPoints(
  image: HTMLImageElement,
  width: number,
  height: number,
  targetCount: number,
  alphaThreshold: number,
) {
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    return [] as TargetPoint[];
  }

  ctx.clearRect(0, 0, width, height);
  const fit = fitContain(image.naturalWidth, image.naturalHeight, width, height);
  ctx.drawImage(image, fit.x, fit.y, fit.width, fit.height);

  const data = ctx.getImageData(0, 0, width, height).data;
  const step = Math.max(2, Math.floor(Math.sqrt((width * height) / targetCount)));
  const points: TargetPoint[] = [];

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];

      if (alpha < alphaThreshold) {
        continue;
      }

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const tone = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;

      points.push({
        x: x - width / 2,
        y: y - height / 2,
        tone,
        scatter: Math.random(),
      });
    }
  }

  if (points.length === 0) {
    return [];
  }

  while (points.length < targetCount) {
    points.push(points[Math.floor(Math.random() * points.length)]);
  }

  if (points.length > targetCount) {
    for (let i = points.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const swap = points[i];
      points[i] = points[j];
      points[j] = swap;
    }

    points.length = targetCount;
  }

  return points;
}

export default function HeroMorphCanvas({ className, priority = false }: HeroMorphCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const logoTargetsRef = useRef<TargetPoint[]>([]);
  const portraitTargetsRef = useRef<TargetPoint[][]>([]);
  const sequenceRef = useRef<SequenceState>({
    mode: "idle",
    modeStartedAt: 0,
    portraitIndex: 0,
    cooldownUntil: 0,
  });
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const interactionRef = useRef(0);

  const [interactive] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    return supportsFinePointer && !prefersReducedMotion;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!interactive) {
      return;
    }

    let mounted = true;

    const setup = async () => {
      const [logoImage, ...portraitImages] = await Promise.all([
        loadImage(LOGO_SRC),
        ...PORTRAITS.map((src) => loadImage(src)),
      ]);

      if (!mounted || !wrapRef.current || !canvasRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return;
      }

      const createScene = () => {
        if (!wrapRef.current || !canvasRef.current) {
          return;
        }

        const bounds = wrapRef.current.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(380, Math.floor(bounds.width));
        const height = Math.max(240, Math.floor(bounds.height));

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        const particleCount = getAdaptiveParticleCount(width, height);

        const logoTargets = sampleTargetPoints(
          logoImage,
          Math.floor(width * 0.82),
          Math.floor(height * 0.82),
          particleCount,
          LOGO_THRESHOLD,
        );

        const portraitTargets = portraitImages.map((portrait) =>
          sampleTargetPoints(
              portrait,
              Math.floor(width * 0.74),
              Math.floor(height * 0.9),
              particleCount,
              PORTRAIT_THRESHOLD,
            ),
        );

        logoTargetsRef.current = logoTargets;
        portraitTargetsRef.current = portraitTargets;

        particlesRef.current = logoTargets.map((point, index) => ({
          x: point.x,
          y: point.y,
          z: 0,
          vx: 0,
          vy: 0,
          vz: 0,
          seed: Math.random(),
          shimmer: Math.random(),
          size: 1.65 + Math.random() * 2.4,
          logo: point,
          portraits: portraitTargets.map((targetSet) => targetSet[index % targetSet.length] ?? point),
        }));

        sequenceRef.current = {
          mode: "idle",
          modeStartedAt: performance.now(),
          portraitIndex: sequenceRef.current.portraitIndex,
          cooldownUntil: 0,
        };
      };

      createScene();
      setReady(true);

      const onResize = () => {
        createScene();
      };

      window.addEventListener("resize", onResize);

      const render = (time: number) => {
        const bounds = wrapRef.current?.getBoundingClientRect();

        if (!bounds) {
          return;
        }

        const width = bounds.width;
        const height = bounds.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const particles = particlesRef.current;

        const pointerX = pointerRef.current.x - centerX;
        const pointerY = pointerRef.current.y - centerY;
        const pointerRadius = Math.min(width, height) * 0.58;
        const pointerDistance = Math.hypot(pointerX, pointerY);
        const targetInteraction = pointerRef.current.active
          ? clamp01(1 - pointerDistance / pointerRadius)
          : 0;

        interactionRef.current = lerp(interactionRef.current, targetInteraction, 0.1);

        const sequence = sequenceRef.current;
        const modeElapsed = time - sequence.modeStartedAt;
        const modeProgress =
          sequence.mode === "explode"
            ? clamp01(modeElapsed / EXPLODE_MS)
            : sequence.mode === "morph"
              ? clamp01(modeElapsed / MORPH_MS)
              : sequence.mode === "hold"
                ? clamp01(modeElapsed / HOLD_MS)
                : sequence.mode === "return"
                  ? clamp01(modeElapsed / RETURN_MS)
                  : 0;

        if (sequence.mode === "idle" && interactionRef.current > 0.62 && time > sequence.cooldownUntil) {
          sequence.mode = "explode";
          sequence.modeStartedAt = time;
          sequence.portraitIndex = (sequence.portraitIndex + 1) % PORTRAITS.length;
        } else if (sequence.mode === "explode" && modeElapsed >= EXPLODE_MS) {
          sequence.mode = "morph";
          sequence.modeStartedAt = time;
        } else if (sequence.mode === "morph" && modeElapsed >= MORPH_MS) {
          sequence.mode = "hold";
          sequence.modeStartedAt = time;
        } else if (sequence.mode === "hold" && modeElapsed >= HOLD_MS) {
          sequence.mode = "return";
          sequence.modeStartedAt = time;
        } else if (sequence.mode === "return" && modeElapsed >= RETURN_MS) {
          sequence.mode = "idle";
          sequence.modeStartedAt = time;
          sequence.cooldownUntil = time + 900;
        }

        ctx.clearRect(0, 0, width, height);

        const ambientStrength = 0.3 + interactionRef.current * 0.45;
        const ambientRadius = Math.max(width, height) * 0.66;
        const ambientX = centerX + pointerX * 0.22;
        const ambientY = centerY + pointerY * 0.2;
        const glow = ctx.createRadialGradient(ambientX, ambientY, 0, ambientX, ambientY, ambientRadius);
        glow.addColorStop(0, `rgba(199, 125, 255, ${0.13 * ambientStrength})`);
        glow.addColorStop(0.45, `rgba(114, 171, 255, ${0.11 * ambientStrength})`);
        glow.addColorStop(1, "rgba(6, 9, 14, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i += 1) {
          const particle = particles[i];
          let targetX = particle.logo.x;
          let targetY = particle.logo.y;
          let targetZ = 0;
          let color = getPaletteColor(particle.seed, 0.05 + interactionRef.current * 0.2);

          const sway = Math.sin(time * 0.001 + particle.seed * 12) * 2.2;
          const wobble = Math.sin(time * 0.0016 + particle.shimmer * 22 + particle.y * 0.016) * 1.8;
          targetX += (pointerX / 60) * (0.6 - particle.seed * 0.4) + sway * interactionRef.current;
          targetY += (pointerY / 80) * (0.55 - particle.seed * 0.35) + wobble * interactionRef.current;

          if (sequence.mode === "explode") {
            const t = easeOutCubic(clamp01(modeElapsed / EXPLODE_MS));
            const burstAngle = particle.seed * Math.PI * 2 + time * 0.0006;
            const burstRadius = 30 + particle.seed * 260;

            targetX =
              particle.logo.x + Math.cos(burstAngle) * burstRadius * t + (particle.seed - 0.5) * 14;
            targetY =
              particle.logo.y + Math.sin(burstAngle * 1.2) * burstRadius * 0.68 * t + (0.5 - particle.seed) * 9;
            targetZ = 22 + 128 * t * (0.4 + particle.seed);
            color = getPaletteColor(particle.seed + t * 0.2, 0.45);
          } else if (sequence.mode === "morph" || sequence.mode === "hold" || sequence.mode === "return") {
            const portrait = particle.portraits[sequence.portraitIndex] ?? particle.logo;
            const morphT =
              sequence.mode === "morph"
                ? easeInOutSine(clamp01(modeElapsed / MORPH_MS))
                : sequence.mode === "return"
                  ? 1 - easeInOutSine(clamp01(modeElapsed / RETURN_MS))
                  : 1;

            const dissolveBand = (portrait.x + width * 0.2) / (width * 0.68);
            const disperseThreshold = 0.42 - clamp01(dissolveBand) * 0.3;
            const dispersing = portrait.scatter < disperseThreshold;
            const spread = dispersing ? 68 * (1 - morphT) + 36 * morphT : 0;
            const driftX = dispersing ? (particle.seed - 0.5) * spread * 1.4 : 0;
            const driftY = dispersing ? (particle.seed - 0.5) * spread * 0.9 : 0;
            const breathing = sequence.mode === "hold" ? Math.sin(time * 0.002 + particle.seed * 14) * 1.5 : 0;

            targetX = lerp(particle.logo.x, portrait.x + driftX, morphT);
            targetY = lerp(particle.logo.y, portrait.y + driftY + breathing, morphT);
            targetZ = (dispersing ? 18 : 6) * morphT;

            const grayscale = Math.round(58 + portrait.tone * 170);
            const grayscaleColor = `rgb(${grayscale} ${grayscale} ${grayscale})`;
            const accentColor = getPaletteColor(particle.seed, 0.3);
            const sparkleBand = Math.sin(time * 0.0024 + particle.shimmer * 20) > 0.88;
            const sparkles = sequence.mode !== "return" && portrait.tone > 0.82 && sparkleBand;

            color = sparkles || dispersing || portrait.tone > 0.78 ? accentColor : grayscaleColor;
          }

          const spring = 0.074;
          const friction = 0.82;

          particle.vx = (particle.vx + (targetX - particle.x) * spring) * friction;
          particle.vy = (particle.vy + (targetY - particle.y) * spring) * friction;
          particle.vz = (particle.vz + (targetZ - particle.z) * spring) * 0.8;

          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.z += particle.vz;

          const px = centerX + particle.x;
          const py = centerY + particle.y;
          const size = particle.size * (1 + particle.z * 0.01);
          const highlightPulse = 0.14 + (0.1 + interactionRef.current * 0.16) * (0.5 + 0.5 * Math.sin(time * 0.003 + particle.shimmer * 30));
          const depthFade = clamp01(1 - Math.hypot(particle.x / (width * 0.75), particle.y / (height * 0.75)) * 0.8);
          const alphaBoost = 0.45 + depthFade * 0.55;

          ctx.fillStyle = `rgba(0, 0, 0, ${(0.08 + particle.z * 0.0025) * alphaBoost})`;
          ctx.fillRect(px + size * 0.25, py + size * 0.25, size, size);

          ctx.fillStyle = color;
          ctx.fillRect(px, py, size, size);

          ctx.fillStyle = `rgba(255, 255, 255, ${(highlightPulse + particle.z * 0.0012) * alphaBoost})`;
          ctx.fillRect(px, py, Math.max(1, size * 0.45), Math.max(1, size * 0.3));
        }

        const vignette = ctx.createRadialGradient(
          centerX,
          centerY,
          Math.min(width, height) * 0.24,
          centerX,
          centerY,
          Math.max(width, height) * 0.72,
        );
        vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
        vignette.addColorStop(1, `rgba(2, 2, 4, ${0.34 + modeProgress * 0.08})`);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);

        rafRef.current = window.requestAnimationFrame(render);
      };

      rafRef.current = window.requestAnimationFrame(render);

      return () => {
        window.removeEventListener("resize", onResize);
      };
    };

    let cleanup: (() => void) | undefined;

    setup()
      .then((fn) => {
        cleanup = fn;
      })
      .catch(() => {
        setReady(false);
      });

    return () => {
      mounted = false;
      if (cleanup) {
        cleanup();
      }
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [interactive]);

  const updatePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRef.current.x = event.clientX - rect.left;
    pointerRef.current.y = event.clientY - rect.top;
    pointerRef.current.active = true;
  };

  return (
    <div
      ref={wrapRef}
      className={`${styles.stage} ${className || ""}`.trim()}
      onPointerMove={updatePointer}
      onPointerEnter={updatePointer}
      onPointerLeave={() => {
        pointerRef.current.active = false;
      }}
      aria-hidden="true"
    >
      <div className={styles.ambientGlow} />

      {!interactive || !ready ? (
        <Image
          src={LOGO_SRC}
          alt=""
          fill
          sizes="(max-width: 768px) 88vw, 520px"
          priority={priority}
          className={styles.fallbackLogo}
        />
      ) : null}

      <canvas ref={canvasRef} className={`${styles.canvas} ${ready && interactive ? styles.ready : ""}`} />
      <div className={styles.grain} />
      <div className={styles.vignetteOverlay} />
    </div>
  );
}
