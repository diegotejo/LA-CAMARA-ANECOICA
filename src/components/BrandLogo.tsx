import Image from "next/image";
import styles from "./BrandLogo.module.css";

interface BrandLogoProps {
  className?: string;
  variant?: "default" | "white";
  priority?: boolean;
  alt?: string;
  animated?: boolean;
}

export default function BrandLogo({
  className,
  variant = "default",
  priority = false,
  alt = "Logo de La Camara Anecoica",
  animated,
}: BrandLogoProps) {
  const shouldAnimate =
    animated ?? process.env.NEXT_PUBLIC_ENABLE_HEADER_LOGO_MOTION === "true";

  const src =
    variant === "white"
      ? "/brand/logo-anecoica-white.png"
      : "/brand/logo-anecoica.png";

  return (
    <span
      className={`${styles.wrap} ${shouldAnimate ? styles.motionEnabled : ""} ${className || ""}`.trim()}
    >
      <span className={styles.fxLayer} aria-hidden="true" />
      <Image
        src={src}
        alt={alt}
        width={640}
        height={360}
        priority={priority}
        className={styles.image}
      />
    </span>
  );
}
