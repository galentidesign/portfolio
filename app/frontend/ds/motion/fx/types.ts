// Shared contract for the sitewide micro-interaction layer (R3).
//
// Each fx module is a framework-free mount function living in this directory:
//   mountMagnetic(el, opts) => FxHandle
// so React usage is a thin hook that (a) checks useMotionPref().reduced and
// mounts nothing when true, (b) destroys on unmount. fx modules are imported
// only from dynamic motion chunks or lazy fx chunks — never base bundles.

export interface FxHandle {
  destroy: () => void
}
