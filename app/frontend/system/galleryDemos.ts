import type { ComponentType } from 'react'

interface GalleryModule {
  galleryMeta: { slug: string }
  default: ComponentType
}

const modules = import.meta.glob<GalleryModule>('../ds/components/*/gallery.tsx', { eager: true })

/**
 * Map from manifest slug → gallery demo component.
 *
 * Seam: `vi.mock('@/system/galleryDemos')` in unit tests so test suites can
 * inject fake demos without running Vite's glob at collection time.
 */
export const galleryDemos: Record<string, ComponentType | undefined> = Object.fromEntries(
  Object.values(modules)
    .filter((m) => Boolean(m.galleryMeta?.slug && m.default))
    .map((m) => [m.galleryMeta.slug, m.default] as [string, ComponentType]),
)
