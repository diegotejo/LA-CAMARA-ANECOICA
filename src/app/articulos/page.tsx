import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";
import SpotlightCard from "@/components/SpotlightCard";
import { articles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Textos y Ensayos",
  description:
    "Archivo editorial de mini ensayos y textos de La Cámara Anecoica, conectado con el trabajo audiovisual del canal.",
};

export default function ArticulosPage() {
  return (
    <div className={`container ${styles.page} mixToneCopy`}>
      <header className={styles.header}>
        <p className={styles.label}>Editorial</p>
        <h1 className={styles.title}>Textos y Ensayos</h1>
        <p className={styles.intro}>
          El archivo escrito amplía, matiza o reorganiza ideas ya presentes en los vídeos. No replica
          el formato audiovisual: lo vuelve lectura, argumento y desarrollo.
        </p>
      </header>

      <section className={styles.list}>
        {articles.map((article, index) => (
          <SpotlightCard key={article.id} className={styles.card}>
            <article className={styles.cardInner}>
              <div className={styles.cardTop}>
                <span className={styles.cardNumber}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.cardLabel}>{article.label}</span>
              </div>

              <h2 className={styles.cardTitle}>
                <Link href={`/articulos/${article.slug}`}>{article.title}</Link>
              </h2>

              <p className={styles.cardExcerpt}>{article.excerpt}</p>

              <div className={styles.cardMeta}>
                <span>
                  {new Date(article.publishedDate).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span>{article.relatedVideoTitle}</span>
              </div>

              <Link href={`/articulos/${article.slug}`} className={styles.cardLink}>
                Leer ensayo →
              </Link>
            </article>
          </SpotlightCard>
        ))}
      </section>
    </div>
  );
}
