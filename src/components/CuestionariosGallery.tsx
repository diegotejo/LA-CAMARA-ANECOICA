"use client";

import { useState } from "react";
import styles from "@/app/cuestionarios/page.module.css";
import QuizPlayer, { QuizData } from "@/components/QuizPlayer";
import SpotlightCard from "@/components/SpotlightCard";
import { motion, Variants } from "framer-motion";

const FADE_IN: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

export default function CuestionariosGallery({ quizzes }: { quizzes: QuizData[] }) {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id);

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);

  return (
    <div className={styles.quizLayout}>
      {/* Sidebar de selección */}
      <motion.aside 
        className={styles.sidebar}
        initial="hidden" animate="show" variants={{ hidden: {opacity: 0}, show: {opacity: 1, transition: {staggerChildren: 0.1}} }}
      >
        <h2 className={styles.sidebarTitle}>Índice temático</h2>
        <nav className={styles.nav}>
          {quizzes.map((quiz, index) => (
            <motion.button
              variants={FADE_IN}
              key={quiz.id}
              className={`${styles.navItem} ${selectedQuizId === quiz.id ? styles.navItemActive : ""}`}
              onClick={() => setSelectedQuizId(quiz.id)}
            >
              <span className={styles.navNumber}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.navLabel}>
                {quiz.title}
                <small className={styles.navMeta}>
                  {quiz.questions.length} preguntas{quiz.mode === "axes" ? " · test de ejes" : ""}
                </small>
              </span>
            </motion.button>
          ))}
        </nav>
      </motion.aside>

      {/* Cuestionario activo */}
      <main className={styles.activeQuizArea}>
        {selectedQuiz && (
          <SpotlightCard key={selectedQuiz.id} className={styles.quizSectionSpotlight}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              style={{ padding: "var(--space-2xl)" }}
            >
              <div className={styles.quizIntro}>
                <h3 className={styles.quizTitle}>{selectedQuiz.title}</h3>
                <p className={styles.quizDesc}>{selectedQuiz.description}</p>
                <p className={styles.quizMeta}>
                  {selectedQuiz.questions.length} preguntas{selectedQuiz.mode === "axes" ? " · dos ejes ideologicos" : " · evaluacion conceptual"}
                </p>
              </div>
              <div className={styles.quizBody}>
                <QuizPlayer quiz={selectedQuiz} />
              </div>
            </motion.div>
          </SpotlightCard>
        )}
      </main>
    </div>
  );
}
