// Lighthouse budget check (§9.1 stage 5, local runner).
//
//   npm run perf:lighthouse -- --base http://127.0.0.1:3001
//   npm run perf:lighthouse -- --base https://staging.example --min 95
//
// Runs mobile + desktop against the core routes and fails unless every
// category scores at or above the budget on every route. Writes the raw
// score matrix to tmp/lighthouse/ for receipts. Uses the system Chrome;
// set CHROME_PATH to point elsewhere (e.g. a Playwright Chromium).

import { mkdirSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import * as chromeLauncher from 'chrome-launcher'

const { values: args } = parseArgs({
  options: {
    base: { type: 'string' },
    min: { type: 'string', default: '95' },
    routes: { type: 'string' },
  },
})

if (!args.base) {
  console.error('Usage: npm run perf:lighthouse -- --base <url> [--min 95] [--routes /a,/b]')
  process.exit(2)
}

const BASE = args.base.replace(/\/$/, '')
const MIN = Number(args.min)
const ROUTES = args.routes
  ? args.routes.split(',')
  : [
      '/',
      '/work',
      '/work/agentic-design-ops',
      '/work/shadcn-to-polaris',
      '/system',
      '/system/components/button',
      '/resume',
    ]
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const PRESETS = [
  { name: 'mobile', config: undefined },
  { name: 'desktop', config: desktopConfig },
]

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] })
const results = []
let failed = false

try {
  for (const preset of PRESETS) {
    for (const route of ROUTES) {
      const url = `${BASE}${route}`
      const runnerResult = await lighthouse(
        url,
        { port: chrome.port, output: 'json', logLevel: 'error' },
        preset.config,
      )
      const scores = Object.fromEntries(
        CATEGORIES.map((c) => [c, Math.round((runnerResult.lhr.categories[c]?.score ?? 0) * 100)]),
      )
      const pass = CATEGORIES.every((c) => scores[c] >= MIN)
      if (!pass) failed = true
      results.push({ route, preset: preset.name, scores, pass })
      const cells = CATEGORIES.map((c) => `${c.slice(0, 4)} ${scores[c]}`).join('  ')
      console.log(
        `${pass ? 'PASS' : 'FAIL'}  ${preset.name.padEnd(7)} ${route.padEnd(28)} ${cells}`,
      )
    }
  }
} finally {
  chrome.kill()
}

mkdirSync('tmp/lighthouse', { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const artifact = `tmp/lighthouse/${stamp}.json`
writeFileSync(artifact, JSON.stringify({ base: BASE, min: MIN, results }, null, 2))
console.log(
  `\n${failed ? `FAIL: at least one score below ${MIN}` : `PASS: all scores >= ${MIN}`} (${artifact})`,
)
process.exit(failed ? 1 : 0)
