import { Skeleton } from './Skeleton'

export const galleryMeta = { slug: 'skeleton', title: 'Skeleton / Loading' }

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
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}
      >
        {children}
      </div>
    </div>
  )
}

export default function SkeletonGallery() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        padding: 'var(--space-5)',
      }}
    >
      {/* Text shape — default 3 lines */}
      <GalleryRow label="shape=text (default 3 lines)">
        <div style={{ minWidth: '12rem' }}>
          <Skeleton shape="text" />
        </div>
      </GalleryRow>

      {/* Text shape — 1 line */}
      <GalleryRow label="shape=text (1 line)">
        <div style={{ minWidth: '12rem' }}>
          <Skeleton shape="text" lines={1} />
        </div>
      </GalleryRow>

      {/* Block shape — various heights */}
      <GalleryRow label="shape=block (height=6rem, default)">
        <div style={{ width: '16rem' }}>
          <Skeleton shape="block" />
        </div>
      </GalleryRow>

      <GalleryRow label="shape=block (height=3rem)">
        <div style={{ width: '16rem' }}>
          <Skeleton shape="block" height="3rem" />
        </div>
      </GalleryRow>

      <GalleryRow label="shape=block (custom 10rem × 8rem)">
        <Skeleton shape="block" width="10rem" height="8rem" />
      </GalleryRow>

      {/* Circle shape — various sizes */}
      <GalleryRow label="shape=circle (default 3rem)">
        <Skeleton shape="circle" />
      </GalleryRow>

      <GalleryRow label="shape=circle (custom sizes)">
        <Skeleton shape="circle" width="2rem" />
        <Skeleton shape="circle" width="4rem" />
        <Skeleton shape="circle" width="5rem" />
      </GalleryRow>

      {/* Composed: card loading state */}
      <GalleryRow label="composed: card loading (avatar + text)">
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-control)',
            width: '20rem',
          }}
        >
          <Skeleton shape="circle" width="3rem" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Skeleton shape="text" lines={1} />
            <Skeleton shape="text" lines={2} />
          </div>
        </div>
      </GalleryRow>

      {/* Composed: content loading state */}
      <GalleryRow label="composed: content loading (image + text)">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            width: '20rem',
          }}
        >
          <Skeleton shape="block" height="8rem" />
          <div>
            <Skeleton shape="text" lines={1} />
          </div>
          <div>
            <Skeleton shape="text" lines={3} />
          </div>
        </div>
      </GalleryRow>
    </div>
  )
}
