// fx barrel — the single dynamic-import entry for the sitewide
// micro-interaction layer. The whole layer ships as one lazy chunk (budgeted
// in scripts/perf/bundle-budget.mjs under this file's manifest key); React
// consumers reach it only through useFx, which gates on reduced motion.
export { mountMagnetic, type MagneticOptions } from './magnetic'
export { mountProximityGlow } from './proximityGlow'
export { mountReveal, type RevealOptions } from './reveal'
export { mountMarquee } from './marquee'
export type { FxHandle } from './types'
