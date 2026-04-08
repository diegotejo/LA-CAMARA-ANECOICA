import Image from "next/image";
import styles from "./HeroGlitchLogo.module.css";

interface HeroGlitchLogoProps {
  className?: string;
  priority?: boolean;
}

const faces = [
  { key: "lenin", src: "/brand/portraits/lenin.png", className: styles.faceLenin },
  { key: "napoleon", src: "/brand/portraits/napoleon.png", className: styles.faceNapoleon },
  { key: "aristoteles", src: "/brand/portraits/aristoteles.png", className: styles.faceAristoteles },
  { key: "isabel", src: "/brand/portraits/isabel.png", className: styles.faceIsabel },
];

export default function HeroGlitchLogo({ className, priority = false }: HeroGlitchLogoProps) {
  return (
    <div className={`${styles.stage} ${className || ""}`.trim()} aria-hidden="true">
      <div className={`${styles.layer} ${styles.logoBase}`}>
        <Image
          src="/brand/logo-anecoica.png"
          alt=""
          fill
          sizes="(max-width: 768px) 88vw, 520px"
          priority={priority}
          className={styles.image}
        />
      </div>

      <div className={`${styles.layer} ${styles.glitch} ${styles.glitchOne}`}>
        <Image
          src="/brand/logo-anecoica.png"
          alt=""
          fill
          sizes="(max-width: 768px) 88vw, 520px"
          className={styles.image}
        />
      </div>
      <div className={`${styles.layer} ${styles.glitch} ${styles.glitchTwo}`}>
        <Image
          src="/brand/logo-anecoica.png"
          alt=""
          fill
          sizes="(max-width: 768px) 88vw, 520px"
          className={styles.image}
        />
      </div>

      {faces.map((face) => (
        <div key={face.key} className={`${styles.layer} ${styles.face} ${face.className}`}>
          <Image
            src={face.src}
            alt=""
            fill
            sizes="(max-width: 768px) 88vw, 520px"
            className={styles.image}
          />
        </div>
      ))}
    </div>
  );
}
