"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll progress bar
    const progressBar = document.getElementById("scroll-progress");
    const updateProgress = () => {
      if (!progressBar) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = `${pct}%`;
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    // Intersection Observer for reveals
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll(
        ".reveal:not(.visible), .reveal-scale:not(.visible)"
      );
      if (elements.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -20px 0px" }
      );

      elements.forEach((el) => observer.observe(el));
    }, 80);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", updateProgress);
    };
  }, [pathname]);

  return <div id="scroll-progress" />;
}
