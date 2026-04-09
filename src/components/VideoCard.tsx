import styles from "./VideoCard.module.css";
import SpotlightCard from "./SpotlightCard";
import { getSafeYouTubeEmbedUrl } from "@/lib/url-safety";

export interface VideoData {
  id: string;
  title: string;
  youtubeEmbedId: string;
  slug: string;
  topic: string;
  series: string;
  shortDescription: string;
  bibliography: BibliographyEntry[];
  relatedConcepts?: string[];
  publishedDate: string;
}

export interface BibliographyEntry {
  title: string;
  note: string;
}

export default function VideoCard({ video }: { video: VideoData }) {
  const embedUrl = getSafeYouTubeEmbedUrl(video.youtubeEmbedId);

  return (
    <SpotlightCard className={`${styles.card}`}>
      <div className={styles.videoWrapper}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="origin"
            allowFullScreen
            className={styles.iframe}
            loading="lazy"
          />
        ) : (
          <div className={styles.embedFallback}>No se pudo cargar el reproductor de este vídeo.</div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.series}>{video.series}</span>
          <span className={styles.divider}>·</span>
          <span className={styles.topic}>{video.topic}</span>
        </div>

        <h2 className={styles.title}>{video.title}</h2>
        <p className={styles.description}>{video.shortDescription}</p>

        {video.relatedConcepts && video.relatedConcepts.length > 0 && (
          <div className={styles.concepts}>
            {video.relatedConcepts.map((concept) => (
              <span key={concept} className={styles.tag}>
                {concept}
              </span>
            ))}
          </div>
        )}

        {video.bibliography && video.bibliography.length > 0 && (
          <details className={styles.biblio}>
            <summary className={styles.biblioSummary}>
              <span className={styles.biblioLine} />
              Bibliografía comentada
            </summary>
            <ul className={styles.biblioList}>
              {video.bibliography.map((item) => (
                <li key={item.title} className={styles.biblioItem}>
                  <span className={styles.biblioTitle}>{item.title}</span>
                  <span className={styles.biblioNote}>{item.note}</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className={styles.date}>
          {new Date(video.publishedDate).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
          })}
        </div>
      </div>
    </SpotlightCard>
  );
}
