import { useEffect } from "react";

// Counts the leading integer of each [data-count] cell up from 0, once, at >=50% visible.
// Final text is already in the prerendered HTML; this is enhancement only.
export function useCountUp() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cells = document.querySelectorAll<HTMLElement>("[data-motion=numbers-count] [data-count]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          const el = e.target as HTMLElement;
          const m = /^(\d+)(.*)$/.exec(el.dataset.count ?? "");
          if (!m) continue; // [PLACEHOLDER] etc. stay static
          const end = Number(m[1]);
          const rest = m[2];
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - t0) / 1000, 1);
            const v = Math.round(end * (1 - (1 - p) ** 3));
            el.textContent = p < 1 ? v + rest : el.dataset.count!;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );
    cells.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);
}
