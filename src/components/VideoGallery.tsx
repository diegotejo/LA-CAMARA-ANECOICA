"use client";

import { useState } from "react";
import styles from "@/app/videos/page.module.css";
import { VideoData } from "@/components/VideoCard";
import VideoCard from "@/components/VideoCard";
import { motion, Variants } from "framer-motion";

const STAGGER: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
};

export default function VideoGallery({ videos }: { videos: VideoData[] }) {
  const [filter, setFilter] = useState<string | null>(null);

  const series = Array.from(new Set(videos.map((v) => v.series)));

  const filteredVideos = filter
    ? videos.filter((v) => v.series === filter)
    : videos;

  return (
    <>
      <div className={`${styles.filterBar} slide-up`}>
        <button
          className={`${styles.filterBtn} ${!filter ? styles.filterActive : ""}`}
          onClick={() => setFilter(null)}
        >
          Todo el archivo
        </button>
        {series.map((s) => (
          <button
            key={s}
            className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ""}`}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <motion.div 
        className={styles.grid}
        initial="hidden"
        animate="show"
        variants={STAGGER}
        key={filter || "all"} // Trigger animation on filter change
      >
        {filteredVideos.map((video) => (
          <motion.div key={video.id} variants={FADE_UP} style={{ height: "100%" }}>
            <VideoCard video={video} />
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}
