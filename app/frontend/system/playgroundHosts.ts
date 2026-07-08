import type { PlaygroundModule } from '@/ds/components/playground'

const modules = import.meta.glob<PlaygroundModule>('../ds/components/*/playground.tsx', {
  eager: true,
})

/**
 * Map from manifest slug → playground host module.
 *
 * Undefined when a component ships no playground.tsx — a few content-driven
 * components (prose, skin-switcher, tabs) omit one. The doc page skips the
 * Playground section when the slug is absent from this map.
 *
 * Seam: `vi.mock('@/system/playgroundHosts')` in unit tests.
 */
export const playgroundHosts: Record<string, PlaygroundModule | undefined> = Object.fromEntries(
  Object.values(modules)
    .filter((m) => Boolean(m.playgroundMeta?.slug))
    .map((m) => [m.playgroundMeta.slug, m] as [string, PlaygroundModule]),
)
