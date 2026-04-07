import styles from "./VideoCard.module.css";
import SpotlightCard from "./SpotlightCard";

export interface VideoData {
  id: string;
  title: string;
  youtubeEmbedId: string;
  slug: string;
  topic: string;
  series: string;
  shortDescription: string;
  bibliography: string[];
  relatedConcepts?: string[];
  publishedDate: string;
}

export default function VideoCard({ video }: { video: VideoData }) {
  return (
    <SpotlightCard className={`${styles.card}`}>
      <div className={styles.videoWrapper}>
        <iframe
          src={`https://www.youtube.com/embed/${video.youtubeEmbedId}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className={styles.iframe}
          loading="lazy"
        />
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
          <div className={styles.biblio}>
            <h3 className={styles.biblioHeading}>
              <span className={styles.biblioLine} />
              Referencias y lecturas
            </h3>
            <ul className={styles.biblioList}>
              {video.bibliography.map((item, index) => (
                <li key={index} className={styles.biblioItem}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
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
