import { Card } from './Card'

export const galleryMeta = { slug: 'card', title: 'Card' }

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {children}
      </div>
    </div>
  )
}

export default function CardGallery() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        padding: 'var(--space-5)',
        maxWidth: '600px',
      }}
    >
      {/* Basic card */}
      <GalleryRow label="Basic card">
        <Card>This is a basic card with just content and no title or footer.</Card>
      </GalleryRow>

      {/* Card with title */}
      <GalleryRow label="With title">
        <Card title="Card Title">
          This card has a title that appears at the top. The title is styled using type-title
          tokens.
        </Card>
      </GalleryRow>

      {/* Card with footer */}
      <GalleryRow label="With footer">
        <Card title="Card with Footer" footer="Last updated: Today">
          Main content goes here. The footer appears at the bottom with a separator line.
        </Card>
      </GalleryRow>

      {/* Flush card (no padding) */}
      <GalleryRow label="Flush (no padding)">
        <Card flush title="Image Card">
          <img
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23e0e0e0' width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='system-ui' font-size='16' fill='%23999'%3EMedia content (flush removes padding)%3C/text%3E%3C/svg%3E"
            alt="Placeholder"
            style={{ width: '100%', display: 'block' }}
          />
        </Card>
      </GalleryRow>

      {/* Card with href (link card) */}
      <GalleryRow label="With href (link card)">
        <Card href="https://example.com" title="Linked Card">
          This entire card is clickable and acts as a link. Hover to see the transform effect.
        </Card>
      </GalleryRow>

      {/* Link card with footer */}
      <GalleryRow label="Link card with footer">
        <Card href="https://example.com" title="Article Preview" footer="Read time: 5 min">
          A complete example with title, content, footer, and link affordance. The entire card is
          interactive.
        </Card>
      </GalleryRow>
    </div>
  )
}
