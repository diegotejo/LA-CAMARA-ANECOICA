import Link from "next/link";
import styles from "./SeriesPreviewStrip.module.css";
import { SERIES_PREVIEWS } from "@/lib/series";

interface SeriesPreviewStripProps {
  compact?: boolean;
}

export default function SeriesPreviewStrip({ compact = false }: SeriesPreviewStripProps) {
  return (
    <div className={`${styles.grid} ${compact ? styles.compact : ""}`}>
      {SERIES_PREVIEWS.map((series, index) => (
        <article key={series.id} className={styles.card}>
          <div className={styles.mediaWrap}>
            <video
              className={styles.video}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
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
