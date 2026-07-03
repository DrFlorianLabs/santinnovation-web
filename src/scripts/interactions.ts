/**
 * Interactions 3D — sobres, performantes, accessibles.
 *
 * 1. Tilt : les éléments `.tilt` s'inclinent légèrement vers le pointeur
 *    (variables CSS --rx/--ry) et un reflet suit le curseur (--gx/--gy).
 * 2. Reveal : IntersectionObserver ajoute `.in-view` aux `.reveal`.
 *
 * Les deux respectent prefers-reduced-motion et sont inertes au clavier
 * comme sur écran tactile (aucun contenu n'en dépend).
 */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)");

const MAX_TILT_DEG = 5;

function setupTilt(): void {
  if (reducedMotion.matches || !hoverCapable.matches) return;

  document.querySelectorAll<HTMLElement>(".tilt").forEach((el) => {
    let frame = 0;

    el.addEventListener("pointermove", (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width; // 0..1
        const py = (e.clientY - rect.top) / rect.height; // 0..1
        el.style.setProperty("--ry", `${((px - 0.5) * 2 * MAX_TILT_DEG).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${((0.5 - py) * 2 * MAX_TILT_DEG).toFixed(2)}deg`);
        el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
      });
    });

    el.addEventListener("pointerleave", () => {
      cancelAnimationFrame(frame);
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  });
}

function setupReveal(): void {
  const targets = document.querySelectorAll<HTMLElement>(".reveal");
  if (targets.length === 0) return;

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );

  targets.forEach((el) => observer.observe(el));
}

function setupHeaderElevation(): void {
  const header = document.querySelector<HTMLElement>("[data-elevate-on-scroll]");
  if (!header) return;
  const update = () => {
    header.dataset.elevated = window.scrollY > 8 ? "true" : "false";
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
}

document.documentElement.classList.remove("no-js");
setupTilt();
setupReveal();
setupHeaderElevation();
