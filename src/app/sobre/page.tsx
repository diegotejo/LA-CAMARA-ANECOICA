"use client";

import styles from "./page.module.css";
import { motion, Variants } from "framer-motion";
import SpotlightCard from "@/components/SpotlightCard";
import Magnetic from "@/components/Magnetic";
import { siteConfig } from "@/lib/site-config";

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const STAGGER: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function SobrePage() {
  return (
    <div className={`container ${styles.page}`}>
      <motion.header 
        className={styles.header}
        initial="hidden" animate="show" variants={STAGGER}
      >
        <motion.p className={styles.label} variants={FADE_UP}>Manifiesto</motion.p>
        <motion.h1 className={styles.title} variants={FADE_UP}>Sobre el proyecto</motion.h1>
      </motion.header>

      <motion.div 
        className={`${styles.content} mixToneCopy`}
        initial="hidden" animate="show" variants={STAGGER}
      >
        <motion.div className={styles.block} variants={FADE_UP}>
          <h2 className={styles.blockTitle}>¿Qué es una cámara anecoica?</h2>
          <p>
            Es un espacio diseñado para absorber completamente las reflexiones
            del sonido. Sin eco, sin reverberación, sin ruido residual. Solo
            queda la señal original, desnuda, sin distorsión.
          </p>
          <p>
            La metáfora no es casual. En el debate público actual, cada idea
            llega amplificada, deformada, cargada de resonancias que no le
            pertenecen. Cada posición se convierte en trinchera. Cada matiz
            se pierde en la simplificación.
          </p>
        </motion.div>

        <motion.div className={styles.block} variants={FADE_UP}>
          <h2 className={styles.blockTitle}>¿Por qué este canal?</h2>
          <p>
            La Cámara Anecoica nace de una frustración concreta: la distancia
            creciente entre la complejidad real de los fenómenos políticos y la
            pobreza del lenguaje con el que se discuten públicamente.
          </p>
          <p>
            Este proyecto es un intento de tomarse en serio las ideas. De
            analizar política, ideologías y conflictos actuales con calma,
            perspectiva histórica y herramientas filosóficas. Sin consignas,
            sin bandos, sin la urgencia artificial de la agenda mediática.
          </p>
        </motion.div>

        <motion.div className={styles.block} variants={FADE_UP}>
          <h2 className={styles.blockTitle}>¿Cómo funciona?</h2>
          <p>
            Cada ensayo audiovisual es una unidad de análisis autónoma.
            Detrás de cada vídeo hay un proceso de investigación, lectura y
            reflexión que se traslada a la pieza audiovisual y a su contexto
            editorial dentro del archivo.
          </p>
          <p>
            El canal se organiza en tres formatos principales:
          </p>
          <ul className={styles.formatList}>
            <li>
              <strong>Orbis Terrarum</strong> — Análisis geopolítico. 
              Conflictos internacionales, relaciones de poder entre Estados
              y las estructuras que explican el orden mundial.
            </li>
            <li>
              <strong>La Tribu</strong> — Ideología, identidad y filosofía
              política. Los marcos teóricos que articulan la práctica política
              contemporánea.
            </li>
            <li>
              <strong>Antipéndulo</strong> — Pensamiento crítico aplicado a
              la actualidad. Contra la oscilación pendular del debate público,
              una apuesta por el matiz y la profundidad.
            </li>
          </ul>
        </motion.div>

        <motion.div className={styles.block} variants={FADE_UP}>
          <h2 className={styles.blockTitle}>Principios editoriales</h2>
          <div className={styles.principles}>
            <SpotlightCard className={styles.principle}>
              <h3>Densidad sobre volumen</h3>
              <p>
                Preferimos un análisis bien construido que diez reacciones
                superficiales a la última noticia.
              </p>
            </SpotlightCard>
            <SpotlightCard className={styles.principle}>
              <h3>Rigor sin pedantería</h3>
              <p>
                Las ideas complejas merecen un tratamiento serio, pero no
                necesitan un lenguaje excluyente.
              </p>
            </SpotlightCard>
            <SpotlightCard className={styles.principle}>
              <h3>Independencia intelectual</h3>
              <p>
                No representamos ningún partido, corriente ni organización.
                El análisis no tiene propietario.
              </p>
            </SpotlightCard>
            <SpotlightCard className={styles.principle}>
              <h3>Transparencia bibliográfica</h3>
              <p>
                Cada afirmación tiene un origen. Las fuentes no se esconden:
                se comparten.
              </p>
            </SpotlightCard>
          </div>
        </motion.div>

        <motion.div className={styles.cta} variants={FADE_UP}>
          <Magnetic>
            <a
              href={siteConfig.youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Ver el canal en YouTube →
            </a>
          </Magnetic>
        </motion.div>
      </motion.div>
    </div>
  );
}
