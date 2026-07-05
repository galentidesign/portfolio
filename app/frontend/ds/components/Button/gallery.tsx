import { Button } from './Button'

export const galleryMeta = { slug: 'button', title: 'Button' }

const variants = ['primary', 'secondary', 'ghost'] as const
const sizes = ['md', 'sm'] as const

// Simple star icon for iconStart demos
function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 1l1.9 4 4.3.6-3.1 3 .7 4.3L8 11l-3.8 2 .7-4.3-3.1-3 4.3-.6z" />
    </svg>
  )
}

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
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}
      >
        {children}
      </div>
    </div>
  )
}

export default function ButtonGallery() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        padding: 'var(--space-5)',
      }}
    >
      {/* Variant × Size matrix */}
      {variants.map((variant) =>
        sizes.map((size) => (
          <GalleryRow key={`${variant}-${size}`} label={`variant=${variant} size=${size}`}>
            <Button variant={variant} size={size}>
              Button
            </Button>
          </GalleryRow>
        )),
      )}

      {/* iconStart */}
      {variants.map((variant) => (
        <GalleryRow key={`icon-${variant}`} label={`iconStart — ${variant}`}>
          <Button variant={variant} iconStart={<StarIcon />}>
            With icon
          </Button>
          <Button variant={variant} size="sm" iconStart={<StarIcon />}>
            With icon sm
          </Button>
        </GalleryRow>
      ))}

      {/* Busy */}
      {variants.map((variant) => (
        <GalleryRow key={`busy-${variant}`} label={`busy — ${variant}`}>
          <Button variant={variant} busy>
            Saving…
          </Button>
        </GalleryRow>
      ))}

      {/* Disabled */}
      {variants.map((variant) => (
        <GalleryRow key={`disabled-${variant}`} label={`disabled — ${variant}`}>
          <Button variant={variant} disabled>
            Disabled
          </Button>
        </GalleryRow>
      ))}

      {/* href / anchor mode */}
      <GalleryRow label="href (anchor mode)">
        <Button href="https://example.com" variant="primary">
          Link primary
        </Button>
        <Button href="https://example.com" variant="secondary">
          Link secondary
        </Button>
        <Button href="https://example.com" variant="ghost">
          Link ghost
        </Button>
      </GalleryRow>

      {/* Disabled anchor */}
      <GalleryRow label="href + disabled (aria-disabled anchor)">
        <Button href="https://example.com" variant="primary" disabled>
          Disabled link
        </Button>
      </GalleryRow>
    </div>
  )
}
