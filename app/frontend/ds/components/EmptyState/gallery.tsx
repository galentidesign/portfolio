import { EmptyState } from './EmptyState'

export const galleryMeta = { slug: 'empty-state', title: 'Empty State' }

function GalleryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span
        style={{
          fontFamily: 'var(--type-mono-family)',
          fontSize: 'var(--type-mono-size)',
          color: 'var(--color-ink-muted)',
        }}
      >
        {label}
      </span>
      <div style={{ padding: 'var(--space-4)', background: 'var(--color-surface-sunken)' }}>
        {children}
      </div>
    </div>
  )
}

export default function EmptyStateGallery() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        padding: 'var(--space-5)',
      }}
    >
      {/* Title only */}
      <GalleryRow label="Title only">
        <EmptyState title="No results found" />
      </GalleryRow>

      {/* Title + description */}
      <GalleryRow label="Title + description">
        <EmptyState
          title="No results found"
          description="Try adjusting your search terms or clearing your filters to see more results."
        />
      </GalleryRow>

      {/* Full: icon + description + action */}
      <GalleryRow label="Full: icon + description + action">
        <EmptyState
          title="Nothing here yet"
          description="Get started by creating your first item. It only takes a moment."
          icon={<span style={{ fontSize: '2em' }}>◌</span>}
          action={<button type="button">Create item</button>}
        />
      </GalleryRow>
    </div>
  )
}
