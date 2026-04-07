import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.inner}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Señal no encontrada</h1>
        <p className={styles.desc}>
          La página que buscas no existe en este archivo. Es posible que haya
          sido trasladada, eliminada o que la dirección sea incorrecta.
        </p>
        <Link href="/" className="btn-outline">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
