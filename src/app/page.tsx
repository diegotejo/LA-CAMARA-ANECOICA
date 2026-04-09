"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import SpotlightCard from "@/components/SpotlightCard";
import AnimatedText from "@/components/AnimatedText";
import Magnetic from "@/components/Magnetic";
import HeroMorphCanvas from "@/components/HeroMorphCanvas";
import SeriesPreviewStrip from "@/components/SeriesPreviewStrip";
import { siteConfig } from "@/lib/site-config";
import styles from "./page.module.css";

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
};

const STAGGER: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

export default function Home() {
  return (
    <div className={styles.page}>
      <div className="container mixToneCopy">
        {/* --- HERO SECTION --- */}
        <motion.section
          className={styles.hero}
          initial="hidden"
          animate="show"
          variants={STAGGER}
        >
          <motion.div className={styles.heroLogoWrap} variants={FADE_UP}>
            <HeroMorphCanvas className={styles.heroLogo} priority />
          </motion.div>

          <motion.div className={styles.heroPretitle} variants={FADE_UP}>
            DIVULGACIÓN · REFLEXIÓN · ANÁLISIS
          </motion.div>

          <motion.h1 className={styles.heroTitle} variants={FADE_UP}>
            <span className="serif-accent">La</span> Cámara
            <br />
            Anecoica
          </motion.h1>

          <motion.div variants={FADE_UP}>
            <AnimatedText
              className={styles.heroDesc}
              text="Si estás cansado del ruido político, las consignas vacías y las trincheras ideológicas, este es tu sitio. Aquí analizamos política, ideologías y conflictos actuales con calma, perspectiva histórica y herramientas filosóficas."
            />
          </motion.div>

          <motion.div className={styles.heroCtaArea} variants={FADE_UP}>
            <Magnetic>
              <Link
                href={siteConfig.youtubeChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                ARCHIVO AUDIOVISUAL EN YOUTUBE →
              </Link>
            </Magnetic>
          </motion.div>
        </motion.section>

        {/* --- CARDS SECTION --- */}
        <motion.section
          className={styles.section}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={STAGGER}
        >
          <motion.h2 className={styles.sectionTitle} variants={FADE_UP}>
            Estructura del archivo
          </motion.h2>

          <div className={styles.grid}>
            <motion.div variants={FADE_UP}>
              <SpotlightCard className={styles.card}>
                <Link href="/videos" className={styles.cardInner}>
                  <span className={styles.cardNumber}>01</span>
                  <h3 className={styles.cardTitle}>Archivo audiovisual</h3>
                  <p className={styles.cardDesc}>
                    Ensayos en formato vídeo acompañados de su contexto
                    temático y su ficha editorial. Cada pieza es una unidad de
                    análisis autónoma.
                  </p>
                  <span className={styles.cardArrow}>→</span>
                </Link>
              </SpotlightCard>
            </motion.div>

            <motion.div variants={FADE_UP}>
              <SpotlightCard className={styles.card}>
                <Link href="/cuestionarios" className={styles.cardInner}>
                  <span className={styles.cardNumber}>02</span>
                  <h3 className={styles.cardTitle}>Cuestionarios temáticos</h3>
                  <p className={styles.cardDesc}>
                    Herramientas pedagógicas fijas para autoevaluación. Geopolítica,
                    ideologías, filosofía política y teoría del Estado.
                  </p>
                  <span className={styles.cardArrow}>→</span>
                </Link>
              </SpotlightCard>
            </motion.div>

            <motion.div variants={FADE_UP}>
              <SpotlightCard className={styles.card}>
                <Link href="/articulos" className={styles.cardInner}>
                  <span className={styles.cardNumber}>03</span>
                  <h3 className={styles.cardTitle}>Textos y ensayos</h3>
                  <p className={styles.cardDesc}>
                    Espacio editorial para reflexiones escritas, notas de
                    investigación y artículos independientes al formato audiovisual.
                  </p>
                  <span className={styles.cardArrow}>→</span>
                </Link>
              </SpotlightCard>
            </motion.div>

            <motion.div variants={FADE_UP}>
              <SpotlightCard className={styles.card}>
                <Link href="/mapamundi-politico" className={styles.cardInner}>
                  <span className={styles.cardNumber}>04</span>
                  <h3 className={styles.cardTitle}>Mapamundi político</h3>
                  <p className={styles.cardDesc}>
                    Recurso interactivo permanente para explorar países por continente y sistema político,
                    con ficha comparativa de datos institucionales y económicos.
                  </p>
                  <span className={styles.cardArrow}>→</span>
                </Link>
              </SpotlightCard>
            </motion.div>
          </div>
        </motion.section>

        {/* --- THEMES SECTION --- */}
        <motion.section
          className={styles.section}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={STAGGER}
        >
          <div className="editorial-separator">
            <span>Ejes Temáticos</span>
          </div>

          <motion.div variants={FADE_UP}>
            <SeriesPreviewStrip />
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}
