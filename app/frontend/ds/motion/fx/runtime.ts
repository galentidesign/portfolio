// Shared GSAP runtime for the fx layer.
//
// gsap and the token-ease registry arrive via dynamic import (top-level
// await), NOT static imports: scripts/perf/bundle-budget.mjs charges each
// motion feature for its static closure, and the fx budget (12kB gz) covers
// only this layer's own code — the shared gsap chunk is billed to the heavy
// motion features that register real budgets for it. The bytes still move
// only in motion mode: this module is reachable solely through the fx
// barrel's dynamic import chain (useFx), never from a base bundle.
const [{ gsap }, { registerTokenEases, tokenDuration }] = await Promise.all([
  import('gsap'),
  import('../gsapPlugins'),
])

// Token eases ('token-enter' … 'token-spring') are live the moment the fx
// layer loads. registerEase overwrites by name, so the retheme motion
// module's re-run after a skin flip keeps fx tweens token-true too.
registerTokenEases()

/** Cursor-driven fx only make sense with a hovering fine pointer. */
export function hasFinePointer(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

/** Inert handle for mounts that decline to attach (e.g. coarse pointers). */
export const noopHandle = { destroy: (): void => {} }

export { gsap, tokenDuration }
