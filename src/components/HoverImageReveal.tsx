"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState } from "react";
import Image from "next/image";
import styles from "./HoverImageReveal.module.css";

interface ThemeItem {
  id: string;
  name: string;
  accent?: string;
  desc: string;
  image: string;
}

interface HoverImageRevealProps {
  themes: ThemeItem[];
}

export default function HoverImageReveal({ themes }: HoverImageRevealProps) {
  const [activeTheme, setActiveTheme] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse coords
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Springs for smooth following effect
  const springX = useSpring(mouseX, { stiffness: 100, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Centrar la imagen en el ratón
    mouseX.set(e.clientX - rect.left - 150); 
    mouseY.set(e.clientY - rect.top - 200);
  };

  return (
    <div 
      className={styles.container} 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setActiveTheme(null)}
    >
      {/* Lista de Texto Interactivo */}
      <div className={styles.list}>
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`${styles.item} ${activeTheme && activeTheme !== theme.id ? styles.itemDimmed : ""}`}
            onMouseEnter={() => setActiveTheme(theme.id)}
          >
            <div className={styles.itemContent}>
              <h4 className={styles.themeName}>
                {theme.accent && <span className="serif-accent">{theme.accent}</span>}{" "}
                {theme.name}
              </h4>
              <p className={styles.themeDesc}>{theme.desc}</p>
            </div>
            <span className={styles.arrow}>→</span>
            <div className={styles.divider} />
          </div>
        ))}
      </div>

      {/* Imagen Flotante que sigue al ratón */}
      <motion.div
        className={styles.floatingImageContainer}
        style={{
          x: springX,
          y: springY,
        }}
        animate={{
          opacity: activeTheme ? 1 : 0,
          scale: activeTheme ? 1 : 0.8,
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {themes.map((theme) => (
          <Image
            key={theme.id}
            src={theme.image}
            alt={theme.name}
            fill
            className={styles.image}
            style={{
              opacity: activeTheme === theme.id ? 1 : 0,
              transition: "opacity 0.4s ease",
              objectFit: "cover",
            }}
          />
        ))}
        {/* Overlay oscuro para darle tono editorial */}
        <div className={styles.imageOverlay} />
      </motion.div>
    </div>
  );
}
