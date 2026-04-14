import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";
import SpotlightCard from "@/components/SpotlightCard";
import { VideoData } from "@/components/VideoCard";

export const metadata: Metadata = {
  title: "Glosario Analítico",
  description: "Directorio interactivo de conceptos clave abordados en los ensayos audiovisuales de La Cámara Anecoica.",
};

interface ConceptGroup {
  concept: string;
  videos: { id: string; title: string; series: string; youtubeEmbedId: string }[];
}

async function getConcepts(): Promise<ConceptGroup[]> {
  const filePath = path.join(process.cwd(), "data", "videos.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const videos: VideoData[] = JSON.parse(fileContents);

  const conceptMap = new Map<string, ConceptGroup>();

  for (const video of videos) {
    if (!video.relatedConcepts) continue;

    for (const concept of video.relatedConcepts) {
      if (!conceptMap.has(concept)) {
        conceptMap.set(concept, { concept, videos: [] });
      }
      conceptMap.get(concept)!.videos.push({
        id: video.id,
        title: video.title,
        series: video.series,
        youtubeEmbedId: video.youtubeEmbedId,
      });
    }
  }

  // Convert map to array and sort alphabetically by concept name
  return Array.from(conceptMap.values()).sort((a, b) =>
    a.concept.localeCompare(b.concept, "es", { sensitivity: "base" })
  );
}

export default async function GlosarioPage() {
  const groupedConcepts = await getConcepts();

  return (
    <div className={`container ${styles.page} mixToneCopy`}>
      <header className={styles.header}>
        <p className={`${styles.label} fade-in`}>Directorio</p>
        <h1 className={`${styles.title} fade-in`}>Glosario Analítico</h1>
        <p className={`${styles.intro} slide-up`}>
          Conceptos clave de sociología, filosofía y geopolítica analizados a lo largo de nuestro archivo audiovisual.
        </p>
      </header>

      {groupedConcepts.length > 0 ? (
        <div className={`${styles.glossaryGrid} slide-up`}>
          {groupedConcepts.map((group) => (
            <SpotlightCard key={group.concept} className={styles.conceptCard}>
              <div className={styles.conceptCardInner}>
                <h2 className={styles.conceptTitle}>{group.concept}</h2>
                <div className={styles.videosList}>
                  {group.videos.map((v) => (
                    <Link
                      key={v.id}
                      href={`https://www.youtube.com/watch?v=${v.youtubeEmbedId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.videoLink}
                    >
                      <span className={styles.videoSeries}>{v.series}</span>
                      <span className={styles.videoTitle}>{v.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>No hay conceptos registrados actualmente.</p>
      )}
    </div>
  );
}
