"use client";

import { useMemo, useState } from "react";
import styles from "./QuizPlayer.module.css";

export interface KnowledgeQuestion {
  type?: "knowledge";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AxisOption {
  label: string;
  value: number;
}

export interface AxisQuestion {
  type: "axis";
  axis: "economic" | "sociocultural";
  question: string;
  options: AxisOption[];
}

export type Question = KnowledgeQuestion | AxisQuestion;

export interface QuizData {
  id: string;
  title: string;
  description: string;
  mode?: "knowledge" | "axes";
  relatedVideoId?: string;
  questions: Question[];
}

function clampCoordinate(value: number) {
  return Math.max(-10, Math.min(10, Math.round(value / 2)));
}

function getAxisLabel(axis: "economic" | "sociocultural", value: number) {
  if (axis === "economic") {
    if (value >= 4) return "liberalización y libre mercado";
    if (value <= -4) return "proteccionismo y estatismo";
    return "equilibrio económico";
  }

  if (value >= 4) return "tradicionalismo y determinismo cultural";
  if (value <= -4) return "progresismo y relativismo cultural";
  return "equilibrio sociocultural";
}

function getIdeologySummary(x: number, y: number) {
  if (x >= 3 && y >= 3) return "Tendencia liberal-conservadora";
  if (x >= 3 && y <= -3) return "Tendencia liberal-progresista";
  if (x <= -3 && y >= 3) return "Tendencia estatista-conservadora";
  if (x <= -3 && y <= -3) return "Tendencia estatista-progresista";
  if (Math.abs(x) < 3 && Math.abs(y) < 3) return "Zona de centro ideológico";
  if (Math.abs(x) >= Math.abs(y)) {
    return x > 0 ? "Sesgo económico liberal" : "Sesgo económico estatista";
  }

  return y > 0
    ? "Sesgo sociocultural tradicionalista"
    : "Sesgo sociocultural progresista";
}

interface IdeologyAnchor {
  name: string;
  x: number;
  y: number;
  note: string;
}

const IDEOLOGY_ANCHORS: IdeologyAnchor[] = [
  { name: "Liberalismo clasico", x: 6, y: -2, note: "mercado y libertades civiles" },
  { name: "Conservadurismo liberal", x: 5, y: 4, note: "mercado con orden tradicional" },
  { name: "Socialdemocracia", x: -2, y: -2, note: "estado social y pluralismo" },
  { name: "Republicanismo civico", x: -1, y: 1, note: "institucion y cohesion publica" },
  { name: "Socialismo democratico", x: -6, y: -3, note: "redistribucion y expansion de derechos" },
  { name: "Comunitarismo tradicional", x: -3, y: 5, note: "proteccion social y valores conservadores" },
  { name: "Libertarismo", x: 8, y: -4, note: "maxima libertad economica e individual" },
  { name: "Nacional-conservadurismo", x: 2, y: 7, note: "identidad nacional y autoridad" },
];

function getIdeologyMatches(x: number, y: number) {
  const maxDistance = Math.hypot(20, 20);

  return IDEOLOGY_ANCHORS.map((anchor) => {
    const distance = Math.hypot(anchor.x - x, anchor.y - y);
    const affinity = Math.max(35, Math.round(100 - (distance / maxDistance) * 100));

    return {
      ...anchor,
      affinity,
    };
  })
    .sort((a, b) => b.affinity - a.affinity)
    .slice(0, 5);
}

export default function QuizPlayer({ quiz }: { quiz: QuizData }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [axisScore, setAxisScore] = useState({ economic: 0, sociocultural: 0 });

  const isAxesQuiz = quiz.mode === "axes";
  const q = quiz.questions[currentQ];

  const handleSelect = (idx: number) => {
    if (answered) return;

    setSelected(idx);
    setAnswered(true);

    if (isAxesQuiz && q.type === "axis") {
      const value = q.options[idx]?.value ?? 0;
      setAxisScore((prev) => ({
        ...prev,
        [q.axis]: prev[q.axis] + value,
      }));
      return;
    }

    if (!isAxesQuiz && "correctIndex" in q && idx === q.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
      setSelected(null);
      setAnswered(false);
      return;
    }

    setFinished(true);
  };

  const handleRestart = () => {
    setCurrentQ(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
    setAxisScore({ economic: 0, sociocultural: 0 });
  };

  const ideologyResult = useMemo(() => {
    const x = clampCoordinate(axisScore.economic);
    const y = clampCoordinate(axisScore.sociocultural);
    const dotLeft = `${((x + 10) / 20) * 100}%`;
    const dotBottom = `${((y + 10) / 20) * 100}%`;

    return {
      x,
      y,
      dotLeft,
      dotBottom,
      xLabel: getAxisLabel("economic", x),
      yLabel: getAxisLabel("sociocultural", y),
      summary: getIdeologySummary(x, y),
      matches: getIdeologyMatches(x, y),
    };
  }, [axisScore]);

  if (finished) {
    if (isAxesQuiz) {
      return (
        <div className={styles.container}>
          <div className={`${styles.result} ${styles.axesResult}`}>
            <p className={styles.resultLabel}>Resultado ideológico</p>
            <h4 className={styles.axesTitle}>{ideologyResult.summary}</h4>

            <div className={styles.axesGrid}>
              <div className={styles.axesPlotBlock}>
                <div className={styles.axesPlotWrap}>
                  <div className={styles.axesVertical} />
                  <div className={styles.axesHorizontal} />
                  <div
                    className={styles.axesPoint}
                    style={{ left: ideologyResult.dotLeft, bottom: ideologyResult.dotBottom }}
                  />
                </div>
                <div className={styles.axesLegend}>
                  <div className={styles.axesLegendBlock}>
                    <span className={styles.axesLegendTitle}>Valores socioculturales</span>
                    <div className={styles.axesLegendRow}>
                      <span>Tradición</span>
                      <span>Progreso</span>
                    </div>
                  </div>
                  <div className={styles.axesLegendBlock}>
                    <span className={styles.axesLegendTitle}>Posicionamiento económico</span>
                    <div className={styles.axesLegendRow}>
                      <span>Estado</span>
                      <span>Mercado</span>
                    </div>
                  </div>
                </div>
                <p className={styles.axesCoordinate}>
                  X {ideologyResult.x >= 0 ? "+" : ""}
                  {ideologyResult.x} / Y {ideologyResult.y >= 0 ? "+" : ""}
                  {ideologyResult.y}
                </p>
              </div>

              <div className={styles.axesPanel}>
                <p className={styles.axesPanelLabel}>Afinidades ideológicas</p>
                <h5 className={styles.axesPanelTitle}>Referencias cercanas</h5>
                <ul className={styles.ideologyList}>
                  {ideologyResult.matches.map((item) => (
                    <li key={item.name} className={styles.ideologyItem}>
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.note}</span>
                      </div>
                      <em>{item.affinity}%</em>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.axesText}>
                <p className={styles.axesCoordinate}>
                  Lectura base: {ideologyResult.summary}
                </p>
                <p>
                  En el eje económico te acercas a <strong>{ideologyResult.xLabel}</strong>.
                </p>
                <p>
                  En el eje sociocultural te acercas a <strong>{ideologyResult.yLabel}</strong>.
                </p>
                <p>
                  El gráfico no dicta una identidad cerrada: ubica inclinaciones dominantes a partir de
                  veinte decisiones concretas.
                </p>
              </div>
            </div>

            <button className="btn-outline" onClick={handleRestart}>
              Repetir test
            </button>
          </div>
        </div>
      );
    }

    const pct = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className={styles.container}>
        <div className={styles.result}>
          <p className={styles.resultLabel}>Resultado</p>
          <p className={styles.resultScore}>
            {score}
            <span className={styles.resultTotal}>/{quiz.questions.length}</span>
          </p>
          <p className={styles.resultPct}>{pct}% de acierto</p>
          <p className={styles.resultMsg}>
            {pct === 100
              ? "Dominio sólido de los conceptos. Una comprensión precisa del marco teórico."
              : pct >= 60
                ? "Buen conocimiento general, aunque algunos matices se resisten. Revisa las explicaciones."
                : "Hay margen de profundización significativo. Te recomendamos volver a los vídeos relacionados."}
          </p>
          <button className="btn-outline" onClick={handleRestart}>
            Reiniciar cuestionario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.progress}>
          Pregunta {currentQ + 1} de {quiz.questions.length}
        </span>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${((currentQ + (answered ? 1 : 0)) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <p className={styles.questionText}>{q.question}</p>

      <div className={styles.options}>
        {q.options.map((opt, idx) => {
          const isCorrect = !isAxesQuiz && "correctIndex" in q && idx === q.correctIndex;
          let cls = styles.option;

          if (answered) {
            if (isAxesQuiz && idx === selected) cls += ` ${styles.selected}`;
            else if (isCorrect) cls += ` ${styles.correct}`;
            else if (idx === selected) cls += ` ${styles.incorrect}`;
            else cls += ` ${styles.faded}`;
          }

          return (
            <button
              key={idx}
              className={cls}
              onClick={() => handleSelect(idx)}
              disabled={answered}
            >
              <span className={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
              <span className={styles.optionText}>{typeof opt === "string" ? opt : opt.label}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={styles.feedback}>
          {isAxesQuiz ? (
            <div className={styles.explanation}>
              <strong>Lectura provisional:</strong> esta respuesta desplaza tu posición en el eje
              {q.type === "axis" && q.axis === "economic" ? " económico" : " sociocultural"}.
            </div>
          ) : (
            <div className={styles.explanation}>
              <strong>Explicación:</strong> {"explanation" in q ? q.explanation : ""}
            </div>
          )}
          <button className="btn-primary" onClick={handleNext}>
            {currentQ < quiz.questions.length - 1 ? "Siguiente →" : isAxesQuiz ? "Ver posición" : "Ver resultados"}
          </button>
        </div>
      )}
    </div>
  );
}
