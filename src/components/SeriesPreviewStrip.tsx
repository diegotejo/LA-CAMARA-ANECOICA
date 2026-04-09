"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./SeriesPreviewStrip.module.css";
import { SERIES_PREVIEWS } from "@/lib/series";

interface SeriesPreviewStripProps {
  compact?: boolean;
}

export default function SeriesPreviewStrip({ compact = false }: SeriesPreviewStripProps) {
  const [shouldAutoplay, setShouldAutoplay] = useState(false);

  useEffect(() => {
    const pointerQuery = window.matchMedia("(hover: none), (pointer: coarse)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;

    const syncAutoplay = () => {
      const isPointerCoarse = pointerQuery.matches;
      const isReducedMotion = reducedMotionQuery.matches;
      const saveDataEnabled = connection?.saveData === true;

      setShouldAutoplay(!isPointerCoarse && !isReducedMotion && !saveDataEnabled);
    };

    syncAutoplay();
    pointerQuery.addEventListener("change", syncAutoplay);
    reducedMotionQuery.addEventListener("change", syncAutoplay);

    return () => {
      pointerQuery.removeEventListener("change", syncAutoplay);
      reducedMotionQuery.removeEventListener("change", syncAutoplay);
    };
  }, []);

  return (
    <div className={`${styles.grid} ${compact ? styles.compact : ""}`}>
      {SERIES_PREVIEWS.map((series, index) => (
        <article key={series.id} className={styles.card}>
          <div className={styles.mediaWrap}>
            <video
              className={styles.video}
              autoPlay={shouldAutoplay}
              muted
              loop
              playsInline
              preload={shouldAutoplay ? "metadata" : "none"}
            >
              <source src={series.videoSrc} type="video/mp4" />
            </video>
            <div className={styles.videoOverlay} />
          </div>

          <div className={styles.content}>
            <span className={styles.index}>0{index + 1}</span>
            <h3 className={styles.title}>{series.name}</h3>
            <p className={styles.desc}>{series.desc}</p>
            <Link href={series.href} className={styles.link}>
              Explorar serie
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
