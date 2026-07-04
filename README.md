# jgalenti.com — portfolio

[![CI](https://github.com/galentidesign/portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/galentidesign/portfolio/actions/workflows/ci.yml)

Personal portfolio of **J Galenti** — design technologist. The site is its own
exhibit: a design-token engine with swappable era skins, a documented component
system, and an agentic build process whose receipts ship inside the story.

## Stack

| Layer              | Version                                       |
| ------------------ | --------------------------------------------- |
| Ruby / Rails       | 3.4.10 / 8.1.3                                |
| PostgreSQL         | 16 (Render managed)                           |
| Node               | 22.23.1                                       |
| React / TypeScript | 19.2.7 / 5.9.3                                |
| Vite / vite_rails  | 7.3.6 / 3.11.1                                |
| Inertia            | inertia_rails 3.21.2 / @inertiajs/react 3.6.0 |
| Motion             | GSAP 3.15                                     |
| Tests              | RSpec 8 · Vitest 4 · Playwright 1.61 (+axe)   |

Rails routing and controllers stay authoritative; every view is a React page
via Inertia. No SSR. No Tailwind — styling is design tokens (CSS custom
properties compiled from JSON) + CSS Modules per component.

## Architecture

```
app/frontend/
  ds/        tokens (JSON → CSS per skin) · components · motion
  shell/     nav, command palette, mode + skin providers
  story/     assembly opening, era chapters
  studies/   case-study layouts + live demo
  pages/     Inertia route-level pages
data/manifest/   component manifest (single source of truth for DS docs)
docs/receipts/   agent-build receipts, captured per session
```

## Development

```sh
bin/setup        # deps + db
bin/dev          # rails + vite
bin/rspec        # rails tests
npm run test:unit
npm run test:e2e
bin/leakcheck    # deny-list content gate (also runs in CI)
```

## License

Code is [MIT](LICENSE). Site content, brand, visual design, and case-study
material are © J Galenti, all rights reserved.
