/**
 * Shared Framer Motion variants and helpers.
 * All animations respect prefers-reduced-motion.
 */

/** Check reduced-motion preference once at load time */
export const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── EASING CURVES ─────────────────────────────────────
   ease-out-quint: fast off the mark, graceful deceleration.
   Feels decisive and confident — not robotic, not bouncy.
   ─────────────────────────────────────────────────────── */
const EASE_OUT = [0.22, 1, 0.36, 1];

/* ── FADE UP (default section / element reveal) ───────── */
export const fadeUp = {
  hidden: prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 32 },
  visible: prefersReducedMotion
    ? { opacity: 1, transition: { duration: 0.01 } }
    : {
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease: EASE_OUT },
      },
};

/* ── FADE IN (no vertical motion) ─────────────────────── */
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: prefersReducedMotion
    ? { opacity: 1, transition: { duration: 0.01 } }
    : {
        opacity: 1,
        transition: { duration: 0.5, ease: EASE_OUT },
      },
};

/* ── STAGGER CONTAINER ────────────────────────────────── */
export const staggerContainer = (staggerAmount = 0.08) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : staggerAmount,
    },
  },
});

/* ── STAGGER ITEM (child of a stagger container) ──────── */
export const staggerItem = {
  hidden: prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 20 },
  visible: prefersReducedMotion
    ? { opacity: 1, transition: { duration: 0.01 } }
    : {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: EASE_OUT },
      },
};

/* ── SCALE-IN (for image / hero picture) ──────────────── */
export const scaleIn = {
  hidden: prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.9 },
  visible: prefersReducedMotion
    ? { opacity: 1, transition: { duration: 0.01 } }
    : {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.6, ease: EASE_OUT },
      },
};

/* ── SHARED VIEWPORT CONFIG ───────────────────────────── */
export const defaultViewport = { once: true, amount: 0.15 };
