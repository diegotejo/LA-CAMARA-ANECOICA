"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function RelativityGrid() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalizar coordenadas entre -1 y 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1, // Just behind content
        pointerEvents: "none",
        perspective: "1000px",
        overflow: "hidden",
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.04), rgba(255,255,255,0) 52%), var(--color-bg)",
      }}
    >
      <motion.div
        animate={{
          rotateX: 60 + mousePosition.y * 10,
          rotateY: mousePosition.x * 10,
          rotateZ: mousePosition.x * 2,
        }}
        transition={{ type: "spring", damping: 50, stiffness: 100 }}
        style={{
          width: "200vw",
          height: "200vh",
          position: "absolute",
          top: "-50%",
          left: "-50%",
          // Genera la cuadrícula con contraste suave
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          // Máscara radial más amplia
          maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
        }}
      />
      {/* Glow de acento central (Agujero negro luminoso) */}
      <motion.div
        animate={{
          x: mousePosition.x * 30,
          y: mousePosition.y * 30,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 50 }}
        style={{
          position: "absolute",
          width: "40vw",
          height: "40vw",
          background: "radial-gradient(circle, rgba(198, 155, 116, 0.2) 0%, rgba(255,255,255,0.06) 34%, transparent 68%)",
          filter: "blur(60px)",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}
