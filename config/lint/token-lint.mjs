import { readdir, readFile } from 'node:fs/promises'
import { join, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const VALID_EXTENSIONS = new Set(['.css', '.ts', '.tsx', '.erb'])

/**
 * @typedef {{ file: string, line: number, text: string }} Hit
 */

/**
 * Recursively scan directories for lines referencing `--raw-` tokens.
 *
 * Skipped automatically:
 *   - Any path whose basename is `node_modules`
 *   - Any path matching an entry in `options.skip` (directory and descendants)
 *   - Any file whose name contains `.test.` (e.g. `Foo.test.tsx`)
 *
 * Only files with extensions `.css .ts .tsx .erb` are read.
 *
 * @param {string[]} roots - Absolute directory paths to scan
 * @param {{ skip?: string[] }} [options]
 * @returns {Promise<Hit[]>}
 */
export async function scanForRawTokens(roots, { skip = [] } = {}) {
  /** @type {Hit[]} */
  const hits = []

  /**
   * @param {string} dir
   */
  async function walk(dir) {
    // Skip explicitly excluded directories (and their descendants)
    if (skip.some((s) => dir === s || dir.startsWith(s + sep))) return

    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue
        await walk(fullPath)
        continue
      }

      if (!entry.isFile()) continue

      // Skip test files (*.test.*)
      if (/\.test\./.test(entry.name)) continue

      // Only scan valid extensions
      if (!VALID_EXTENSIONS.has(extname(entry.name))) continue

      const content = await readFile(fullPath, 'utf8')
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('--raw-')) {
          hits.push({ file: fullPath, line: i + 1, text: lines[i].trim() })
        }
      }
    }
  }

  for (const root of roots) {
    await walk(root)
  }

  return hits
}

// CLI entry-point guard — only runs when invoked directly via `node token-lint.mjs`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cwd = process.cwd()

  const roots = [join(cwd, 'app/frontend'), join(cwd, 'app/views')]

  // The token engine source dir legitimately contains raw-token strings:
  // emitter code, token JSONs, README, and generated output all live here.
  const skip = [join(cwd, 'app/frontend/ds/tokens')]

  const hits = await scanForRawTokens(roots, { skip })

  if (hits.length > 0) {
    for (const { file, line, text } of hits) {
      console.log(`${file}:${line}: ${text}`)
    }
    console.error(`\n${hits.length} raw-token violation${hits.length === 1 ? '' : 's'} found`)
    process.exit(1)
  } else {
    console.log('No raw-token violations found')
    process.exit(0)
  }
}
