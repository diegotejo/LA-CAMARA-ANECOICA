import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import styles from "./page.module.css";
import { QuizData } from "@/components/QuizPlayer";
import CuestionariosGallery from "@/components/CuestionariosGallery";

export const metadata: Metadata = {
  title: "Cuestionarios Temáticos",
  description:
    "Herramientas pedagógicas para autoevaluación en geopolítica, ideologías, filosofía política y pensamiento crítico.",
};

async function getQuizzes(): Promise<QuizData[]> {
  const filePath = path.join(process.cwd(), "data", "quizzes.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContents);
}

export default async function CuestionariosPage() {
  const quizzes = await getQuizzes();

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <p className={`${styles.label} fade-in`}>Autoevaluación</p>
        <h1 className={`${styles.title} fade-in`}>Cuestionarios Temáticos</h1>
        <p className={`${styles.intro} slide-up`}>
          Estos cuestionarios no son lúdicos ni triviales. Son herramientas
          pedagógicas diseñadas para revisitar los marcos teóricos expuestos en
          los ensayos audiovisuales del canal. Los cuestionarios conceptuales se
          han ampliado a 10 preguntas, y el test ideológico desarrolla un mapa
          de 20 preguntas repartidas en dos ejes.
        </p>
      </header>

      <CuestionariosGallery quizzes={quizzes} />
    </div>
  );
}
