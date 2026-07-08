// TypeScript shapes for the /gallery pillar — the props ProjectGallery
// (app/models/project_gallery.rb) serves via GalleryController. Image assets are
// placeholder-aware: `available` is false until a real file lands in
// public/gallery/<slug>/, and the frontend renders a labeled placeholder.

export interface GalleryImageAsset {
  /** Served URL, e.g. "/gallery/qwinix-streaming/cover.png". */
  src: string
  alt: string
  /** True when the file exists on disk under public/gallery/. */
  available: boolean
  /** Present on shots, absent on covers. */
  caption?: string | null
}

/** Light shape for the index grid (detail-only fields dropped). */
export interface ProjectCard {
  slug: string
  title: string
  role: string
  client: string
  year: string
  featured: boolean
  disciplines: string[]
  summary: string
  /** null for a text-only entry with no cover. */
  cover: GalleryImageAsset | null
}

/** Full shape for the detail page. */
export interface ProjectEntry extends ProjectCard {
  overview: string
  highlights: string[]
  shots: GalleryImageAsset[]
  links: {
    live: string | null
    external: string | null
  }
}

export interface SiblingRef {
  slug: string
  title: string
}

export interface Siblings {
  prev: SiblingRef | null
  next: SiblingRef | null
}
