"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function RelativityGrid() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTouch, setIsTouch] = useState(true);
  const [preferStatic, setPreferStatic] = useState(true);

  useEffect(() => {
    const pointerQuery = window.matchMedia("(hover: none), (pointer: coarse)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;

    const syncCapability = () => {
      const isPointerCoarse = pointerQuery.matches;
      const isReducedMotion = reducedMotionQuery.matches;
      const saveDataEnabled = connection?.saveData === true;

      setIsTouch(isPointerCoarse);
      setPreferStatic(isPointerCoarse || isReducedMotion || saveDataEnabled);
    };

    syncCapability();

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePosition({ x, y });
    };

    pointerQuery.addEventListener("change", syncCapability);
    reducedMotionQuery.addEventListener("change", syncCapability);

    if (!preferStatic) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      pointerQuery.removeEventListener("change", syncCapability);
      reducedMotionQuery.removeEventListener("change", syncCapability);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [preferStatic]);

  if (preferStatic) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          pointerEvents: "none",
          overflow: "hidden",
          width: "100vw",
          height: "100vh",
          background:
            "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.04), rgba(255,255,255,0) 52%), var(--color-bg)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-25%",
            backgroundImage:
              "linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
            backgroundSize: "96px 96px",
            maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
          }}
        />
      </div>
    );
  }

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
          rotateX: 60 + mousePosition.y * (isTouch ? 2 : 10),
          rotateY: mousePosition.x * (isTouch ? 2 : 10),
          rotateZ: mousePosition.x * (isTouch ? 0.6 : 2),
        }}
        transition={{ type: "spring", damping: 50, stiffness: 100 }}
        style={{
          width: "200vw",
          height: "200vh",
          position: "absolute",
          top: "-50%",
          left: "-50%",
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
        }}
      />
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
          filter: isTouch ? "blur(36px)" : "blur(60px)",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}
