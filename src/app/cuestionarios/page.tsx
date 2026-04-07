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
  const quizzes: QuizData[] = JSON.parse(fileContents);

  return quizzes.sort((a, b) => {
    if (a.id === "quiz-05") return -1;
    if (b.id === "quiz-05") return 1;
    return a.title.localeCompare(b.title, "es");
  });
}

export default async function CuestionariosPage() {
  const quizzes = await getQuizzes();

  return (
    <div className={`container ${styles.page}`}>
      <header className={`${styles.header} mixToneCopy`}>
        <p className={`${styles.label} fade-in`}>Autoevaluación</p>
        <h1 className={`${styles.title} fade-in`}>Cuestionarios Temáticos</h1>
        <p className={`${styles.intro} slide-up`}>
          Una forma rápida de revisar ideas clave del canal. Incluye
          cuestionarios conceptuales de 10 preguntas y un test ideológico de 20
          respuestas para ubicar tendencias en dos ejes.
        </p>
      </header>

      <CuestionariosGallery quizzes={quizzes} />
    </div>
  );
}
