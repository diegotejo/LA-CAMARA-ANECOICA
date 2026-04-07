import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import styles from "./page.module.css";
import { VideoData } from "@/components/VideoCard";
import VideoGallery from "@/components/VideoGallery";
import SeriesPreviewStrip from "@/components/SeriesPreviewStrip";

export const metadata: Metadata = {
  title: "Archivo Audiovisual",
  description:
    "Ensayos en vídeo sobre geopolítica, filosofía política e ideologías organizados como archivo editorial.",
};

async function getVideos(): Promise<VideoData[]> {
  const filePath = path.join(process.cwd(), "data", "videos.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContents);
}

export default async function VideosPage() {
  const videos = await getVideos();

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <p className={`${styles.label} fade-in`}>Archivo</p>
        <h1 className={`${styles.title} fade-in`}>Archivo Audiovisual</h1>
        <p className={`${styles.intro} slide-up`}>
          Cada ensayo audiovisual es una unidad de análisis autónoma. Las
          fichas del archivo resumen el núcleo del tema tratado, la serie a la
          que pertenece y los conceptos que articulan cada pieza.
        </p>
      </header>

      <section className={styles.seriesSection}>
        <p className={styles.seriesLabel}>Series del canal</p>
        <SeriesPreviewStrip compact />
      </section>

      <VideoGallery videos={videos} />
    </div>
  );
}
