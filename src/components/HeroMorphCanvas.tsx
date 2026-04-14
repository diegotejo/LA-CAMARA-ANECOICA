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
  emphasis: number;
}

interface Particle {
  seed: number;
  size: number;
  logo: TargetPoint;
  portraits: TargetPoint[];
}

type Mode = "idleLogo" | "transition" | "portraitLocked";

interface SequenceState {
  mode: Mode;
  portraitIndex: number;
  targetPortraitIndex: number;
  transitionStartedAt: number;
  cooldownUntil: number;
  directionX: number;
  directionY: number;
}

interface QualityProfile {
  minParticles: number;
  maxParticles: number;
}

const LOGO_SRC = "/brand/logo-anecoica.png";
const PORTRAITS = [
  { id: "lenin", src: "/brand/portraits/lenin.png" },
  { id: "isabel", src: "/brand/portraits/isabel.png" },
  { id: "aristoteles", src: "/brand/portraits/aristoteles.png" },
  { id: "confucio", src: "/brand/portraits/confucio.png" },
] as const;

const PORTRAIT_INDEX_BY_ID = {
  lenin: 0,
  isabel: 1,
  aristoteles: 2,
  confucio: 3,
} as const;

const LOGO_THRESHOLD = 14;
const PORTRAIT_THRESHOLD = 26;
const TRANSITION_TOTAL_MS = 900;
const GESTURE_MIN_DISTANCE_DESKTOP = 94;
const GESTURE_MIN_DISTANCE_MOBILE = 70;
const DIRECTION_DOMINANCE_RATIO = 1.24;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOutSine(t: number) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function normalizeVector(x: number, y: number) {
  const mag = Math.hypot(x, y) || 1;
  return { x: x / mag, y: y / mag };
}

function getPortraitIndexFromGesture(deltaX: number, deltaY: number) {
  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0 ? PORTRAIT_INDEX_BY_ID.lenin : PORTRAIT_INDEX_BY_ID.confucio;
  }

  return deltaY >= 0 ? PORTRAIT_INDEX_BY_ID.aristoteles : PORTRAIT_INDEX_BY_ID.isabel;
}

function getQualityProfile() {
  if (typeof window === "undefined") {
    return { minParticles: 7000, maxParticles: 12000 } satisfies QualityProfile;
  }

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const memory = nav.deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 6;
  const saveData = nav.connection?.saveData === true;

  if (reducedMotion || saveData || memory <= 2 || cores <= 4) {
    return { minParticles: 3500, maxParticles: 6000 } satisfies QualityProfile;
  }

  if (coarse || memory <= 4 || cores <= 6) {
    return { minParticles: 6000, maxParticles: 10000 } satisfies QualityProfile;
  }

  return { minParticles: 12000, maxParticles: 22000 } satisfies QualityProfile;
}

function getAdaptiveParticleCount(width: number, height: number, profile: QualityProfile) {
  const estimated = Math.floor((width * height) / 7);
  return Math.max(profile.minParticles, Math.min(profile.maxParticles, estimated));
}

function getParticleSizeRange(particleCount: number, profile: QualityProfile) {
  const t = clamp01((particleCount - profile.minParticles) / Math.max(1, profile.maxParticles - profile.minParticles));
  return {
    min: lerp(1.7, 0.9, t),
    max: lerp(3.2, 1.8, t),
  };
}

function getLogoColor(seed: number, tone: number) {
  const hues = [212, 230, 268, 324, 24];
  const hue = hues[Math.floor(seed * hues.length) % hues.length];
  const sat = 64 + tone * 14;
  const light = 30 + tone * 42;
  return `hsl(${hue} ${sat}% ${light}%)`;
}

const BRAND_STOPS = [
  [255, 168, 106],
  [255, 102, 188],
  [204, 96, 255],
  [124, 106, 255],
  [76, 145, 255],
  [64, 194, 255],
] as const;

function lerpRgb(a: readonly number[], b: readonly number[], t: number) {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ] as const;
}

