// Bundle budget gate for the motion/GL/physics layers.
//
// Two invariants, both computed from Vite's manifest (source-key based, so
// chunk file naming can't dodge the check):
//   1. Isolation — no entry or page chunk statically reaches a motion source;
//      motion payloads must sit behind dynamic imports only (reduced-motion
//      visitors download zero motion bytes).
//   2. Budget — each motion feature's gz payload (its chunk plus static
//      imports not already reachable from the base graph) stays under its
//      declared budget. A motion source with no declared budget fails: add
//      one here when adding a feature.
//
// Run after `vite build` (or bin/vite build): node scripts/perf/bundle-budget.mjs
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')

// vite_ruby writes to a per-env public output dir (vite, vite-test, vite-dev).
// Honor an explicit override, else use the most recently built manifest so the
// script measures whatever `bin/vite build` just produced (CI test job builds
// with RAILS_ENV=test → public/vite-test).
function resolveViteDir() {
  const override = process.env.VITE_RUBY_PUBLIC_OUTPUT_DIR
  const candidates = override ? [override] : ['vite', 'vite-test', 'vite-dev']
  const found = candidates
    .map((dir) => join(ROOT, 'public', dir))
    .filter((dir) => existsSync(join(dir, '.vite/manifest.json')))
    .sort(
      (a, b) =>
        statSync(join(b, '.vite/manifest.json')).mtimeMs -
        statSync(join(a, '.vite/manifest.json')).mtimeMs,
    )
  if (found.length === 0) {
    console.error(
      `bundle-budget: no .vite/manifest.json under public/{${candidates.join(',')}} — run bin/vite build first`,
    )
    process.exit(1)
  }
  return found[0]
}

const VITE_DIR = resolveViteDir()
const MANIFEST = join(VITE_DIR, '.vite/manifest.json')

// gz kB budgets per motion feature (manifest source key).
const BUDGETS_KB = {
  'story/assembly/motion/index.ts': 60,
  'story/retheme/motion.ts': 35,
  'story/night/motion/index.ts': 45,
  'ds/motion/fx/index.ts': 12,
  'system/playground-physics/motion/index.ts': 40,
}

// A manifest key counts as a motion source when it lives in a motion/ dir,
// is a motion.ts(x) file, or is part of the fx layer. Route chunks under
// pages/ are never motion sources (pages/system/motion.tsx is a doc page).
function isMotionSource(key) {
  if (key.startsWith('pages/')) return false
  return /(^|\/)motion(\/index)?\.tsx?$/.test(key) || key.startsWith('ds/motion/fx/')
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))

function staticClosure(startKeys) {
  const seen = new Set()
  const queue = [...startKeys]
  while (queue.length > 0) {
    const key = queue.pop()
    if (seen.has(key)) continue
    seen.add(key)
    for (const imp of manifest[key]?.imports ?? []) queue.push(imp)
  }
  return seen
}

function gzKb(key) {
  const file = manifest[key]?.file
  if (!file) return 0
  return gzipSync(readFileSync(join(VITE_DIR, file))).length / 1024
}

const errors = []

const motionSources = Object.keys(manifest).filter(isMotionSource)
const baseKeys = Object.keys(manifest).filter(
  (k) => manifest[k].isEntry || (k.startsWith('pages/') && !isMotionSource(k)),
)

// ── 1. Isolation ────────────────────────────────────────────────────────────

const baseReachable = staticClosure(baseKeys)
for (const key of motionSources) {
  if (baseReachable.has(key)) {
    errors.push(
      `motion source '${key}' is statically reachable from a page/entry chunk — it must be behind a dynamic import`,
    )
  }
}

// ── 2. Budgets ──────────────────────────────────────────────────────────────

for (const key of motionSources) {
  const budget = BUDGETS_KB[key]
  if (budget === undefined) {
    errors.push(
      `motion source '${key}' has no budget in scripts/perf/bundle-budget.mjs — declare one`,
    )
    continue
  }
  const payloadKeys = [...staticClosure([key])].filter((k) => !baseReachable.has(k))
  const totalKb = payloadKeys.reduce((sum, k) => sum + gzKb(k), 0)
  const detail = payloadKeys.map((k) => `${k} (${gzKb(k).toFixed(1)}kB)`).join(', ')
  if (totalKb > budget) {
    errors.push(
      `'${key}' payload ${totalKb.toFixed(1)}kB gz exceeds budget ${budget}kB — ${detail}`,
    )
  } else {
    console.log(`ok  ${key}: ${totalKb.toFixed(1)}kB gz / ${budget}kB budget`)
  }
}

if (errors.length > 0) {
  console.error('\nBundle budget failures:\n')
  for (const e of errors) console.error(`  ✗ ${e}`)
  process.exit(1)
}
console.log('\nbundle budgets green')
