import Image from "next/image";
import styles from "./BrandLogo.module.css";

interface BrandLogoProps {
  className?: string;
  variant?: "default" | "white";
  priority?: boolean;
  alt?: string;
}

export default function BrandLogo({
  className,
  variant = "default",
  priority = false,
  alt = "Logo de La Camara Anecoica",
}: BrandLogoProps) {
  const src =
    variant === "white"
      ? "/brand/logo-anecoica-white.png"
      : "/brand/logo-anecoica.png";

  return (
    <span className={`${styles.wrap} ${className || ""}`.trim()}>
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
