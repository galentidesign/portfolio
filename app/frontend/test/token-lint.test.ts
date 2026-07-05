import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import stylelint from 'stylelint'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { scanForRawTokens } from '../../../config/lint/token-lint.mjs'

// Absolute path to the plugin — resolved from CWD so it works in jsdom env
// where import.meta.url is not a file:// URL.
const pluginPath = join(process.cwd(), 'config/lint/no-raw-tokens.mjs')

const lintConfig: stylelint.Config = {
  plugins: [pluginPath],
  rules: { 'portfolio/no-raw-tokens': true },
}

// ---------------------------------------------------------------------------
// stylelint rule: portfolio/no-raw-tokens
// ---------------------------------------------------------------------------

describe('portfolio/no-raw-tokens stylelint rule', () => {
  it('flags consuming a raw token via var(--raw-*)', async () => {
    const { results } = await stylelint.lint({
      code: 'a { color: var(--raw-color-cream-100); }',
      config: lintConfig,
    })
    expect(results[0].warnings).toHaveLength(1)
    expect(results[0].warnings[0].text).toContain('Raw tokens live only in generated token CSS')
  })

  it('flags declaring a --raw-* custom property', async () => {
    const { results } = await stylelint.lint({
      code: ':root { --raw-color-foo: #fff; }',
      config: lintConfig,
    })
    expect(results[0].warnings).toHaveLength(1)
    expect(results[0].warnings[0].text).toContain('Raw tokens live only in generated token CSS')
  })

  it('passes semantic-only CSS with no warnings', async () => {
    const { results } = await stylelint.lint({
      code: 'a { color: var(--color-ink); border-radius: var(--radius-control); }',
      config: lintConfig,
    })
    expect(results[0].warnings).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// sweep: scanForRawTokens
// ---------------------------------------------------------------------------

describe('scanForRawTokens', () => {
  let tmpDir: string

  beforeAll(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'token-lint-'))

    // Hit: .tsx with a raw token in an inline style
    await writeFile(
      join(tmpDir, 'Component.tsx'),
      `export function Comp() {\n  return <div style={{ color: 'var(--raw-color-cream)' }} />\n}\n`,
    )

    // Hit: .css with var(--raw-…)
    await writeFile(join(tmpDir, 'styles.css'), `.thing {\n  color: var(--raw-color-ink);\n}\n`)

    // Skip: file under ds/tokens/generated/ — legitimately contains raw strings
    await mkdir(join(tmpDir, 'ds', 'tokens', 'generated'), { recursive: true })
    await writeFile(
      join(tmpDir, 'ds', 'tokens', 'generated', 'skin.css'),
      `[data-skin='galenti'] {\n  --raw-color-ink: #1a1a1a;\n  --color-ink: var(--raw-color-ink);\n}\n`,
    )

    // Skip: *.test.tsx — test fixtures may reference raw tokens by name
    await writeFile(
      join(tmpDir, 'Component.test.tsx'),
      `it('uses raw token', () => expect('var(--raw-color-cream)').toBeTruthy())\n`,
    )

    // Clean: no raw tokens — should not appear in hits
    await writeFile(
      join(tmpDir, 'Clean.tsx'),
      `export function Clean() {\n  return <div style={{ color: 'var(--color-ink)' }} />\n}\n`,
    )
  })

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('reports a hit for a .tsx file containing --raw-', async () => {
    const hits = await scanForRawTokens([tmpDir], {
      skip: [join(tmpDir, 'ds', 'tokens')],
    })
    const tsxHit = hits.find((h) => h.file === join(tmpDir, 'Component.tsx'))
    expect(tsxHit).toBeDefined()
    expect(tsxHit?.line).toBe(2)
    expect(tsxHit?.text).toContain('--raw-color-cream')
  })

  it('reports a hit for a .css file containing --raw-', async () => {
    const hits = await scanForRawTokens([tmpDir], {
      skip: [join(tmpDir, 'ds', 'tokens')],
    })
    const cssHit = hits.find((h) => h.file === join(tmpDir, 'styles.css'))
    expect(cssHit).toBeDefined()
    expect(cssHit?.line).toBe(2)
    expect(cssHit?.text).toContain('--raw-color-ink')
  })

  it('skips files under the ds/tokens skip path', async () => {
    const hits = await scanForRawTokens([tmpDir], {
      skip: [join(tmpDir, 'ds', 'tokens')],
    })
    const generatedHit = hits.find((h) => h.file.includes('generated'))
    expect(generatedHit).toBeUndefined()
  })

  it('skips *.test.* files', async () => {
    const hits = await scanForRawTokens([tmpDir], {
      skip: [join(tmpDir, 'ds', 'tokens')],
    })
    const testHit = hits.find((h) => h.file.includes('.test.'))
    expect(testHit).toBeUndefined()
  })

  it('returns no hits for clean files', async () => {
    const hits = await scanForRawTokens([tmpDir], {
      skip: [join(tmpDir, 'ds', 'tokens')],
    })
    const cleanHit = hits.find((h) => h.file === join(tmpDir, 'Clean.tsx'))
    expect(cleanHit).toBeUndefined()
  })

  it('returns exactly 2 hits total (Component.tsx + styles.css)', async () => {
    const hits = await scanForRawTokens([tmpDir], {
      skip: [join(tmpDir, 'ds', 'tokens')],
    })
    expect(hits).toHaveLength(2)
  })

  it('formats hits as { file, line, text }', async () => {
    const hits = await scanForRawTokens([tmpDir], {
      skip: [join(tmpDir, 'ds', 'tokens')],
    })
    for (const hit of hits) {
      expect(typeof hit.file).toBe('string')
      expect(typeof hit.line).toBe('number')
      expect(typeof hit.text).toBe('string')
    }
  })
})
