import Link from "next/link";
import styles from "./Footer.module.css";
import BrandLogo from "./BrandLogo";
import { siteConfig } from "@/lib/site-config";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.brandHeader}>
              <BrandLogo className={styles.logoMark} variant="white" />
              <h3 className={styles.title}>
                <span className="serif-accent">La</span> Cámara Anecoica
              </h3>
            </div>
          </div>

          <div className={styles.linksGroup}>
            <div className={styles.linkColumn}>
              <h4 className={styles.columnTitle}>Archivo</h4>
              <Link href="/videos" className={styles.link}>Vídeos</Link>
              <Link href="/mapamundi-politico" className={styles.link}>Mapamundi político</Link>
              <Link href="/cuestionarios" className={styles.link}>Cuestionarios</Link>
              <Link href="/articulos" className={styles.link}>Artículos</Link>
            </div>
            <div className={styles.linkColumn}>
              <h4 className={styles.columnTitle}>Comunidad</h4>
              <a
                href={siteConfig.youtubeChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                YouTube ↗
              </a>
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Instagram ↗
              </a>
              <Link href="/sobre" className={styles.link}>Manifiesto</Link>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>
            © {new Date().getFullYear()} La Cámara Anecoica. Rigor, sobriedad y pensamiento crítico.
          </p>
        </div>
      </div>
    </footer>
  );
}
