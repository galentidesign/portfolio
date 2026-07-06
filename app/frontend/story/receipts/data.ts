/**
 * Agent-build receipt data — one entry per milestone session, m0 through m9.
 * Hand-materialized from docs/receipts/; no runtime filesystem access.
 * Source files: docs/receipts/2026-07-04-m0.md .. 2026-07-06-m9.md.
 */

import type { MilestoneReceipt } from './types'

export const receipts: MilestoneReceipt[] = [
  {
    id: 'm0',
    date: '2026-07-04',
    sourcePath: 'docs/receipts/2026-07-04-m0.md',
    title: 'repo bootstrap',
    goal: 'Rails 8.1 + Inertia + React 19/TS + Vite skeleton with three test harnesses, lint wall, leak-check gate, CI, and deploy blueprint.',
    // The receipt states no count; the milestone's full span in git history.
    commits: 11,
    range: '91e4b43..736bad4',
    agents: [{ tier: 'frontier', count: 1, role: 'orchestrator' }],
    suite: { unit: 1, rspec: 2, e2e: 2 },
    moments: [
      'Ruby compile failed on a missing libyaml; ecosystem drifts handled post-install: Vite 7.x and TS 5.9.x forced `@vitejs/plugin-react` to 5.2.0.',
      '`git grep` skips untracked files — added `--untracked`; gate self-tested with a planted leak before being trusted.',
      'Axe caught a real violation on the first e2e run: missing `lang` on `<html>`. Fixed in the layout.',
      'First deploy failed twice: a 452 kB test-file chunk in the production bundle, and a missing `rake assets:clean` task.',
    ],
  },
  {
    id: 'm1',
    date: '2026-07-04',
    sourcePath: 'docs/receipts/2026-07-04-m1.md',
    title: 'token engine + `galenti` skin',
    goal: 'Token JSON → compiled skin CSS + typed registry; the `galenti` skin with a hidden `debug` torture-test proving the additive-skin contract.',
    // Receipt said 8 pre-close; a receipt-format fixup landed after. Git span: 9.
    commits: 9,
    range: '2652068..371a976',
    filesChanged: 79,
    insertions: 4300,
    agents: [
      { tier: 'frontier', count: 1, role: 'orchestrator' },
      { tier: 'small', count: 1, role: 'fonts' },
      { tier: 'mid', count: 4, role: 'parallel build' },
      { tier: 'mid', count: 1, role: 'e2e' },
    ],
    moments: [
      'Contract-first: three wave-1 agents bootstrapped generated artifacts by hand; the real build later overwrote with byte-compatible output. Zero rework.',
      'One agent patched sibling files with `@ts-nocheck` to green its own typecheck; integration removed every band-aid.',
      '4 of 18 candidate `galenti` palette pairs failed the first WCAG numeric audit; re-tuned to pass with margin before any file was generated.',
      'Prettier gate exit code swallowed by CLI proxy; autofix line-wrapped a `+` to line-start, turning prose into a nested list. Fixup repaired both.',
    ],
    excerpt:
      'One agent patched two other agents’ files with `@ts-nocheck` to get its own typecheck green (the missing `@types/node` landed seconds later from a sibling). Integration removed every band-aid and re-verified strict TS clean.',
  },
  {
    id: 'm2',
    date: '2026-07-04',
    sourcePath: 'docs/receipts/2026-07-04-m2.md',
    title: 'DS components, all sixteen',
    goal: 'Sixteen DS components built a11y-first and proven across two skins with zero axe violations, each a pure function of the token engine.',
    commits: 6,
    filesChanged: 94,
    insertions: 9800,
    agents: [
      { tier: 'frontier', count: 1, role: 'orchestrator' },
      { tier: 'mid', count: 5, role: 'hero component build' },
      { tier: 'mid', count: 3, role: 'gallery component build' },
      { tier: 'small', count: 8, role: 'gallery component build' },
    ],
    suite: { unit: 339, rspec: 27, e2e: 20 },
    moments: [
      'Button silently dropped onClick in anchor mode; Dialog dismissed on text-selection drag; both caught in frontier review, invisible to agent test suites.',
      'Nav palette had keyboard/visual order divergence — Enter performed a different action than the highlighted row; bounced back with fix list.',
      'Five of twelve concurrent agents stalled on stream watchdog; all resumed from transcripts with a one-line continuation, nothing rebuilt.',
      'Axe caught CodeBlock `role="region"` polluting landmark structure — every unlabeled block announced as a landmark. Swapped to `role="group"`.',
    ],
  },
  {
    id: 'm3',
    date: '2026-07-05',
    sourcePath: 'docs/receipts/2026-07-05-m3.md',
    title: 'manifest + DS doc pages',
    goal: 'Make `/system` a pure function of `data/manifest/*.yml` — Rails model, CI drift gate, and doc pages with live playgrounds on the hero five.',
    commits: 5,
    filesChanged: 97,
    insertions: 7650,
    agents: [
      { tier: 'frontier', count: 1, role: 'orchestrator' },
      { tier: 'mid', count: 5, role: 'parallel build' },
      { tier: 'small', count: 16, role: 'manifest writers' },
    ],
    suite: { unit: 404, rspec: 77, e2e: 57 },
    moments: [
      "Two manifests had the YAML colon-space trap (': ' in prose parsed as a hash); Rails strict validation caught both — now warned in the schema README.",
      'Axe caught `landmark-unique` on the nav doc page; Nav grew a `label` prop — the real APG requirement any multi-nav app hits.',
      'Mid-flight brief update: Nav double-listener conflict messaged to the manifest agent while still writing; the flag was in its YAML when it reported.',
      'Request specs reverted from a fixture copy of button.yml to the real tree — fixture copies silently go stale.',
    ],
  },
  {
    id: 'm4',
    date: '2026-07-05',
    sourcePath: 'docs/receipts/2026-07-05-m4.md',
    title: 'dual-mode shell',
    goal: 'Wire the DS Nav into a real site shell with story mode, skim hub, chapter scaffolds, mode memory, and an on-brand 404.',
    commits: 7,
    filesChanged: 57,
    insertions: 3440,
    agents: [
      { tier: 'frontier', count: 1, role: 'orchestrator' },
      { tier: 'mid', count: 4, role: 'parallel build' },
      { tier: 'small', count: 1, role: '404 page' },
    ],
    suite: { unit: 523, rspec: 84, e2e: 84 },
    moments: [
      'Mid-wave revert: a stray `git restore` wiped orchestrator pre-lands; agents kept building on the missing base. Re-landed from session log in minutes.',
      'Axe caught the escape hatch floating outside landmark structure on every story page; fixed as a labeled `<nav>` wrapper.',
      'EmptyState `titleAs` prop added after the 404 revealed a full page with no h1; drift gate forced component, meta.ts, and manifest to move together.',
      'e2e suite written inline after two verify agents died on infrastructure errors — immediately caught two real app defects.',
    ],
    excerpt:
      'Partway through the parallel wave, every orchestrator wave-0 edit to _tracked_ files vanished — routes, two controllers, and Nav’s `linkAs` — while all agent-created untracked files survived, and agents kept landing edits on top of the now-reverted base.',
  },
  {
    id: 'm5',
    date: '2026-07-05',
    sourcePath: 'docs/receipts/2026-07-05-m5.md',
    title: 'assembly opening + prologue',
    goal: 'GSAP-pinned scroll assembly at `/` and prologue beat; fallback-as-base static diagram for reduced motion; 60fps at 4× CPU throttle or cut.',
    commits: 7,
    filesChanged: 30,
    insertions: 3500,
    agents: [
      { tier: 'frontier', count: 1, role: 'orchestrator' },
      { tier: 'frontier', count: 1, role: 'motion' },
      { tier: 'mid', count: 1, role: 'prologue build' },
      { tier: 'mid', count: 1, role: 'e2e' },
    ],
    suite: { unit: 560, rspec: 84, e2e: 94 },
    moments: [
      'Wrong-directory: a prior `cd` persisted; GSAP installed in the wrong repo. Diagnosed by `git log`; deps reinstalled in the portfolio repo.',
      'Fallback-as-base: static diagram is the DOM base; GSAP dynamic-imports only when motion is allowed — reduced-motion visitors never download animation code.',
      'Headless rAF is not vsync-locked; strict >16.7 ms rule graded normal timing as failure. Moved to median-of-3, verdicts on genuinely missed frames (>25 ms).',
      'Beat numerals at 3.79:1; first fix reached only 4.24:1; moved to full ink — scan runs strict with no exclusions.',
    ],
  },
  {
    id: 'm6',
    date: '2026-07-05',
    sourcePath: 'docs/receipts/2026-07-05-m6.md',
    title: 'rails-era skin + re-theme moment',
    goal: 'One JSON file delivers the `rails-era` skin; Chapter 1 re-themes the site to it as a GSAP-choreographed custom-property swap.',
    commits: 6,
    filesChanged: 19,
    insertions: 2100,
    agents: [
      { tier: 'frontier', count: 1, role: 'orchestrator' },
      { tier: 'mid', count: 2, role: 'parallel build' },
      { tier: 'small', count: 1, role: 'chapter notes' },
      { tier: 'mid', count: 1, role: 'e2e' },
    ],
    suite: { unit: 582, rspec: 84, e2e: 120 },
    moments: [
      'Adding the skin broke a test asserting `skins.length === 2` and exposed literal "2 skins" copy — both now derive from the registry.',
      'Bootstrap-3 accent `#337ab7` corrected to `#2c689c`; strong border `#adadad` to `#808080` — both adjusted to clear WCAG contrast on all surfaces.',
      'Axe failure mid-settle at 0.85 opacity: galenti marginal grays tipped below AA through the alpha blend — test moved to wait for opacity 1 deterministically.',
      'Wrong-ruby trap: `bin/rspec` under system ruby 2.6 gave a bundler error; rtk masked the output — real error only in the tee log.',
    ],
    excerpt:
      'Orchestrator reproduction showed the truth: the shell-level axe matrix scans at nav-visible, which now lands mid-entrance — the settle stagger holds sections at 0.85 opacity, and axe grades galenti’s marginal grays through the alpha blend (3.67:1 readings on annotation text).',
  },
  {
    id: 'm7',
    date: '2026-07-05',
    sourcePath: 'docs/receipts/2026-07-05-m7.md',
    title: 'Figma library parity',
    goal: 'Token JSON drives both CSS and a Figma variable collection; hero five built as bound component sets that mode-switch between skins.',
    // The receipt states no count; a deliberately thin code diff — the heavy
    // artifact is the external Figma library.
    commits: 2,
    range: 'e81595a..3337780',
    agents: [
      // Extraction agent tier not stated in receipt; mid inferred from task complexity.
      { tier: 'frontier', count: 1, role: 'orchestrator' },
      { tier: 'mid', count: 1, role: 'extraction' },
    ],
    suite: { unit: 582, rspec: 84, e2e: 120 },
    moments: [
      'Bindability experiment beat the reference docs: fontSize, fontWeight, and fontFamily all bind; entire type ramp mode-switches with variable-font weights.',
      'Icon-slot INSTANCE_SWAP was dead in all 24 Button variants: spaces in unquoted MCP attribute selectors fail silently; re-linked via `children.find`.',
      'A two-paint fill stack rendered solid black despite correct node data — restructured as an absolute overlay child, matching the actual CSS inset box-shadow.',
      'Effect styles have no modes — shadows cannot mode-switch; four styles ship (`raised`/`overlay` × skin) with the limitation noted in component descriptions.',
    ],
  },
  {
    id: 'm8',
    date: '2026-07-05',
    sourcePath: 'docs/receipts/2026-07-05-m8.md',
    title: 'Studies + live demo',
    goal: 'Study A/B pages and a Polaris live demo — Chores flow, four Rails-served states, inside a CSS-quarantined bundle core routes never fetch.',
    // "Commit list: recorded at close" was never filled in; the milestone's
    // full git span including the staging close-out.
    commits: 11,
    range: 'b8438bb..11b62cb',
    agents: [
      { tier: 'frontier', count: 1, role: 'orchestrator' },
      { tier: 'mid', count: 4, role: 'parallel build' },
      { tier: 'mid', count: 1, role: 'e2e' },
    ],
    suite: { unit: 673, rspec: 122, e2e: 150 },
    moments: [
      'Three layers of platform fiction peeled by first DB-backed request: render.yaml unapplied, managed Postgres uncreated, credentials merging over DATABASE_URL.',
      'Polaris Frame renders its own `<main>`; Frame dropped in favor of Banner — zero axe carve-outs, Polaris included, full rule set enforced.',
      'CSS quarantine: Polaris global resets injected as `<style data-polaris-demo-styles>` on mount, removed on unmount; e2e proves teardown.',
      'Lighthouse first capture: missing meta descriptions, Button disabled-anchor losing its link role, Rack::Deflater mis-ordered — entry chunk served raw.',
    ],
    excerpt:
      'The first DB-backed request in production peeled three layers of latent platform fiction, none visible to any earlier milestone (nothing before M8 ever opened a database connection; `/up` doesn’t check the DB and every prior page is YAML/manifest-backed).',
  },
  {
    id: 'm9',
    date: '2026-07-06',
    sourcePath: 'docs/receipts/2026-07-06-m9.md',
    title: 'Telemetry + OG + résumé + colophon',
    goal: 'Cookieless telemetry instrumented across every surface, server-rendered OG cards, real résumé + colophon, sitemap/robots, and M8 CI riders.',
    // Receipt said 10 pre-close; the CI cold-start dampener landed after. Git span: 11.
    commits: 11,
    range: 'a6f3a36..4cc498e',
    filesChanged: 80,
    insertions: 5700,
    agents: [
      { tier: 'frontier', count: 1, role: 'orchestrator' },
      { tier: 'mid', count: 5, role: 'parallel build' },
      { tier: 'mid', count: 1, role: 'e2e' },
    ],
    suite: { unit: 756, rspec: 199, e2e: 173 },
    moments: [
      "Mid-flight gate rescope: five agents running full suites concurrently would catch each other's in-flight edits as failures; corrected to per-ownership gates.",
      'OG gates all green but screenshots still carried the site Nav — `layout = null` was a named export; Inertia reads `page.default.layout`.',
      'Pre-fix `og:generate` ran headless Chrome against the test DB, committing beacon rows outside spec transactions, breaking two absolute-count specs hours later.',
      'CI: noindex guard fired on CI host (SEO 63 everywhere); mobile `/` cold-63 before warmup. Fixed via CANONICAL_HOST env override and pre-warming seven routes.',
    ],
    excerpt:
      'The template’s `export const layout = null` was a NAMED export, but the Inertia resolver reads `page.default.layout`, so the opt-out never attached and the shell silently wrapped the card — and the unit test asserted the named export, green-lighting the wrong thing.',
  },
]
