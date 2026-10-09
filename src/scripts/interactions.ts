/**
 * Interactions 3D — sobres, performantes, accessibles.
 *
 * 1. Tilt : les éléments `.tilt` s'inclinent légèrement vers le pointeur
 *    (variables CSS --rx/--ry) et un reflet suit le curseur (--gx/--gy).
 * 2. Reveal : IntersectionObserver ajoute `.in-view` aux `.reveal`.
 * 3. Parallaxe : les éléments `[data-parallax]` glissent très légèrement
 *    au scroll (variable CSS --par-y, amplitude bornée).
 *
 * Tout respecte prefers-reduced-motion et reste inerte au clavier
 * comme sur écran tactile (aucun contenu n'en dépend).
 */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)");

const MAX_TILT_DEG = 2.75;

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

/**
 * Parallaxe de profondeur au scroll : décalage vertical doux (≤ 14 px),
 * proportionnel à la distance au centre de l'écran. Décoratif uniquement.
 */
function setupParallax(): void {
  if (reducedMotion.matches || !hoverCapable.matches) return;
  const layers = document.querySelectorAll<HTMLElement>("[data-parallax]");
  if (layers.length === 0) return;

  const MAX_SHIFT_PX = 14;
  let frame = 0;

  const update = () => {
    frame = 0;
    const mid = window.innerHeight / 2;
    layers.forEach((el) => {
      const speed = Number(el.dataset.parallax) || 0.05;
      const rect = el.getBoundingClientRect();
      const delta = (mid - (rect.top + rect.height / 2)) * speed;
      const clamped = Math.max(-MAX_SHIFT_PX, Math.min(MAX_SHIFT_PX, delta));
      el.style.setProperty("--par-y", `${clamped.toFixed(1)}px`);
    });
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!frame) frame = requestAnimationFrame(update);
    },
    { passive: true },
  );
  update();
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

/** Native fragment links keep history, keyboard navigation and no-JS support.
 * Only the current-section indicator needs JavaScript; it never rewrites URLs.
 */
function setupSectionNavigation(): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-section-link]'))
    .filter(link => link.origin === location.origin && link.pathname === location.pathname);
  if (!links.length) return;
  const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section[id]'));
  const header = document.querySelector<HTMLElement>('[data-elevate-on-scroll]');
  let frame = 0;
  const update = () => {
    frame = 0;
    const threshold = (header?.getBoundingClientRect().height || 64) + 48;
    let current = '';
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= threshold) current = section.id;
    }
    for (const link of links) {
      if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('hashchange', schedule);
  update();
}

document.documentElement.classList.remove("no-js");
setupTilt();
setupReveal();
setupParallax();
setupHeaderElevation();
setupSectionNavigation();