function getBrandGradientRgb(normalizedX: number, tone = 0.6) {
  const x = clamp01(normalizedX);
  const scaled = x * (BRAND_STOPS.length - 1);
  const index = Math.floor(scaled);
  const localT = scaled - index;
  const a = BRAND_STOPS[index] ?? BRAND_STOPS[BRAND_STOPS.length - 1];
  const b = BRAND_STOPS[index + 1] ?? a;
  const [r, g, b2] = lerpRgb(a, b, localT);
  const lightBoost = 0.84 + tone * 0.4;

  return [
    Math.round(Math.min(255, r * lightBoost)),
    Math.round(Math.min(255, g * lightBoost)),
    Math.round(Math.min(255, b2 * lightBoost)),
  ] as const;
}

function mixRgb(base: readonly number[], overlay: readonly number[], ratio: number) {
  const t = clamp01(ratio);
  return [
    Math.round(lerp(base[0], overlay[0], t)),
    Math.round(lerp(base[1], overlay[1], t)),
    Math.round(lerp(base[2], overlay[2], t)),
  ] as const;
}

function rgbToCss(rgb: readonly number[]) {
  return `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`;
}

function getAccentColor(seed: number, intensity = 0.4) {
  const hues = [207, 226, 262, 318, 28];
  const hue = hues[Math.floor(seed * hues.length) % hues.length] + intensity * 8;
  const sat = 72 + intensity * 14;
  const light = 52 + intensity * 10;
  return `hsl(${hue} ${sat}% ${light}%)`;
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
  profile: "logo" | "portrait",
) {
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    return [] as TargetPoint[];
  }

  const fit = fitContain(image.naturalWidth, image.naturalHeight, width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, fit.x, fit.y, fit.width, fit.height);

  const data = ctx.getImageData(0, 0, width, height).data;
  const baseStep = Math.sqrt((width * height) / targetCount);
  const sampleFactor = profile === "portrait" ? 0.66 : 0.8;
  const step = Math.max(1, Math.floor(baseStep * sampleFactor));
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

      const xNext = Math.min(width - 1, x + step);
      const yNext = Math.min(height - 1, y + step);
      const idxRight = (y * width + xNext) * 4;
      const idxDown = (yNext * width + x) * 4;
      const toneRight =
        (data[idxRight] * 0.2126 + data[idxRight + 1] * 0.7152 + data[idxRight + 2] * 0.0722) / 255;
      const toneDown =
        (data[idxDown] * 0.2126 + data[idxDown + 1] * 0.7152 + data[idxDown + 2] * 0.0722) / 255;

      const edge = clamp01(Math.abs(tone - toneRight) * 1.7 + Math.abs(tone - toneDown) * 1.7);
      const normalizedX = (x - width / 2) / (width / 2);
      const normalizedY = (y - height * 0.46) / (height / 2);
      const centerBias = Math.exp(-(normalizedX * normalizedX * 0.9 + normalizedY * normalizedY * 0.75));
      const tonalDetail = 1 - Math.abs(tone - 0.53);
      const emphasis = clamp01(edge * 0.58 + tonalDetail * 0.24 + centerBias * 0.18);

      const alphaWeight = alpha / 255;
      const profileBoost = profile === "portrait" ? 0.46 + centerBias * 0.4 : 0.68 + centerBias * 0.2;
      const keepChance = Math.min(1, alphaWeight * (0.28 + emphasis * 0.9) * profileBoost * 1.16);

      if (Math.random() > keepChance) {
        continue;
      }

      points.push({
        x: x - width / 2,
        y: y - height / 2,
        tone,
        scatter: Math.random(),
        emphasis,
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
    const weighted = points.map((point) => {
      const weight = Math.max(0.0001, point.emphasis * 0.74 + (1 - point.scatter) * 0.26);
      const key = Math.pow(Math.random(), 1 / weight);
      return { point, key };
    });

    weighted.sort((a, b) => b.key - a.key);
    return weighted.slice(0, targetCount).map((entry) => entry.point);
  }

  return points;
}

