"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";
import BrandLogo from "./BrandLogo";

import { motion } from "framer-motion";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/mapamundi-politico", label: "Mapamundi político" },
  { href: "/videos", label: "Vídeos" },
  { href: "/cuestionarios", label: "Cuestionarios" },
  { href: "/articulos", label: "Artículos" },
  { href: "/sobre", label: "Sobre el proyecto" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo}>
          <BrandLogo className={styles.logoMark} />
          <span className={styles.logoText}>
            <span className="serif-accent">La</span> Cámara Anecoica
          </span>
        </Link>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú de navegación"
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <nav id="site-navigation" className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.link} ${isActive ? styles.linkActive : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className={styles.activeIndicator}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={styles.linkLabel}>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
