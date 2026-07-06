# jgalenti.com — portfolio

[![CI](https://github.com/galentidesign/portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/galentidesign/portfolio/actions/workflows/ci.yml)

Live: <https://jgalenti.com>

Personal portfolio of **J Galenti** — design technologist. The site is its own
exhibit: a design-token engine with swappable era skins, a documented component
system, and an agentic build process whose receipts ship inside the story.

> Design technologist — I architect enterprise-scale design systems, ship them in production code, and write the agentic-AI playbook for design orgs.

## Stack

| Layer              | Version                                       |
| ------------------ | --------------------------------------------- |
| Ruby / Rails       | 3.4.10 / 8.1.3                                |
| PostgreSQL         | 18 (Render managed)                           |
| Node               | 22.23.1                                       |
| React / TypeScript | 19.2.7 / 5.9.3                                |
| Vite / vite_rails  | 7.3.6 / 3.11.1                                |
| Inertia            | inertia_rails 3.21.2 / @inertiajs/react 3.6.0 |
| Motion             | GSAP 3.15                                     |
| Tests              | RSpec 8 · Vitest 4 · Playwright 1.61 (+axe)   |

## Architecture

```
app/frontend/
  ds/
    tokens/      *.tokens.json → tokens:build → generated/ (CSS per skin · skins.ts)
    components/  each: .tsx · styles.module.css · meta.ts · test
    motion/      useMotionPref gate, GSAP helpers
  shell/     nav, command palette, mode + skin providers
  story/     assembly opening, era chapters
  studies/   case-study layouts + live demo
  pages/     Inertia route-level pages
data/manifest/   component manifest (single source of truth for DS docs)
docs/receipts/   agent-build receipts, captured per session
```

Token pipeline: `ds/tokens/*.tokens.json` → `npm run tokens:build` →
`ds/tokens/generated/` (git-ignored) with per-skin CSS custom properties and a
`skins.ts` registry → `[data-skin]` attribute scoping; components consume
semantic tokens only (`--color-*`, `--radius-*`, `--type-*`); `--raw-*`
primitives live only in generated CSS.

Serving: Rails routes/controllers → Inertia bridge → React pages (no SSR);
OG/meta tags are server-rendered by the Rails layout.

## Quality

The CI `lighthouse` job asserts ≥ 95 in all four categories, mobile + desktop,
on every key route (mobile performance floors at 90 on CI's gzip-only serving).
Official captures are written by `rake craft:capture` into `data/craft.json`
and rendered at <https://jgalenti.com/colophon>.

## Development

```sh
bin/setup             # deps + db
npm run tokens:build  # compile JSON tokens → generated/
bin/dev               # rails + vite
bin/rspec             # rails tests
npm run test:unit
npm run test:e2e
bin/leakcheck         # deny-list content gate (also runs in CI)
```

## Links

- Design-system docs: <https://jgalenti.com/system>
- Public Figma library: <https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio>
- Agent-build receipts: `docs/receipts/` (per-session, Ch3 source material)

## License

Code is [MIT](LICENSE). Site content, brand, visual design, and case-study
material are © J Galenti, all rights reserved.