export default function HeroMorphCanvas({ className, priority = false }: HeroMorphCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const sceneSizeRef = useRef({ width: 0, height: 0 });
  const sequenceRef = useRef<SequenceState>({
    mode: "idleLogo",
    portraitIndex: PORTRAIT_INDEX_BY_ID.lenin,
    targetPortraitIndex: PORTRAIT_INDEX_BY_ID.lenin,
    transitionStartedAt: 0,
    cooldownUntil: 0,
    directionX: 1,
    directionY: 0,
  });
  const pointerRef = useRef({
    coarse: false,
    pressed: false,
    inside: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const [interactive] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [ready, setReady] = useState(false);

  const drawScene = (time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) {
      return;
    }

    const { width, height } = sceneSizeRef.current;
    const centerX = width / 2;
    const centerY = height / 2;
    const particles = particlesRef.current;
    const sequence = sequenceRef.current;

    ctx.clearRect(0, 0, width, height);

    let transitionProgress = 0;
    let morphProgress = 0;

    if (sequence.mode === "transition") {
      transitionProgress = clamp01((time - sequence.transitionStartedAt) / TRANSITION_TOTAL_MS);
      morphProgress = transitionProgress;
    }

    const denseMode = particles.length > 22000;

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      const logo = particle.logo;
      const portrait = particle.portraits[sequence.targetPortraitIndex] ?? logo;

      let x = logo.x;
      let y = logo.y;
      let z = 0;
      let color = getLogoColor(particle.seed, logo.tone);
      const logoGradientColor = getBrandGradientRgb(clamp01((logo.x + width * 0.5) / width), logo.tone);

      if (sequence.mode === "transition") {
        const organicT = clamp01(morphProgress + (particle.seed - 0.5) * 0.16 * Math.sin(morphProgress * Math.PI));
        const t = easeInOutSine(organicT);
        
        const dissolveBySide =
          sequence.directionX !== 0
            ? sequence.directionX > 0
              ? 1 - clamp01((portrait.x + width * 0.5) / width)
              : clamp01((portrait.x + width * 0.5) / width)
            : sequence.directionY > 0
              ? clamp01((portrait.y + height * 0.5) / height)
              : 1 - clamp01((portrait.y + height * 0.5) / height);

        const dispersing = portrait.scatter < 0.16 + dissolveBySide * 0.13 && portrait.emphasis < 0.58;
        const spread = dispersing ? 42 * (1 - t) : 0;

        const zBump = Math.sin(Math.PI * t);
        
        // Efecto expansivo (burst)
        const burstIntensity = (0.2 + portrait.scatter * 0.8) * width * 0.45 * zBump;
        const burstAngle = particle.seed * Math.PI * 2;
        const burstX = Math.cos(burstAngle) * burstIntensity;
        const burstY = Math.sin(burstAngle) * burstIntensity * 0.6;

        x = lerp(logo.x, portrait.x + sequence.directionX * spread, t) + burstX;
        y = lerp(logo.y, portrait.y + sequence.directionY * spread * 0.75, t) + burstY;
        
        z = 4 + (dispersing ? 32 : 12) * zBump;

        const gray = Math.round(56 + portrait.tone * 180);
        const grayscale = [gray, gray, gray] as const;
        const gradientColor = getBrandGradientRgb(clamp01((portrait.x + width * 0.5) / width), portrait.tone);
        const blendRatio = 0.36 + (1 - portrait.emphasis) * 0.28;
        const targetColor = mixRgb(grayscale, gradientColor, blendRatio);
        
        const sourceColor = mixRgb([34, 34, 38], logoGradientColor, 0.84);
        const currentColor = mixRgb(sourceColor, targetColor, t);
        
        const accent = getAccentColor(particle.seed, 0.22);
        const accentEdge = portrait.scatter < 0.08 && portrait.emphasis < 0.52;

        const useAccent = accentEdge && (t > 0.5 || (dispersing && t > 0.3));
        color = useAccent ? accent : rgbToCss(currentColor);
      } else if (sequence.mode === "portraitLocked") {
        x = portrait.x;
        y = portrait.y;
        z = 4;

        const gray = Math.round(56 + portrait.tone * 180);
        const grayscale = [gray, gray, gray] as const;
        const gradientColor = getBrandGradientRgb(clamp01((portrait.x + width * 0.5) / width), portrait.tone);
        const accent = getAccentColor(particle.seed, 0.22);
        const accentEdge = portrait.scatter < 0.08 && portrait.emphasis < 0.52;
        const blendRatio = 0.36 + (1 - portrait.emphasis) * 0.28;
        color = accentEdge ? accent : rgbToCss(mixRgb(grayscale, gradientColor, blendRatio));
      } else {
        color = rgbToCss(mixRgb([34, 34, 38], logoGradientColor, 0.84));
      }

      const px = centerX + x;
      const py = centerY + y;
      const size = particle.size * (1 + z * 0.045);
      const highlight = 0.15 + z * 0.015;
      const transitionLite = sequence.mode === "transition" && particle.seed < 0.46;

      if (!transitionLite && (!denseMode || particle.seed > 0.44)) {
        ctx.fillStyle = `rgba(0, 0, 0, ${0.12 + z * 0.01})`;
        ctx.fillRect(px + size * (0.2 + z * 0.02), py + size * (0.2 + z * 0.02), size, size);
      }

      ctx.fillStyle = color;
      ctx.fillRect(px, py, size, size);

      if (!transitionLite && (!denseMode || particle.seed > 0.58)) {
        ctx.fillStyle = `rgba(255, 255, 255, ${highlight})`;
        ctx.fillRect(px, py, Math.max(0.2, size * 0.42), Math.max(0.2, size * 0.28));
      }
    }
  };

  const stopLoop = () => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const runTransitionLoop = () => {
    if (rafRef.current) {
      return;
    }

    const tick = (time: number) => {
      drawScene(time);

      const sequence = sequenceRef.current;
      const progress = clamp01((time - sequence.transitionStartedAt) / TRANSITION_TOTAL_MS);

      if (sequence.mode === "transition" && progress < 1) {
        rafRef.current = window.requestAnimationFrame(tick);
        return;
      }

      sequence.mode = "portraitLocked";
      sequence.portraitIndex = sequence.targetPortraitIndex;
      sequence.cooldownUntil = time + 460;
      stopLoop();
      drawScene(time);
    };

    rafRef.current = window.requestAnimationFrame(tick);
  };

  const triggerGestureTransition = (deltaX: number, deltaY: number) => {
    const sequence = sequenceRef.current;
    const now = performance.now();

    if (now < sequence.cooldownUntil || sequence.mode === "transition") {
      return;
    }

    const portraitIndex = getPortraitIndexFromGesture(deltaX, deltaY);
    const direction = normalizeVector(deltaX, deltaY);

    sequence.mode = "transition";
    sequence.targetPortraitIndex = portraitIndex;
    sequence.transitionStartedAt = now;
    sequence.directionX = direction.x;
    sequence.directionY = direction.y;

    runTransitionLoop();
  };

  useEffect(() => {
    if (!interactive) {
      return;
    }

    let mounted = true;

    const setup = async () => {
      const [logoImage, ...portraitImages] = await Promise.all([
        loadImage(LOGO_SRC),
        ...PORTRAITS.map((item) => loadImage(item.src)),
      ]);

      if (!mounted || !wrapRef.current || !canvasRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return;
      }

      const profile = getQualityProfile();
      pointerRef.current.coarse = window.matchMedia("(pointer: coarse)").matches;

      const createScene = () => {
        if (!wrapRef.current || !canvasRef.current) {
          return;
        }

        const bounds = wrapRef.current.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(360, Math.floor(bounds.width));
        const height = Math.max(220, Math.floor(bounds.height));
        const particleCount = getAdaptiveParticleCount(width, height, profile);
        const sizeRange = getParticleSizeRange(particleCount, profile);

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        sceneSizeRef.current = { width, height };

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        const logoTargets = sampleTargetPoints(
          logoImage,
          Math.floor(width * 0.82),
          Math.floor(height * 0.82),
          particleCount,
          LOGO_THRESHOLD,
          "logo",
        );

        const portraitTargets = portraitImages.map((portrait) =>
          sampleTargetPoints(
            portrait,
            Math.floor(width * 0.74),
            Math.floor(height * 0.9),
            particleCount,
            PORTRAIT_THRESHOLD,
            "portrait",
          ),
        );

        particlesRef.current = logoTargets.map((point, index) => ({
          seed: Math.random(),
          size: sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min),
          logo: point,
          portraits: portraitTargets.map((set) => set[index % set.length] ?? point),
        }));

        drawScene(performance.now());
      };

      createScene();
      setReady(true);

      const onResize = () => {
        stopLoop();
        createScene();
      };

      window.addEventListener("resize", onResize);

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
      stopLoop();
      if (cleanup) {
        cleanup();
      }
    };
  }, [interactive]);

  const setPointerPoint = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pointerRef.current.currentX = x;
    pointerRef.current.currentY = y;
    return { x, y };
  };

  const beginGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const { x, y } = setPointerPoint(event);
    pointerRef.current.startX = x;
    pointerRef.current.startY = y;
  };

  const maybeTriggerDesktopGesture = () => {
    if (pointerRef.current.coarse) {
      return;
    }

    const dx = pointerRef.current.currentX - pointerRef.current.startX;
    const dy = pointerRef.current.currentY - pointerRef.current.startY;
    const distance = Math.hypot(dx, dy);
    const dominant = Math.max(Math.abs(dx), Math.abs(dy));
    const secondary = Math.min(Math.abs(dx), Math.abs(dy));

    if (distance < GESTURE_MIN_DISTANCE_DESKTOP || dominant < secondary * DIRECTION_DOMINANCE_RATIO) {
      return;
    }

    triggerGestureTransition(dx, dy);
    pointerRef.current.startX = pointerRef.current.currentX;
    pointerRef.current.startY = pointerRef.current.currentY;
  };

  const maybeTriggerMobileGesture = () => {
    if (!pointerRef.current.coarse) {
      return;
    }

    const dx = pointerRef.current.currentX - pointerRef.current.startX;
    const dy = pointerRef.current.currentY - pointerRef.current.startY;
    const distance = Math.hypot(dx, dy);
    const dominant = Math.max(Math.abs(dx), Math.abs(dy));
    const secondary = Math.min(Math.abs(dx), Math.abs(dy));

    if (distance < GESTURE_MIN_DISTANCE_MOBILE || dominant < secondary * DIRECTION_DOMINANCE_RATIO) {
      return;
    }

    triggerGestureTransition(dx, dy);
  };

  const triggerMobileTapTransition = () => {
    if (!pointerRef.current.coarse || !wrapRef.current) {
      return;
    }

    const rect = wrapRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dxFromCenter = pointerRef.current.currentX - centerX;
    const dyFromCenter = pointerRef.current.currentY - centerY;
    const horizontalWins = Math.abs(dxFromCenter) >= Math.abs(dyFromCenter);

    const syntheticDeltaX = horizontalWins
      ? dxFromCenter < 0
        ? GESTURE_MIN_DISTANCE_MOBILE + 10
        : -(GESTURE_MIN_DISTANCE_MOBILE + 10)
      : 0;
    const syntheticDeltaY = horizontalWins
      ? 0
      : dyFromCenter < 0
        ? GESTURE_MIN_DISTANCE_MOBILE + 10
        : -(GESTURE_MIN_DISTANCE_MOBILE + 10);

    triggerGestureTransition(syntheticDeltaX, syntheticDeltaY);
  };

  return (
    <div
      ref={wrapRef}
      className={`${styles.stage} ${className || ""}`.trim()}
      onPointerEnter={(event) => {
        pointerRef.current.inside = true;
        if (!pointerRef.current.coarse) {
          beginGesture(event);
        }
      }}
      onPointerDown={(event) => {
        pointerRef.current.pressed = true;
        beginGesture(event);
      }}
      onPointerMove={(event) => {
        setPointerPoint(event);
        if (!ready || sequenceRef.current.mode === "transition") {
          return;
        }

        if (pointerRef.current.coarse) {
          return;
        }

        maybeTriggerDesktopGesture();
      }}
      onPointerUp={(event) => {
        setPointerPoint(event);
        if (pointerRef.current.coarse && pointerRef.current.pressed && ready) {
          const beforeMode = sequenceRef.current.mode;
          maybeTriggerMobileGesture();
          if (beforeMode === sequenceRef.current.mode) {
            triggerMobileTapTransition();
          }
        }
        pointerRef.current.pressed = false;
      }}
      onPointerLeave={() => {
        pointerRef.current.pressed = false;
        pointerRef.current.inside = false;
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
