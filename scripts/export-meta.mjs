/**
 * export-meta.mjs
 *
 * Reads every app/frontend/ds/components/*\/meta.ts via tsx dynamic import,
 * then prints to stdout a JSON array sorted by slug:
 *   [{ dir, slug, name, tier, description, variants, props }]
 *
 * Used by `npm run meta:export` and `rake manifest:verify`.
 */

import { readdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const COMPONENTS_DIR = join(ROOT, 'app/frontend/ds/components')

async function main() {
  const entries = await readdir(COMPONENTS_DIR, { withFileTypes: true })
  const dirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()

  const results = []

  for (const dir of dirs) {
    const metaPath = join(COMPONENTS_DIR, dir, 'meta.ts')
    if (!existsSync(metaPath)) continue

    const module = await import(metaPath)
    const { meta } = module

    results.push({
      dir,
      slug: meta.slug,
      name: meta.name,
      tier: meta.tier,
      description: meta.description,
      variants: Object.fromEntries(Object.entries(meta.variants).map(([k, v]) => [k, [...v]])),
      props: meta.props.map((p) => {
        const out = { name: p.name, type: p.type }
        if (p.default !== undefined) out.default = p.default
        out.description = p.description
        return out
      }),
    })
  }

  // Sort by slug (alphabetical)
  results.sort((a, b) => a.slug.localeCompare(b.slug))

  process.stdout.write(JSON.stringify(results, null, 2) + '\n')
}

main().catch((e) => {
  process.stderr.write(String(e) + '\n')
  process.exit(1)
})
