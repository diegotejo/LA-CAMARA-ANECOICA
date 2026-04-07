import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import styles from "./page.module.css";
import SpotlightCard from "@/components/SpotlightCard";
import { articles, getArticleBySlug } from "@/lib/articles";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return { title: "Artículo no encontrado" };
  }

  return {
    title: article.title,
    description: article.excerpt,
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.backRow}>
        <Link href="/articulos" className={styles.backLink}>
          ← Volver al archivo escrito
        </Link>
      </div>

      <div className={styles.articleLayout}>
        <aside>
          <SpotlightCard className={styles.articleMetaCard}>
            <p className={styles.articleLabel}>{article.label}</p>
            <h1 className={styles.articleTitle}>{article.title}</h1>
            <p className={styles.articleExcerpt}>{article.excerpt}</p>
            <div className={styles.metaBlock}>
              <span>Procedencia audiovisual</span>
              <a href={article.relatedVideoUrl} target="_blank" rel="noopener noreferrer">
                {article.relatedVideoTitle} ↗
              </a>
            </div>
            <div className={styles.metaBlock}>
              <span>Fecha de referencia</span>
              <strong>
                {new Date(article.publishedDate).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </strong>
            </div>
          </SpotlightCard>
        </aside>

        <article className={styles.articleBody}>
          {article.sections.map((section) => (
            <section key={section.title} className={styles.articleSection}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
